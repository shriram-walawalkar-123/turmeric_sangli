const { getContract, getProvider } = require('../config/blockchain');
const { ethers } = require('ethers');

// Thin wrapper around the contract calls with consistent error surfaces
async function addHarvest(data) {
  const c = getContract();
  // solidity: addHarvest(string batch_id, Harvest h)
  return c.addHarvest(
    data.batch_id,
    [
      data.farmer_id,
      data.product_name,
      data.batch_id,
      data.harvest_date,
      data.gps_coordinates,
      data.fertilizer,
      data.organic_status,
    ]
  );
}

async function addProcessing(data) {
  const c = getContract();
  return c.addProcessing(
    data.batch_id,
    [
      data.batch_id,
      data.processing_gps,
      data.grinding_facility_name,
      Number(data.moisture_content || 0),
      Number(data.curcumin_content || 0),
      data.heavy_metals,
      data.physical_properties,
      data.packaging_date,
      data.packaging_unit,
      data.packet_id,
      data.expiry_date,
      data.sending_box_code,
      data.distributor_id,
    ]
  );
}

async function addDistributor(data) {
  const c = getContract();
  return c.addDistributor(
    data.packet_id,
    [
      data.distributor_id,
      data.gps_coordinates,
      data.received_box_code,
      data.dispatch_date,
      data.sending_box_code,
      data.supplier_id,
    ]
  );
}

async function addSupplier(data) {
  const c = getContract();
  return c.addSupplier(
    data.packet_id,
    [
      data.supplier_id,
      data.received_box_code,
      data.gps_coordinates,
      data.receipt_date,
      data.shopkeeper_id,
      data.packet_id,
    ]
  );
}

async function addShopkeeper(data) {
  const c = getContract();
  return c.addShopkeeper(
    data.packet_id,
    [
      data.shopkeeper_id,
      data.packet_id,
      data.gps_coordinates,
      data.date_received,
    ]
  );
}

async function addPacket(data) {
  const c = getContract();
  return c.addPacket(
    data.unique_packet_id,
    [
      data.unique_packet_id,
      data.batch_id,
      data.current_stage,
      true,
    ]
  );
}

// Reads
async function getPacket(packet_id) {
  const c = getContract();
  return c.getPacket(packet_id);
}

async function getHarvest(batch_id) {
  const c = getContract();
  return c.getHarvest(batch_id);
}

async function getProcessing(batch_id) {
  const c = getContract();
  return c.getProcessing(batch_id);
}

async function getDistributor(packet_id) {
  const c = getContract();
  return c.getDistributor(packet_id);
}

async function getSupplier(packet_id) {
  const c = getContract();
  return c.getSupplier(packet_id);
}

async function getShopkeeper(packet_id) {
  const c = getContract();
  return c.getShopkeeper(packet_id);
}

// New getter functions
async function getBatchPacketCount(batch_id) {
  const c = getContract();
  return c.getBatchPacketCount(batch_id);
}

async function batchExists(batch_id) {
  const c = getContract();
  return c.batchExists(batch_id);
}

async function packetIdExists(packet_id) {
  const c = getContract();
  return c.packetIdExists(packet_id);
}

// Check if packet_id has been used in distributor stage
async function checkDistributorExists(packet_id) {
  try {
    const distributor = await getDistributor(packet_id);
    // Check if distributor_id field is non-empty (indicates it's been used)
    return distributor && distributor.distributor_id && distributor.distributor_id.length > 0;
  } catch (error) {
    return false;
  }
}

// Check if packet_id has been used in supplier stage
async function checkSupplierExists(packet_id) {
  try {
    const supplier = await getSupplier(packet_id);
    // Check if supplier_id field is non-empty (indicates it's been used)
    return supplier && supplier.supplier_id && supplier.supplier_id.length > 0;
  } catch (error) {
    return false;
  }
}

// Check if packet_id has been used in shopkeeper stage
async function checkShopkeeperExists(packet_id) {
  try {
    const shopkeeper = await getShopkeeper(packet_id);
    // Check if shopkeeper_id field is non-empty (indicates it's been used)
    return shopkeeper && shopkeeper.shopkeeper_id && shopkeeper.shopkeeper_id.length > 0;
  } catch (error) {
    return false;
  }
}

// Validate packet_id for a specific stage
async function validatePacketForStage(packet_id, stage) {
  // First check if packet exists
  const packetExists = await packetIdExists(packet_id);
  if (!packetExists) {
    return { valid: false, message: 'Packet ID does not exist. Packet must be created by processing stage first.' };
  }

  // Check if packet has already been used in this stage
  let alreadyUsed = false;
  switch (stage) {
    case 'distributor':
      alreadyUsed = await checkDistributorExists(packet_id);
      if (alreadyUsed) {
        return { valid: false, message: 'This packet ID has already been used in the distributor stage. Each packet can only be processed once per stage.' };
      }
      break;
    case 'supplier':
      alreadyUsed = await checkSupplierExists(packet_id);
      if (alreadyUsed) {
        return { valid: false, message: 'This packet ID has already been used in the supplier stage. Each packet can only be processed once per stage.' };
      }
      break;
    case 'shopkeeper':
      alreadyUsed = await checkShopkeeperExists(packet_id);
      if (alreadyUsed) {
        return { valid: false, message: 'This packet ID has already been used in the shopkeeper stage. Each packet can only be processed once per stage.' };
      }
      break;
  }

  return { valid: true, message: 'Packet ID is valid and available for this stage.' };
}

async function checkFarmerBatchExists(farmer_id, batch_id) {
  const c = getContract();
  return c.checkFarmerBatchExists(farmer_id, batch_id);
}

async function getHarvestForBatch(batch_id) {
  const c = getContract();
  return c.getHarvestForBatch(batch_id);
}

// Get all farmers and batches by querying HarvestRegistered events
// Replace your getAllFarmersAndBatches function with this improved version:

async function getAllFarmersAndBatches() {
  try {
    const c = getContract();
    const provider = getProvider();
    
    console.log("Starting getAllFarmersAndBatches...");
    
    // Get contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error("CONTRACT_ADDRESS not set in environment");
      return {};
    }
    console.log("Contract address:", contractAddress);
    
    // Verify contract has code
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.error("No contract code at address:", contractAddress);
      return {};
    }
    console.log("Contract code verified, length:", code.length);
    
    let events = [];

    // Preferred path: read unindexed HarvestRecorded events (plain strings)
    try {
      if (c.filters && typeof c.filters.HarvestRecorded === 'function') {
        console.log("Using contract.queryFilter for HarvestRecorded...");
        const filterRecorded = c.filters.HarvestRecorded();
        const recorded = await c.queryFilter(filterRecorded, 0, 'latest');
        console.log("Found HarvestRecorded via queryFilter:", recorded.length);
        for (const ev of recorded) {
          const farmerId = String(ev.args?.farmer_id ?? ev.args?.[0] ?? '');
          const batchId = String(ev.args?.batch_id ?? ev.args?.[1] ?? '');
          events.push({ args: { farmer_id: farmerId, batch_id: batchId } });
        }
      } else {
        throw new Error("HarvestRecorded filter not available");
      }
    } catch (recordedFilterError) {
      console.log("HarvestRecorded queryFilter failed, using getLogs:", recordedFilterError.message);
      try {
        const recordedIface = new ethers.Interface([
          "event HarvestRecorded(string farmer_id, string batch_id)"
        ]);
        const recordedTopic = ethers.id("HarvestRecorded(string,string)");
        const logs = await provider.getLogs({ address: contractAddress, topics: [recordedTopic], fromBlock: 0, toBlock: 'latest' });
        console.log("Found HarvestRecorded logs:", logs.length);
        for (const log of logs) {
          try {
            const parsed = recordedIface.parseLog({ topics: log.topics, data: log.data });
            const farmerId = String(parsed.args.farmer_id);
            const batchId = String(parsed.args.batch_id);
            events.push({ args: { farmer_id: farmerId, batch_id: batchId } });
          } catch (e) {
            console.error('Error parsing HarvestRecorded log:', e.message);
          }
        }
      } catch (e) {
        console.error('HarvestRecorded getLogs failed:', e.message);
      }
    }
    
    console.log("Total valid events:", events.length);
    
    // Build farmer map
    const farmerMap = {};
    
    for (const event of events) {
      let farmerId = event.args?.farmer_id || event.args?.[0] || '';
      let batchId = event.args?.batch_id || event.args?.[1] || '';
      
      // Convert to string if needed
      if (farmerId && typeof farmerId !== 'string') {
        farmerId = farmerId.toString();
      }
      if (batchId && typeof batchId !== 'string') {
        batchId = batchId.toString();
      }
      
      // Validate
      if (!farmerId || !batchId || 
          farmerId === 'undefined' || 
          batchId === 'undefined' ||
          farmerId === '[object Object]' ||
          batchId === '[object Object]') {
        console.log("Skipping invalid event data");
        continue;
      }
      
      if (!farmerMap[farmerId]) {
        farmerMap[farmerId] = [];
      }
      
      if (!farmerMap[farmerId].includes(batchId)) {
        farmerMap[farmerId].push(batchId);
      }
    }
    
    console.log("Final farmer map:", farmerMap);
    console.log("Total farmers:", Object.keys(farmerMap).length);
    
    return farmerMap;
    
  } catch (error) {
    console.error('Error in getAllFarmersAndBatches:', error);
    console.error('Error stack:', error.stack);
    return {};
  }
}

// Get batches for a specific farmer
async function getBatchesForFarmer(farmer_id) {
  const farmerMap = await getAllFarmersAndBatches();
  return farmerMap[farmer_id] || [];
}

// Get all unique farmer IDs
async function getAllFarmers() {
  const farmerMap = await getAllFarmersAndBatches();
  return Object.keys(farmerMap);
}

module.exports = {
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
  checkFarmerBatchExists,
  getHarvestForBatch,
  getAllFarmersAndBatches,
  getBatchesForFarmer,
  getAllFarmers,
  checkDistributorExists,
  checkSupplierExists,
  checkShopkeeperExists,
  validatePacketForStage,
};

// ----- Roles Helpers -----
// Note: These rely on OpenZeppelin AccessControl in the contract.
async function grantRole(roleBytes32, account) {
  const c = getContract();
  return c.grantRole(roleBytes32, account);
}

async function revokeRole(roleBytes32, account) {
  const c = getContract();
  return c.revokeRole(roleBytes32, account);
}

async function hasRole(roleBytes32, account) {
  const c = getContract();
  return c.hasRole(roleBytes32, account);
}

module.exports.grantRole = grantRole;
module.exports.revokeRole = revokeRole;
module.exports.hasRole = hasRole;


