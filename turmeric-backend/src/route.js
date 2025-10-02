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

// ✅ 2. Add Harvest (server signs tx — must have FARMER_ROLE)
router.post("/harvest", async (req, res) => {
  try {
    if (!signer) return res.status(403).json({ error: "Server cannot sign transactions." });

    const { batch_id, RnR_farmer_id, product_name, harvest_date, gps_coordinates, fertilizer, organic_status } = req.body;

    const harvestStruct = [
      RnR_farmer_id,
      product_name,
      batch_id,
      harvest_date,
      gps_coordinates,
      fertilizer,
      organic_status
    ];

    const tx = await contract.addHarvest(batch_id, harvestStruct);
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

module.exports = router;
