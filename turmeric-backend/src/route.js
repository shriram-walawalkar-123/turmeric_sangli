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
    const tx = await addHarvest(req.body);
    const receipt = await tx.wait();
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

    console.log("Processing data received ok shriram: ",req.body);

    const tx = await addProcessing(req.body);
    const receipt = await tx.wait();
    res.status(200).json({ message: "Processing recorded on-chain", txHash: receipt.hash });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || String(error) });
  }
});

// Distributor
router.post("/distributor", stageGuard('distributor'), async (req, res) => {
  try {
    requireFields(req.body, [
      'packet_id', 'distributor_id', 'gps_coordinates', 'received_box_code', 'dispatch_date', 'sending_box_code', 'supplier_id'
    ]);
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

module.exports = router;
