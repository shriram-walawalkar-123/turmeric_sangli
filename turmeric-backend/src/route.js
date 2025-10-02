const express = require("express");
const router = express.Router();
const { contract, signer } = require("./contract");

// ✅ 1. Read full journey
router.get("/journey/:packetId", async (req, res) => {
  try {
    const packetId = req.params.packetId;
    const result = await contract.getFullJourney(packetId);
    res.json({
      packet: result[0],
      harvest: result[1],
      processing: result[2],
      distributor: result[3],
      supplier: result[4],
      shopkeeper: result[5],
    });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ✅ 2. Add Harvest (server signs tx — must have PROCESSOR_ROLE per contract)
router.post("/harvest", async (req, res) => {
  try {
    if (!signer) return res.status(403).json({ error: "Server cannot sign transactions." });

    const { batch_id, RnR_farmer_id, product_name, harvest_date, gps_coordinates, fertilizer, organic_status } = req.body;

    const harvestStruct = {
      RnR_farmer_id,
      product_name,
      batch_id,
      harvest_date,
      gps_coordinates,
      fertilizer,
      organic_status
    };

    const tx = await contract.addHarvest(batch_id, harvestStruct);
    const receipt = await tx.wait();

    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ✅ 3. Add Processing & Packaging (PROCESSOR_ROLE)
router.post("/processing", async (req, res) => {
  try {
    if (!signer) return res.status(403).json({ error: "Server cannot sign transactions." });

    const {
      batch_id,
      processing_gps,
      grinding_facility_name,
      lab_report_ipfs_hash,
      moisture_content,
      curcumin_content,
      heavy_metals,
      physical_properties,
      packaging_date,
      packaging_unit,
      batch_coding,
      expiry_date,
    } = req.body;

    const processingStruct = {
      batch_id,
      processing_gps,
      grinding_facility_name,
      lab_report_ipfs_hash,
      moisture_content: Number(moisture_content),
      curcumin_content: Number(curcumin_content),
      heavy_metals,
      physical_properties,
      packaging_date,
      packaging_unit,
      batch_coding,
      expiry_date,
    };

    const tx = await contract.addProcessing(batch_id, processingStruct);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ✅ 4. Add Distributor (DISTRIBUTOR_ROLE)
router.post("/distributor", async (req, res) => {
  try {
    if (!signer) return res.status(403).json({ error: "Server cannot sign transactions." });
    const { distributor_id, packet_id, gps_coordinates, box_code, dispatch_date, tracking_number } = req.body;
    const distributorStruct = {
      distributor_id,
      packet_id,
      gps_coordinates,
      box_code,
      dispatch_date,
      tracking_number,
    };
    const tx = await contract.addDistributor(packet_id, distributorStruct);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ✅ 5. Add Supplier (SUPPLIER_ROLE)
router.post("/supplier", async (req, res) => {
  try {
    if (!signer) return res.status(403).json({ error: "Server cannot sign transactions." });
    const { supplier_id, packet_id, gps_coordinates, receipt_date, shopkeeper_list } = req.body;
    const normalizedShopkeepers = Array.isArray(shopkeeper_list)
      ? shopkeeper_list
      : typeof shopkeeper_list === "string" && shopkeeper_list.trim() !== ""
        ? shopkeeper_list.split(",").map((s) => s.trim())
        : [];

    const supplierStruct = {
      supplier_id,
      packet_id,
      gps_coordinates,
      receipt_date,
      shopkeeper_list: normalizedShopkeepers,
    };
    const tx = await contract.addSupplier(packet_id, supplierStruct);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ✅ 6. Add Shopkeeper (SHOPKEEPER_ROLE)
router.post("/shopkeeper", async (req, res) => {
  try {
    if (!signer) return res.status(403).json({ error: "Server cannot sign transactions." });
    const { shopkeeper_id, packet_id, gps_coordinates, date_received, shelf_life_expiry } = req.body;
    const shopkeeperStruct = {
      shopkeeper_id,
      packet_id,
      gps_coordinates,
      date_received,
      shelf_life_expiry,
    };
    const tx = await contract.addShopkeeper(packet_id, shopkeeperStruct);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ✅ 7. Add Packet (PROCESSOR_ROLE)
router.post("/packet", async (req, res) => {
  try {
    if (!signer) return res.status(403).json({ error: "Server cannot sign transactions." });
    const { unique_packet_id, batch_id, ipfs_hash, current_stage } = req.body;
    const packetStruct = {
      unique_packet_id,
      batch_id,
      ipfs_hash,
      current_stage,
    };
    const tx = await contract.addPacket(unique_packet_id, packetStruct);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// ✅ 3. Grant Farmer Role (only ADMIN can do this)
router.post("/roles/farmer", async (req, res) => {
  try {
    const { address } = req.body;
    const tx = await contract.grantFarmerRole(address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// Additional role grants (optional helpers)
router.post("/roles/processor", async (req, res) => {
  try {
    const { address } = req.body;
    const tx = await contract.grantProcessorRole(address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

router.post("/roles/distributor", async (req, res) => {
  try {
    const { address } = req.body;
    const tx = await contract.grantDistributorRole(address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

router.post("/roles/supplier", async (req, res) => {
  try {
    const { address } = req.body;
    const tx = await contract.grantSupplierRole(address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

router.post("/roles/shopkeeper", async (req, res) => {
  try {
    const { address } = req.body;
    const tx = await contract.grantShopkeeperRole(address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.transactionHash });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

// Lightweight stats for dashboard
router.get("/stats", async (_req, res) => {
  try {
    res.json({
      totalPackets: 0,
      totalBatches: 0,
      roles: {
        farmers: 0,
        processors: 0,
        distributors: 0,
        suppliers: 0,
        shopkeepers: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

router.get("/activity", async (_req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
});

module.exports = router;
