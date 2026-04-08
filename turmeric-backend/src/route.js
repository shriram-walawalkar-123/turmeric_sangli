const express = require("express");
const router = express.Router();
const {
  addHarvest,
  addProcessing,
  addDistributor,
  addSupplier,
  addShopkeeper,
  addPacket,
  addPacketsInBatch,
  createPackets,
  getCurrentNonce,
  setBatchProcessing,
  getPacket,
  getHarvest,
  getProcessing,
  getDistributor,
  getSupplier,
  getShopkeeper,
  getBatchPacketCount,
  batchExists,
  packetIdExists,
  getAllFarmersAndBatches,
  getBatchesForFarmer,
  getAllFarmers,
  getHarvestForBatch,
  getBatchProcessing,
  validatePacketForStage,
  markPacketSold,
  isPacketSold,
} = require('./services/contractService');
const { stageGuard, stageGuardAny } = require('./middleware/stageRole');
const BatchStock = require('./models/BatchStock');
const Packet = require('./models/Packet');
const { getProvider, getContract } = require('./config/blockchain');
const { ethers } = require('ethers');

const PROCESSING_LOSS_PERCENT = 8;

// ---------------- On-chain packet queries (NO MongoDB) ----------------
async function getPacketsForBatchFromChain(batchId) {
  const contract = getContract();
  const provider = getProvider();
  const address = contract.target || contract.address;
  const iface = contract.interface;

  const topicRegistered = iface.getEvent('PacketRegisteredPlain').topicHash;
  const topicStageUpdated = iface.getEvent('PacketStageUpdated').topicHash;

  // 1) Find all PacketRegistered events, then filter by batchId
  const regLogs = await provider.getLogs({
    address,
    topics: [topicRegistered],
    fromBlock: 0,
    toBlock: 'latest',
  });

  const packets = new Map(); // packetId -> { batchId, stage }
  for (const log of regLogs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      const pid = String(parsed.args?.unique_packet_id ?? parsed.args?.[0] ?? '');
      const bId = String(parsed.args?.batch_id ?? parsed.args?.[1] ?? '');
      const stage = String(parsed.args?.current_stage ?? parsed.args?.[2] ?? '');
      if (bId === batchId && pid) {
        packets.set(pid, { batchId: bId, stage });
      }
    } catch (_) {}
  }

  if (packets.size === 0) return [];

  // 2) Apply stage updates (for our packet IDs only)
  const topicStageUpdatedPlain = iface.getEvent('PacketStageUpdatedPlain').topicHash;
  const stageLogs = await provider.getLogs({ address, topics: [topicStageUpdatedPlain], fromBlock: 0, toBlock: 'latest' });
  for (const log of stageLogs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      const pid = String(parsed.args?.unique_packet_id ?? parsed.args?.[0] ?? '');
      const newStage = String(parsed.args?.new_stage ?? parsed.args?.[2] ?? '');
      if (packets.has(pid) && newStage) {
        packets.set(pid, { batchId, stage: newStage });
      }
    } catch (_) {}
  }

  return Array.from(packets.entries()).map(([packet_id, v]) => ({ packet_id, batch_id: v.batchId, current_stage: v.stage }));
}

async function getPacketIdsByBatchAndStageFromChain(batchId, stage) {
  const all = await getPacketsForBatchFromChain(batchId);
  return all.filter((p) => p.current_stage === stage).map((p) => p.packet_id).sort();
}

function requireFields(obj, fields) {
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

// ---------------- POST ROUTES ---------------- //

// Harvest (quantity_gm optional; if provided, creates BatchStock with 8% processing loss)
router.post("/harvest", stageGuard('farmer'), async (req, res) => {
  try {
    requireFields(req.body, [
      'batch_id', 'farmer_id', 'product_name', 'harvest_date', 'gps_coordinates', 'fertilizer', 'organic_status'
    ]);
    const quantityGm = req.body.quantity_gm != null ? Number(req.body.quantity_gm) : 0;
    const payload = { ...req.body, quantity_gm: quantityGm };

    const tx = await addHarvest(payload);
    const receipt = await tx.wait();

    if (quantityGm > 0) {
      const availableGm = Math.floor(quantityGm * (1 - PROCESSING_LOSS_PERCENT / 100));
      await BatchStock.findOneAndUpdate(
        { batch_id: req.body.batch_id },
        { farmer_id: req.body.farmer_id, batch_id: req.body.batch_id, quantity_gm: quantityGm, available_gm: availableGm, used_gm: 0, packet_ids: [] },
        { upsert: true, new: true }
      );
    }
    res.status(200).json({ message: "Harvest recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Processing
router.post("/processing", stageGuard('processing'), async (req, res) => {
  console.log("Processing data received ok shriram: ",req.body);
  try {
    requireFields(req.body, [
      'batch_id', 'processing_gps', 'grinding_facility_name', 'moisture_content', 'curcumin_content',
      'heavy_metals', 'physical_properties', 'packaging_date', 'packaging_unit', 'packet_id', 'expiry_date',
      'sending_box_code', 'distributor_id'
    ]);

    // Check if packet already exists (uses updated ABI)
    const packetExistsCheck = await packetIdExists(req.body.packet_id);
    if (packetExistsCheck) {
      return res.status(400).json({ error: "Packet ID already exists. Each packet must be unique." });
    }

    // Verify batch exists
    const batchExistsCheck = await batchExists(req.body.batch_id);
    if (!batchExistsCheck) {
      return res.status(400).json({ error: "Batch ID does not exist. Harvest must be registered first." });
    }

    console.log("Processing data received ok shriram: ",req.body);

    // First record the processing details on-chain
    const tx = await addProcessing(req.body);
    const receipt = await tx.wait();

    // Then register the packet in the dedicated packets mapping so that
    // distributor/supplier/shopkeeper stages can validate and use this packet_id.
    // Packet should exist and stay valid across stages until shopkeeper consumes it.
    try {
      const packetTx = await addPacket({
        unique_packet_id: req.body.packet_id,
        batch_id: req.body.batch_id,
        current_stage: 'processing',
      });
      await packetTx.wait();
    } catch (packetError) {
      // If packet registration fails, surface a clear message while preserving
      // the original processing transaction result.
      console.error('Failed to register packet after processing:', packetError);
      const msg =
        packetError?.error?.message ||
        packetError?.reason ||
        packetError?.message ||
        String(packetError);
      return res
        .status(500)
        .json({ error: `Processing saved but packet registration failed: ${msg}` });
    }

    res.status(200).json({ message: "Processing recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    // Surface contract revert messages nicely
    const msg = error?.error?.message || error?.reason || error?.message || String(error);
    res.status(error.status || 500).json({ error: msg });
  }
});

// Distributor (single packet - legacy)
router.post("/distributor", stageGuard('distributor'), async (req, res) => {
  try {
    requireFields(req.body, [
      'packet_id', 'distributor_id', 'gps_coordinates', 'received_box_code', 'dispatch_date', 'sending_box_code', 'supplier_id'
    ]);
    const validation = await validatePacketForStage(req.body.packet_id, 'distributor');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    const tx = await addDistributor(req.body);
    const receipt = await tx.wait();
    await Packet.findOneAndUpdate(
      { packet_id: req.body.packet_id },
      { current_stage: 'distributor' },
      { new: true }
    );
    res.status(200).json({ message: "Distributor recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Receive packets from processing → distributor (bulk: batch_id, farmer_id, count + stage fields)
router.post("/distributor/receive", stageGuard('distributor'), async (req, res) => {
  try {
    const { batch_id, farmer_id, count, distributor_id, gps_coordinates, received_box_code, dispatch_date, sending_box_code, supplier_id } = req.body;
    requireFields(req.body, ['batch_id', 'count', 'distributor_id', 'gps_coordinates', 'received_box_code', 'dispatch_date', 'sending_box_code', 'supplier_id']);
    const numCount = Math.max(0, parseInt(count, 10));
    if (numCount === 0) {
      return res.status(400).json({ error: "Count must be at least 1." });
    }
    const available = await getPacketIdsByBatchAndStageFromChain(batch_id, 'processing');
    const ids = available.slice(0, numCount);
    if (ids.length < numCount) return res.status(400).json({ error: `Only ${ids.length} packet(s) available at processing for this batch. Requested: ${numCount}.` });

    console.log(`[distributor/receive] Processing ${ids.length} packet(s) for batch ${batch_id}:`);

    for (let i = 0; i < ids.length; i++) {
      const packet_id = ids[i];

      console.log(`  [${i + 1}/${ids.length}] Sending packet to distributor: ${packet_id}`);

      const validation = await validatePacketForStage(packet_id, 'distributor');
      if (!validation.valid) {
        console.log(`  [${i + 1}/${ids.length}] FAILED validation: ${packet_id} — ${validation.message}`);
        return res.status(400).json({ error: `Packet ${packet_id}: ${validation.message}` });
      }
      const tx = await addDistributor({
        packet_id,
        distributor_id: req.body.distributor_id,
        gps_coordinates: req.body.gps_coordinates,
        received_box_code: req.body.received_box_code,
        dispatch_date: req.body.dispatch_date,
        sending_box_code: req.body.sending_box_code,
        supplier_id: req.body.supplier_id,
      });
      await tx.wait();

      console.log(`  [${i + 1}/${ids.length}] SUCCESS: ${packet_id} → distributor (txHash: ${tx.hash})`);
    }

    console.log(`[distributor/receive] Done. All ${ids.length} packet(s) moved to distributor.`);
    res.status(200).json({ message: `Received ${numCount} packet(s) at distributor.`, packetIds: ids });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Supplier (single packet - legacy)
router.post("/supplier", stageGuard('supplier'), async (req, res) => {
  try {
    requireFields(req.body, [
      'packet_id', 'supplier_id', 'received_box_code', 'gps_coordinates', 'receipt_date', 'shopkeeper_id'
    ]);
    const validation = await validatePacketForStage(req.body.packet_id, 'supplier');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    const tx = await addSupplier(req.body);
    const receipt = await tx.wait();
    await Packet.findOneAndUpdate(
      { packet_id: req.body.packet_id },
      { current_stage: 'supplier' },
      { new: true }
    );
    res.status(200).json({ message: "Supplier recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Receive packets from distributor → supplier (bulk)
router.post("/supplier/receive", stageGuard('supplier'), async (req, res) => {
  try {
    const { batch_id, count, supplier_id, received_box_code, gps_coordinates, receipt_date, shopkeeper_id } = req.body;
    requireFields(req.body, ['batch_id', 'count', 'supplier_id', 'received_box_code', 'gps_coordinates', 'receipt_date', 'shopkeeper_id']);
    const numCount = Math.max(0, parseInt(count, 10));
    if (numCount === 0) {
      return res.status(400).json({ error: "Count must be at least 1." });
    }
    const available = await getPacketIdsByBatchAndStageFromChain(batch_id, 'distributor');
    const ids = available.slice(0, numCount);
    if (ids.length < numCount) return res.status(400).json({ error: `Only ${ids.length} packet(s) available at distributor for this batch. Requested: ${numCount}.` });

    console.log(`[supplier/receive] Processing ${ids.length} packet(s) for batch ${batch_id}:`);

    for (let i = 0; i < ids.length; i++) {
      const packet_id = ids[i];

      console.log(`  [${i + 1}/${ids.length}] Sending packet to supplier: ${packet_id}`);

      const validation = await validatePacketForStage(packet_id, 'supplier');
      if (!validation.valid) {
        console.log(`  [${i + 1}/${ids.length}] FAILED validation: ${packet_id} — ${validation.message}`);
        return res.status(400).json({ error: `Packet ${packet_id}: ${validation.message}` });
      }
      const tx = await addSupplier({
        packet_id,
        supplier_id: req.body.supplier_id,
        received_box_code: req.body.received_box_code,
        gps_coordinates: req.body.gps_coordinates,
        receipt_date: req.body.receipt_date,
        shopkeeper_id: req.body.shopkeeper_id,
      });
      await tx.wait();

      console.log(`  [${i + 1}/${ids.length}] SUCCESS: ${packet_id} → supplier (txHash: ${tx.hash})`);
    }

    console.log(`[supplier/receive] Done. All ${ids.length} packet(s) moved to supplier.`);
    res.status(200).json({ message: `Received ${numCount} packet(s) at supplier.`, packetIds: ids });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Shopkeeper (single packet - legacy)
router.post("/shopkeeper", stageGuard('shopkeeper'), async (req, res) => {
  try {
    requireFields(req.body, [
      'packet_id', 'shopkeeper_id', 'gps_coordinates', 'date_received'
    ]);
    const validation = await validatePacketForStage(req.body.packet_id, 'shopkeeper');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    const tx = await addShopkeeper(req.body);
    const receipt = await tx.wait();
    await Packet.findOneAndUpdate(
      { packet_id: req.body.packet_id },
      { current_stage: 'shopkeeper' },
      { new: true }
    );
    res.status(200).json({ message: "Shopkeeper recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Receive packets from supplier → shopkeeper (bulk)
router.post("/shopkeeper/receive", stageGuard('shopkeeper'), async (req, res) => {
  try {
    const { batch_id, count, shopkeeper_id, gps_coordinates, date_received } = req.body;
    requireFields(req.body, ['batch_id', 'count', 'shopkeeper_id', 'gps_coordinates', 'date_received']);
    const numCount = Math.max(0, parseInt(count, 10));
    if (numCount === 0) {
      return res.status(400).json({ error: "Count must be at least 1." });
    }
    const available = await getPacketIdsByBatchAndStageFromChain(batch_id, 'supplier');
    const ids = available.slice(0, numCount);
    if (ids.length < numCount) return res.status(400).json({ error: `Only ${ids.length} packet(s) available at supplier for this batch. Requested: ${numCount}.` });

    console.log(`[shopkeeper/receive] Processing ${ids.length} packet(s) for batch ${batch_id}:`);

    for (let i = 0; i < ids.length; i++) {
      const packet_id = ids[i];

      console.log(`  [${i + 1}/${ids.length}] Sending packet to shopkeeper: ${packet_id}`);

      const validation = await validatePacketForStage(packet_id, 'shopkeeper');
      if (!validation.valid) {
        console.log(`  [${i + 1}/${ids.length}] FAILED validation: ${packet_id} — ${validation.message}`);
        return res.status(400).json({ error: `Packet ${packet_id}: ${validation.message}` });
      }
      const tx = await addShopkeeper({
        packet_id,
        shopkeeper_id: req.body.shopkeeper_id,
        gps_coordinates: req.body.gps_coordinates,
        date_received: req.body.date_received,
      });
      await tx.wait();

      console.log(`  [${i + 1}/${ids.length}] SUCCESS: ${packet_id} → shopkeeper (txHash: ${tx.hash})`);
    }

    console.log(`[shopkeeper/receive] Done. All ${ids.length} packet(s) moved to shopkeeper.`);
    res.status(200).json({ message: `Received ${numCount} packet(s) at shopkeeper.`, packetIds: ids });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Packet
router.post("/packet", stageGuard('processing'), async (req, res) => {
  try {
    requireFields(req.body, ['unique_packet_id', 'batch_id', 'current_stage']);
    const tx = await addPacket(req.body);
    const receipt = await tx.wait();
    res.status(200).json({ message: "Packet recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// ---------------- GET JOURNEY ---------------- //
router.get("/journey/:packetId", async (req, res) => {
  try {
    const packetId = req.params.packetId;
    const packetRaw = await getPacket(packetId);
    const distributorRaw = await getDistributor(packetId);
    const supplierRaw = await getSupplier(packetId);
    const shopkeeperRaw = await getShopkeeper(packetId);

    const packet = packetRaw.exists ? {
      unique_packet_id: packetRaw.unique_packet_id,
      batch_id: packetRaw.batch_id,
      current_stage: packetRaw.current_stage,
      exists: packetRaw.exists
    } : null;

    const batchId = packet?.batch_id;
    const harvestRaw = batchId ? await getHarvest(batchId) : null;
    let processingRaw = batchId ? await getProcessing(batchId) : null;
    let batchProcessingRaw = null;
    try {
      if (batchId) batchProcessingRaw = await getBatchProcessing(batchId);
    } catch (_) { /* old contract may not have getBatchProcessing */ }

    const harvest = harvestRaw?.batch_id ? {
      farmer_id: harvestRaw.farmer_id,
      product_name: harvestRaw.product_name,
      batch_id: harvestRaw.batch_id,
      harvest_date: harvestRaw.harvest_date,
      gps_coordinates: harvestRaw.gps_coordinates,
      fertilizer: harvestRaw.fertilizer,
      organic_status: harvestRaw.organic_status,
      quantity_gm: harvestRaw.quantity_gm != null ? String(harvestRaw.quantity_gm) : undefined
    } : null;

    const processingFromBatch = batchProcessingRaw?.batch_id ? {
      batch_id: batchProcessingRaw.batch_id,
      processing_gps: batchProcessingRaw.processing_gps,
      grinding_facility_name: batchProcessingRaw.grinding_facility_name,
      moisture_content: String(batchProcessingRaw.moisture_content ?? 0),
      curcumin_content: String(batchProcessingRaw.curcumin_content ?? 0),
      heavy_metals: batchProcessingRaw.heavy_metals,
      physical_properties: batchProcessingRaw.physical_properties,
      packaging_date: batchProcessingRaw.packaging_date,
      packaging_unit: batchProcessingRaw.packaging_unit,
      packet_id: packetId,
      expiry_date: batchProcessingRaw.expiry_date,
      sending_box_code: batchProcessingRaw.sending_box_code,
      distributor_id: batchProcessingRaw.distributor_id
    } : null;

    const processingLegacy = processingRaw?.batch_id ? {
      batch_id: processingRaw.batch_id,
      processing_gps: processingRaw.processing_gps,
      grinding_facility_name: processingRaw.grinding_facility_name,
      moisture_content: processingRaw.moisture_content?.toString?.() ?? '',
      curcumin_content: processingRaw.curcumin_content?.toString?.() ?? '',
      heavy_metals: processingRaw.heavy_metals,
      physical_properties: processingRaw.physical_properties,
      packaging_date: processingRaw.packaging_date,
      packaging_unit: processingRaw.packaging_unit,
      packet_id: processingRaw.packet_id,
      expiry_date: processingRaw.expiry_date,
      sending_box_code: processingRaw.sending_box_code,
      distributor_id: processingRaw.distributor_id
    } : null;

    const processing = processingLegacy || processingFromBatch;

    const distributor = distributorRaw?.distributor_id ? {
      distributor_id: distributorRaw.distributor_id,
      gps_coordinates: distributorRaw.gps_coordinates,
      received_box_code: distributorRaw.received_box_code,
      dispatch_date: distributorRaw.dispatch_date,
      sending_box_code: distributorRaw.sending_box_code,
      supplier_id: distributorRaw.supplier_id
    } : null;

    const supplier = supplierRaw?.supplier_id ? {
      supplier_id: supplierRaw.supplier_id,
      received_box_code: supplierRaw.received_box_code,
      gps_coordinates: supplierRaw.gps_coordinates,
      receipt_date: supplierRaw.receipt_date,
      shopkeeper_id: supplierRaw.shopkeeper_id,
      packet_id: supplierRaw.packet_id
    } : null;

    const shopkeeper = shopkeeperRaw?.shopkeeper_id ? {
      shopkeeper_id: shopkeeperRaw.shopkeeper_id,
      packet_id: shopkeeperRaw.packet_id,
      gps_coordinates: shopkeeperRaw.gps_coordinates,
      date_received: shopkeeperRaw.date_received
    } : null;

    res.status(200).json({ packet, harvest, processing, distributor, supplier, shopkeeper });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// ---------------- NEW ENDPOINTS FOR PROCESSING FORM ----------------
// Get all farmers
router.get("/farmers", async (req, res) => {
  try {
    const farmers = await getAllFarmers();
    console.log("farmer list from backend is :",farmers)
    res.status(200).json({ farmers });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get all batches (flattened from on-chain HarvestRecorded events)
router.get("/batches", async (req, res) => {
  try {
    const farmerMap = await getAllFarmersAndBatches();
    const batchIds = Array.from(new Set(Object.values(farmerMap || {}).flat()));
    res.status(200).json({ batches: batchIds });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get batches for a farmer (includes packet count and available quantity from BatchStock)
router.get("/farmers/:farmerId/batches", async (req, res) => {
  try {
    const { farmerId } = req.params;
    const batches = await getBatchesForFarmer(farmerId);

    const batchesWithCount = await Promise.all(
      batches.map(async (batchId) => {
        try {
          const count = await getBatchPacketCount(batchId);
          const harvest = await getHarvestForBatch(batchId);
          const stock = await ensureBatchStock(batchId);
          const availableGm = stock ? (stock.available_gm || 0) - (stock.used_gm || 0) : null;
          return {
            batchId,
            packetCount: count.toString(),
            harvestDate: harvest?.harvest_date || '',
            productName: harvest?.product_name || '',
            availableGm: availableGm != null ? availableGm : null,
            quantityGm: stock?.quantity_gm ?? (harvest?.quantity_gm != null ? Number(harvest.quantity_gm) : null),
          };
        } catch (err) {
          return {
            batchId,
            packetCount: '0',
            harvestDate: '',
            productName: '',
            availableGm: null,
            quantityGm: null,
          };
        }
      })
    );

    res.status(200).json({ batches: batchesWithCount });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get packet count for a batch
router.get("/batches/:batchId/packet-count", async (req, res) => {
  try {
    const { batchId } = req.params;
    const count = await getBatchPacketCount(batchId);
    const exists = await batchExists(batchId);
    
    res.status(200).json({ 
      batchId,
      packetCount: count.toString(),
      exists
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Cleanup invalid packet IDs in MongoDB (IDs that don't exist on-chain).
// This is mainly for older data where packet_id was generated off-chain with millisecond timestamps.
router.post(
  "/batches/:batchId/cleanup-invalid-packets",
  stageGuardAny(['processing', 'distributor', 'supplier', 'shopkeeper']),
  async (req, res) => {
    try {
      const { batchId } = req.params;
      const mode = String(req.query.mode || 'ms'); // ms | onchain

      let deleted = 0;

      if (mode === 'ms') {
        // Old bad format: ends with "-<13 digits>" (Date.now() ms)
        const result = await Packet.deleteMany({ batch_id: batchId, packet_id: /-\d{13}$/ });
        deleted = result?.deletedCount || 0;
      } else if (mode === 'onchain') {
        // Strong cleanup: check every packet in this batch against chain
        const list = await Packet.find({ batch_id: batchId }).select('packet_id').lean();
        for (const p of list) {
          const exists = await packetIdExists(p.packet_id);
          if (!exists) {
            const r = await Packet.deleteOne({ packet_id: p.packet_id });
            deleted += r?.deletedCount || 0;
          }
        }
      } else {
        return res.status(400).json({ error: "Invalid mode. Use ms|onchain." });
      }

      res.status(200).json({ message: "Cleanup completed.", batchId, deleted, mode });
    } catch (error) {
      res.status(500).json({ error: error.message || String(error) });
    }
  }
);

// Ensure BatchStock exists for batch (create from harvest.quantity_gm if missing)
async function ensureBatchStock(batchId) {
  let stock = await BatchStock.findOne({ batch_id: batchId }).lean();
  if (stock) return stock;
  const harvest = await getHarvestForBatch(batchId);
  const quantityGm = harvest?.quantity_gm != null ? Number(harvest.quantity_gm) : 0;
  if (quantityGm > 0) {
    const availableGm = Math.floor(quantityGm * (1 - PROCESSING_LOSS_PERCENT / 100));
    await BatchStock.findOneAndUpdate(
      { batch_id: batchId },
      {
        farmer_id: harvest.farmer_id || '',
        batch_id: batchId,
        quantity_gm: quantityGm,
        available_gm: availableGm,
        used_gm: 0,
        packet_ids: [],
      },
      { upsert: true, new: true }
    );
    stock = await BatchStock.findOne({ batch_id: batchId }).lean();
  }
  return stock;
}

// Get batch stock info: available quantity (after 8% loss), max packets for a given packet_size_gm
router.get("/batches/:batchId/info", async (req, res) => {
  try {
    const { batchId } = req.params;
    const packetSizeGm = req.query.packet_size_gm ? Number(req.query.packet_size_gm) : null;
    const exists = await batchExists(batchId);
    if (!exists) {
      return res.status(404).json({ error: "Batch not found." });
    }
    const stock = await ensureBatchStock(batchId);
    const availableGm = stock ? (stock.available_gm || 0) - (stock.used_gm || 0) : 0;
    const maxPackets = packetSizeGm && packetSizeGm > 0 && availableGm > 0
      ? Math.floor(availableGm / packetSizeGm)
      : null;
    const harvest = await getHarvestForBatch(batchId);
    res.status(200).json({
      batchId,
      farmerId: harvest?.farmer_id || null,
      quantityGm: stock?.quantity_gm ?? (harvest?.quantity_gm != null ? Number(harvest.quantity_gm) : null),
      availableGm,
      usedGm: stock?.used_gm ?? 0,
      packetSizeGm: packetSizeGm || null,
      maxPackets,
      exists: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Create multiple packets from batch (processing stage): packet_size_gm, count, + batch-level processing fields
router.post("/batches/:batchId/create-packets", stageGuard('processing'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const { packet_size_gm, count, processing_gps, grinding_facility_name, moisture_content, curcumin_content, heavy_metals, physical_properties, packaging_date, packaging_unit, expiry_date, sending_box_code, distributor_id } = req.body;
    requireFields(req.body, ['packet_size_gm', 'count']);
    const numCount = Math.max(0, parseInt(count, 10));
    if (numCount === 0) {
      return res.status(400).json({ error: "Count must be at least 1." });
    }
    const packetSizeGm = Number(packet_size_gm);
    if (!packetSizeGm || packetSizeGm <= 0) {
      return res.status(400).json({ error: "Packet size (gm) must be a positive number." });
    }
    const batchExistsCheck = await batchExists(batchId);
    if (!batchExistsCheck) {
      return res.status(400).json({ error: "Batch does not exist. Register harvest first." });
    }
    const stock = await ensureBatchStock(batchId);
    const availableGm = stock ? (stock.available_gm || 0) - (stock.used_gm || 0) : 0;
    const maxPackets = availableGm <= 0 ? 0 : Math.floor(availableGm / packetSizeGm);
    if (numCount > maxPackets) {
      return res.status(400).json({ error: `Cannot create ${numCount} packets. Maximum for this batch and size is ${maxPackets}.` });
    }
    const harvest = await getHarvestForBatch(batchId);
    const farmerId = harvest?.farmer_id || 'F';
    const batchProcessingPayload = {
      batch_id: batchId,
      processing_gps: processing_gps || '',
      grinding_facility_name: grinding_facility_name || '',
      moisture_content: moisture_content || 0,
      curcumin_content: curcumin_content || 0,
      heavy_metals: heavy_metals || '',
      physical_properties: physical_properties || '',
      packaging_date: packaging_date || '',
      packaging_unit: String(packetSizeGm) + 'g',
      expiry_date: expiry_date || '',
      sending_box_code: sending_box_code || '',
      distributor_id: distributor_id || '',
    };
    try {
      const txBatch = await setBatchProcessing(batchId, batchProcessingPayload);
      if (txBatch && typeof txBatch.wait === 'function') await txBatch.wait();
    } catch (e) {
      const msg = e?.message || String(e);
      if (!msg.includes('already') && !msg.includes('not a function') && !msg.includes('does not exist')) {
        throw e;
      }
    }
    const rawCount = await getBatchPacketCount(batchId);
    const startIndex = Number(rawCount ?? 0);
    const tx = await createPackets(batchId, farmerId, numCount, packetSizeGm);
    const receipt = await tx.wait();

    // IMPORTANT: DO NOT store packet IDs in MongoDB.
    // Return packet IDs from on-chain PacketRegistered events.
    const contract = getContract();
    const contractAddress = (contract.target || contract.address || '').toLowerCase();
    const iface = contract.interface;
    const topicRegistered = iface.getEvent('PacketRegisteredPlain').topicHash;
    const packetIds = [];
    const receiptLogs = (receipt.logs || []).filter((l) => {
      const addrOk = !contractAddress || String(l.address || '').toLowerCase() === contractAddress;
      const topicOk = l.topics?.[0] === topicRegistered;
      return addrOk && topicOk;
    });
    for (const log of receiptLogs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data });
        const pid = String(parsed.args?.unique_packet_id ?? parsed.args?.[0] ?? '');
        const bId = String(parsed.args?.batch_id ?? parsed.args?.[1] ?? '');
        const stage = String(parsed.args?.current_stage ?? parsed.args?.[2] ?? '');
        if (pid && bId === batchId && stage === 'processing') packetIds.push(pid);
      } catch (_) {}
    }

    if (packetIds.length !== numCount) {
      console.warn(
        `[create-packets] Expected ${numCount} PacketRegistered events for batch ${batchId}, got ${packetIds.length}.`,
        { txHash: receipt.hash, startIndex }
      );
    }

    if (packetIds.length === 0) {
      return res.status(500).json({
        error: "Packets were created on-chain, but backend could not read PacketRegistered events for this tx. Ensure CONTRACT_ADDRESS + ABI match the deployed contract.",
      });
    }

    console.log("Printing packets id : ");
    console.log(`Created ${packetIds.length} packet(s) for batch ${batchId}:`);
    packetIds.forEach((pid, i) => console.log(`  ${i + 1}. ${pid}`));

    const usedGmToAdd = numCount * packetSizeGm;
    await BatchStock.findOneAndUpdate(
      { batch_id: batchId },
      { $inc: { used_gm: usedGmToAdd }, packet_size_gm: packetSizeGm },
      { new: true }
    );
    
    // console.log(`[create-packets] Created ${packetIds.length} packet(s) for batch ${batchId}:`);
    // packetIds.forEach((pid, i) => console.log(`  ${i + 1}. ${pid}`));

    res.status(200).json({
      message: `Created ${numCount} packet(s) for batch ${batchId}.`,
      packetIds,
      batchId,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Get packets for a batch by stage (for distributor/supplier/shopkeeper to see how many they can send)
router.get("/batches/:batchId/packets-by-stage", async (req, res) => {
  try {
    const { batchId } = req.params;
    const stage = req.query.stage || 'processing';
    const validStages = ['processing', 'distributor', 'supplier', 'shopkeeper'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: "Invalid stage." });
    }
    const packetIds = await getPacketIdsByBatchAndStageFromChain(batchId, stage);
    res.status(200).json({ batchId, stage, count: packetIds.length, packetIds });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// ---------------- SHOPKEEPER: PACKETS INVENTORY + SALE (ON-CHAIN) ----------------

async function getShopkeeperBatchInventoryFromChain(batchId) {
  const ids = await getPacketIdsByBatchAndStageFromChain(batchId, 'shopkeeper');
  const packets = [];
  let sold = 0;
  for (const packet_id of ids) {
    const s = await isPacketSold(packet_id);
    const is_sold = Boolean(s);
    if (is_sold) sold += 1;
    packets.push({ packet_id, is_sold, sold_at: null, sold_tx_hash: '' });
  }
  const total = ids.length;
  const unsold = Math.max(0, total - sold);
  return { packets, counts: { total, sold, unsold } };
}

// List packets at shopkeeper for a batch, with sold/unsold filter (no MongoDB)
router.get("/shopkeeper/batches/:batchId/packets", stageGuard('shopkeeper'), async (req, res) => {
  try {
    const { batchId } = req.params;
    const status = String(req.query.status || 'all'); // all | sold | unsold
    if (!['all', 'sold', 'unsold'].includes(status)) {
      return res.status(400).json({ error: "Invalid status filter. Use all|sold|unsold." });
    }

    const inv = await getShopkeeperBatchInventoryFromChain(batchId);
    const filtered =
      status === 'sold' ? inv.packets.filter((p) => p.is_sold) :
      status === 'unsold' ? inv.packets.filter((p) => !p.is_sold) :
      inv.packets;

    res.status(200).json({
      batchId,
      status,
      counts: inv.counts,
      packets: filtered,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Mark packet as sold (one-way, on-chain only)
router.post("/shopkeeper/packets/:packetId/mark-sold", stageGuard('shopkeeper'), async (req, res) => {
  try {
    const { packetId } = req.params;
    const shopkeeperId = req.body.shopkeeper_id || req.stageUser?.id || '';
    if (!shopkeeperId) return res.status(400).json({ error: "Missing shopkeeper_id." });

    // Ensure packet is valid for shopkeeper stage (exists on-chain, stage == shopkeeper, not already used in shopkeeper form)
    // Here we just check sold flag and stage list.
    const isSold = await isPacketSold(packetId);
    if (Boolean(isSold)) return res.status(400).json({ error: "Packet is already marked as sold." });

    const tx = await markPacketSold(packetId, shopkeeperId);
    const receipt = await tx.wait();

    // Derive batchId from the packet itself
    const packetRaw = await getPacket(packetId);
    const batchId = packetRaw?.batch_id ? String(packetRaw.batch_id) : '';

    const inv = batchId ? await getShopkeeperBatchInventoryFromChain(batchId) : { counts: { total: 0, sold: 0, unsold: 0 } };

    res.status(200).json({
      message: "Packet marked as sold (on-chain).",
      packet_id: packetId,
      txHash: receipt.hash,
      batchId,
      counts: inv.counts,
    });
  } catch (error) {
    const msg = error?.error?.message || error?.reason || error?.message || String(error);
    res.status(error.status || 500).json({ error: msg });
  }
});

// Check if packet ID exists
router.get("/packets/:packetId/exists", async (req, res) => {
  try {
    const { packetId } = req.params;
    const exists = await packetIdExists(packetId);
    res.status(200).json({ packetId, exists });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Validate packet ID for a specific stage
router.get("/packets/:packetId/validate/:stage", async (req, res) => {
  try {
    const { packetId, stage } = req.params;
    const validation = await validatePacketForStage(packetId, stage);
    res.status(200).json({ 
      packetId, 
      stage,
      valid: validation.valid,
      message: validation.message 
    });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

module.exports = router;
