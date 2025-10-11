const express = require("express");
const router = express.Router();

// In-memory storage (temporary, resets on server restart)
const harvests = [];
const processings = [];
const distributors = [];
const suppliers = [];
const shopkeepers = [];
const packets = [];
const activities = [];

function addActivity(type, data) {
  const entry = { type, timestamp: new Date().toISOString(), data };
  activities.push(entry);
  if (activities.length > 200) 
  activities.shift();
}

// Harvest
router.post("/harvest", async (req, res) => {
  console.log("Received harvest data:", req.body);
  try {
    const { batch_id, farmer_id, product_name, harvest_date, gps_coordinates, fertilizer, organic_status } = req.body;

    const harvestStruct = {
      farmer_id,
      product_name,
      batch_id,
      harvest_date,
      gps_coordinates,
      fertilizer,
      organic_status
    };

    harvests.push(harvestStruct);
    addActivity("harvest", harvestStruct);

    return res.status(200).json({
      message: "Harvest data received successfully",
      data: harvestStruct
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Processing & Packaging
router.post("/processing", async (req, res) => {
  console.log("Received processing data:", req.body);
  try {
    const {
      batch_id,
      processing_gps,
      grinding_facility_name,
      moisture_content,
      curcumin_content,
      heavy_metals,
      physical_properties,
      packaging_date,
      packaging_unit,
      packet_id,
      expiry_date,
      sending_box_code,
      distributor_id
    } = req.body;

    const processingStruct = {
      batch_id,
      processing_gps,
      grinding_facility_name,
      moisture_content: moisture_content !== undefined ? Number(moisture_content) : undefined,
      curcumin_content: curcumin_content !== undefined ? Number(curcumin_content) : undefined,
      heavy_metals,
      physical_properties,
      packaging_date,
      packaging_unit,
      packet_id,
      expiry_date,
      sending_box_code,
      distributor_id
    };

    processings.push(processingStruct);
    addActivity("processing", processingStruct);

    return res.status(200).json({
      message: "Processing data received successfully",
      data: processingStruct
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Distributor
router.post("/distributor", async (req, res) => {
  console.log("Received distributor data:", req.body);
  try {
    const { distributor_id, gps_coordinates, received_box_code, dispatch_date, sending_box_code, supplier_id} = req.body;

    const distributorStruct = {
      distributor_id,
      gps_coordinates,
      received_box_code,
      dispatch_date,
      sending_box_code,
      supplier_id
    };

    distributors.push(distributorStruct);
    addActivity("distributor", distributorStruct);

    return res.status(200).json({
      message: "Distributor data received successfully",
      data: distributorStruct
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Supplier
router.post("/supplier", async (req, res) => {
  console.log("Received supplier data:", req.body);
  try {
    const {supplier_id, received_box_code, gps_coordinates, receipt_date, shopkeeper_id, packet_id } = req.body;

    const supplierStruct = {
      supplier_id,
      received_box_code,
      gps_coordinates,
      receipt_date,
      shopkeeper_id,
      packet_id
    };

    suppliers.push(supplierStruct);
    addActivity("supplier", supplierStruct);

    return res.status(200).json({
      message: "Supplier data received successfully",
      data: supplierStruct
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Shopkeeper
router.post("/shopkeeper", async (req, res) => {
  console.log("Received shopkeeper data:", req.body);
  try {
    const {shopkeeper_id, packet_id, gps_coordinates, date_received } = req.body;

    const shopkeeperStruct = {
      shopkeeper_id,
      packet_id,
      gps_coordinates,
      date_received
    };

    shopkeepers.push(shopkeeperStruct);
    addActivity("shopkeeper", shopkeeperStruct);

    return res.status(200).json({
      message: "Shopkeeper data received successfully",
      data: shopkeeperStruct
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Packet
router.post("/packet", async (req, res) => {
  console.log("Received packet data:", req.body);
  try {
    const { unique_packet_id, batch_id, current_stage } = req.body;

    const packetStruct = {
      unique_packet_id,
      batch_id,
      current_stage,
    };

    packets.push(packetStruct);
    addActivity("packet", packetStruct);

    return res.status(200).json({
      message: "Packet data received successfully",
      data: packetStruct
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Journey placeholder: aggregate by packetId
router.get("/journey/:packetId", async (req, res) => {
  console.log("Fetching journey for packetId:", req.params.packetId);
  try {
    const packetId = req.params.packetId;

    const byPacketId = (item) => (
      item.packet_id === packetId ||
      item.unique_packet_id === packetId ||
      item.batch_id === packetId
    );

    const result = {
      packet: packets.filter(byPacketId),
      harvest: harvests.filter(byPacketId),
      processing: processings.filter(byPacketId),
      distributor: distributors.filter(byPacketId),
      supplier: suppliers.filter(byPacketId),
      shopkeeper: shopkeepers.filter(byPacketId),
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Stats placeholder
router.get("/stats", async (_req, res) => {
  console.log("Fetching stats");
  try {
    return res.status(200).json({
      totalPackets: packets.length,
      totalBatches: new Set([...harvests, ...processings, ...packets].map(i => i.batch_id).filter(Boolean)).size,
      roles: {
        farmers: new Set(harvests.map(h => h.RnR_farmer_id).filter(Boolean)).size,
        processors: new Set(processings.map(p => p.grinding_facility_name).filter(Boolean)).size,
        distributors: new Set(distributors.map(d => d.distributor_id).filter(Boolean)).size,
        suppliers: new Set(suppliers.map(s => s.supplier_id).filter(Boolean)).size,
        shopkeepers: new Set(shopkeepers.map(s => s.shopkeeper_id).filter(Boolean)).size,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

// Activity placeholder
router.get("/activity", async (_req, res) => {
  console.log("Fetching recent activity");
  try {
    const last = activities.slice(-50).reverse();
    return res.status(200).json(last);
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
});

module.exports = router;
