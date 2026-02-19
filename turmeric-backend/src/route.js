const express = require("express");
const router = express.Router();
const {
  addHarvest,
  addProcessing,
  addDistributor,
  addSupplier,
  addShopkeeper,
  addPacket,
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
  validatePacketForStage,
} = require('./services/contractService');
const { stageGuard } = require('./middleware/stageRole');

function requireFields(obj, fields) {
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

// ---------------- POST ROUTES ---------------- //

// Harvest
router.post("/harvest", stageGuard('farmer'), async (req, res) => {
  try {
    requireFields(req.body, [
      'batch_id', 'farmer_id', 'product_name', 'harvest_date', 'gps_coordinates', 'fertilizer', 'organic_status'
    ]);
    
    // The smart contract will validate batch uniqueness per farmer
    // If batch already exists, contract will revert with error message
    const tx = await addHarvest(req.body);
    const receipt = await tx.wait();
    res.status(200).json({ message: "Harvest recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    // Contract validation error will be caught here
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

// Distributor
router.post("/distributor", stageGuard('distributor'), async (req, res) => {
  try {
    requireFields(req.body, [
      'packet_id', 'distributor_id', 'gps_coordinates', 'received_box_code', 'dispatch_date', 'sending_box_code', 'supplier_id'
    ]);
    
    // Validate packet_id exists and hasn't been used in distributor stage
    const validation = await validatePacketForStage(req.body.packet_id, 'distributor');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    const tx = await addDistributor(req.body);
    const receipt = await tx.wait();
    res.status(200).json({ message: "Distributor recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Supplier
router.post("/supplier", stageGuard('supplier'), async (req, res) => {
  try {
    requireFields(req.body, [
      'packet_id', 'supplier_id', 'received_box_code', 'gps_coordinates', 'receipt_date', 'shopkeeper_id'
    ]);
    
    // Validate packet_id exists and hasn't been used in supplier stage
    const validation = await validatePacketForStage(req.body.packet_id, 'supplier');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    const tx = await addSupplier(req.body);
    const receipt = await tx.wait();
    res.status(200).json({ message: "Supplier recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Shopkeeper
router.post("/shopkeeper", stageGuard('shopkeeper'), async (req, res) => {
  try {
    requireFields(req.body, [
      'packet_id', 'shopkeeper_id', 'gps_coordinates', 'date_received'
    ]);
    
    // Validate packet_id exists and hasn't been used in shopkeeper stage
    const validation = await validatePacketForStage(req.body.packet_id, 'shopkeeper');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    const tx = await addShopkeeper(req.body);
    const receipt = await tx.wait();
    res.status(200).json({ message: "Shopkeeper recorded on-chain", txHash: receipt.hash });
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
    console.log("check packet params :",req.params.packetId);
    const packetId = req.params.packetId;
    const packetRaw = await getPacket(packetId);

    // console.log("RAW PACKET DATA:", packetRaw); // <--- Log this!
    // console.log("PACKET EXISTS CHECK:", packetRaw.exists); // <--- Log this!
    const distributorRaw = await getDistributor(packetId);
    const supplierRaw = await getSupplier(packetId);
    const shopkeeperRaw = await getShopkeeper(packetId);

    // Convert ethers struct to plain object safely
    const packet = packetRaw.exists ? {
      unique_packet_id: packetRaw.unique_packet_id,
      batch_id: packetRaw.batch_id,
      current_stage: packetRaw.current_stage,
      exists: packetRaw.exists
    } : null;

    const batchId = packet?.batch_id;

    const harvestRaw = batchId ? await getHarvest(batchId) : null;
    const processingRaw = batchId ? await getProcessing(batchId) : null;

    const harvest = harvestRaw?.batch_id ? {
      farmer_id: harvestRaw.farmer_id,
      product_name: harvestRaw.product_name,
      batch_id: harvestRaw.batch_id,
      harvest_date: harvestRaw.harvest_date,
      gps_coordinates: harvestRaw.gps_coordinates,
      fertilizer: harvestRaw.fertilizer,
      organic_status: harvestRaw.organic_status
    } : null;

    const processing = processingRaw?.batch_id ? {
      batch_id: processingRaw.batch_id,
      processing_gps: processingRaw.processing_gps,
      grinding_facility_name: processingRaw.grinding_facility_name,
      moisture_content: processingRaw.moisture_content.toString(),
      curcumin_content: processingRaw.curcumin_content.toString(),
      heavy_metals: processingRaw.heavy_metals,
      physical_properties: processingRaw.physical_properties,
      packaging_date: processingRaw.packaging_date,
      packaging_unit: processingRaw.packaging_unit,
      packet_id: processingRaw.packet_id,
      expiry_date: processingRaw.expiry_date,
      sending_box_code: processingRaw.sending_box_code,
      distributor_id: processingRaw.distributor_id
    } : null;

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

// Get batches for a farmer
router.get("/farmers/:farmerId/batches", async (req, res) => {
  try {
    const { farmerId } = req.params;
    const batches = await getBatchesForFarmer(farmerId);
    
    // Get packet count for each batch
    const batchesWithCount = await Promise.all(
      batches.map(async (batchId) => {
        try {
          const count = await getBatchPacketCount(batchId);
          const harvest = await getHarvestForBatch(batchId);
          return {
            batchId,
            packetCount: count.toString(),
            harvestDate: harvest.harvest_date || '',
            productName: harvest.product_name || ''
          };
        } catch (err) {
          return {
            batchId,
            packetCount: '0',
            harvestDate: '',
            productName: ''
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
