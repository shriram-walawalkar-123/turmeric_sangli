const { getContract, getProvider, getWallet } = require('../config/blockchain');
const { ethers } = require('ethers');

// ── Global Nonce Manager ───────────────────────────────────────────────────────
// Hardhat automines instantly — ethers.js internal nonce cache gets stale.
// This counter always stays one ahead of the chain so every tx gets the right nonce.

let _currentNonce = null;
let _nonceLock = Promise.resolve(); // serializes concurrent nonce requests

async function getNextNonce() {
  // Wrap in a lock so concurrent calls don't hand out the same nonce
  _nonceLock = _nonceLock.then(async () => {
    if (_currentNonce === null) {
      const wallet = getWallet();
      _currentNonce = await wallet.getNonce('pending');
      console.log('[nonce] initialized from chain:', _currentNonce);
    }
  });
  await _nonceLock;
  const nonce = _currentNonce;
  _currentNonce += 1;
  console.log('[nonce] issuing nonce:', nonce, '-> next will be:', _currentNonce);
  return nonce;
}

// Call this whenever a transaction fails so the next call re-syncs from chain
async function resetNonce() {
  console.log('[nonce] resetting — will re-fetch from chain on next tx');
  _currentNonce = null;
}

// Re-sync nonce from chain (use after failed tx or on server startup)
async function syncNonce() {
  const wallet = getWallet();
  _currentNonce = await wallet.getNonce('pending');
  console.log('[nonce] synced from chain:', _currentNonce);
}

// Legacy export — kept so existing routes that import getCurrentNonce don't break
async function getCurrentNonce() {
  const wallet = getWallet();
  return wallet.getNonce('pending');
}

// ── Write Functions ────────────────────────────────────────────────────────────

async function addHarvest(data) {
  const c = getContract();
  const nonce = await getNextNonce();
  const quantityGm = data.quantity_gm != null ? Number(data.quantity_gm) : 0;
  try {
    return await c.addHarvest(
      data.batch_id,
      [
        data.farmer_id,
        data.product_name,
        data.batch_id,
        data.harvest_date,
        data.gps_coordinates,
        data.fertilizer,
        data.organic_status,
        quantityGm,
      ],
      { nonce }
    );
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function addProcessing(data) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.addProcessing(
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
      ],
      { nonce }
    );
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function addDistributor(data, overrides = {}) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.addDistributor(
      data.packet_id,
      [
        data.distributor_id,
        data.gps_coordinates,
        data.received_box_code,
        data.dispatch_date,
        data.sending_box_code,
        data.supplier_id,
      ],
      { nonce, ...overrides }
    );
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function addSupplier(data, overrides = {}) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.addSupplier(
      data.packet_id,
      [
        data.supplier_id,
        data.received_box_code,
        data.gps_coordinates,
        data.receipt_date,
        data.shopkeeper_id,
        data.packet_id,
      ],
      { nonce, ...overrides }
    );
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function addShopkeeper(data, overrides = {}) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.addShopkeeper(
      data.packet_id,
      [
        data.shopkeeper_id,
        data.packet_id,
        data.gps_coordinates,
        data.date_received,
      ],
      { nonce, ...overrides }
    );
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function addPacket(data, overrides = {}) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.addPacket(
      data.unique_packet_id,
      [
        data.unique_packet_id,
        data.batch_id,
        data.current_stage,
        true,
      ],
      { nonce, ...overrides }
    );
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function addPacketsInBatch(batch_id, packet_ids) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.addPacketsInBatch(batch_id, packet_ids, { nonce });
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function createPackets(batch_id, farmer_id, count, weightPerPacketGm) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.createPackets(batch_id, farmer_id, count, weightPerPacketGm, { nonce });
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function setBatchProcessing(batch_id, data, overrides = {}) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.setBatchProcessing(
      batch_id,
      [
        data.batch_id,
        data.processing_gps || '',
        data.grinding_facility_name || '',
        Number(data.moisture_content || 0),
        Number(data.curcumin_content || 0),
        data.heavy_metals || '',
        data.physical_properties || '',
        data.packaging_date || '',
        data.packaging_unit || '',
        data.expiry_date || '',
        data.sending_box_code || '',
        data.distributor_id || '',
      ],
      { nonce, ...overrides }
    );
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

// ── Read Functions (no nonce needed) ──────────────────────────────────────────

async function getBatchProcessing(batch_id) {
  const c = getContract();
  return c.getBatchProcessing(batch_id);
}

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

async function checkFarmerBatchExists(farmer_id, batch_id) {
  const c = getContract();
  return c.checkFarmerBatchExists(farmer_id, batch_id);
}

async function getHarvestForBatch(batch_id) {
  const c = getContract();
  return c.getHarvestForBatch(batch_id);
}

// ── Stage Existence Checks ─────────────────────────────────────────────────────

async function checkDistributorExists(packet_id) {
  try {
    const distributor = await getDistributor(packet_id);
    return distributor && distributor.distributor_id && distributor.distributor_id.length > 0;
  } catch {
    return false;
  }
}

async function checkSupplierExists(packet_id) {
  try {
    const supplier = await getSupplier(packet_id);
    return supplier && supplier.supplier_id && supplier.supplier_id.length > 0;
  } catch {
    return false;
  }
}

async function checkShopkeeperExists(packet_id) {
  try {
    const shopkeeper = await getShopkeeper(packet_id);
    return shopkeeper && shopkeeper.shopkeeper_id && shopkeeper.shopkeeper_id.length > 0;
  } catch {
    return false;
  }
}

async function validatePacketForStage(packet_id, stage) {
  const exists = await packetIdExists(packet_id);
  if (!exists) {
    return {
      valid: false,
      message: 'Packet ID does not exist. Packet must be created by processing stage first.',
    };
  }

  let alreadyUsed = false;
  switch (stage) {
    case 'distributor':
      alreadyUsed = await checkDistributorExists(packet_id);
      if (alreadyUsed) {
        return { valid: false, message: 'This packet ID has already been used in the distributor stage.' };
      }
      break;
    case 'supplier':
      alreadyUsed = await checkSupplierExists(packet_id);
      if (alreadyUsed) {
        return { valid: false, message: 'This packet ID has already been used in the supplier stage.' };
      }
      break;
    case 'shopkeeper':
      alreadyUsed = await checkShopkeeperExists(packet_id);
      if (alreadyUsed) {
        return { valid: false, message: 'This packet ID has already been used in the shopkeeper stage.' };
      }
      break;
  }

  return { valid: true, message: 'Packet ID is valid and available for this stage.' };
}

// ── Farmer / Batch Queries (event-based) ──────────────────────────────────────

async function getAllFarmersAndBatches() {
  try {
    const c = getContract();
    const provider = getProvider();

    console.log('Starting getAllFarmersAndBatches...');

    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error('CONTRACT_ADDRESS not set in environment');
      return {};
    }

    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.error('No contract code at address:', contractAddress);
      return {};
    }

    let events = [];

    // Preferred: queryFilter on unindexed HarvestRecorded (plain string args)
    try {
      if (c.filters && typeof c.filters.HarvestRecorded === 'function') {
        const filter   = c.filters.HarvestRecorded();
        const recorded = await c.queryFilter(filter, 0, 'latest');
        console.log('Found HarvestRecorded via queryFilter:', recorded.length);
        for (const ev of recorded) {
          const farmerId = String(ev.args?.farmer_id ?? ev.args?.[0] ?? '');
          const batchId  = String(ev.args?.batch_id  ?? ev.args?.[1] ?? '');
          events.push({ args: { farmer_id: farmerId, batch_id: batchId } });
        }
      } else {
        throw new Error('HarvestRecorded filter not available');
      }
    } catch (filterErr) {
      console.log('queryFilter failed, falling back to getLogs:', filterErr.message);
      try {
        const iface = new ethers.Interface(['event HarvestRecorded(string farmer_id, string batch_id)']);
        const topic = ethers.id('HarvestRecorded(string,string)');
        const logs  = await provider.getLogs({
          address: contractAddress,
          topics: [topic],
          fromBlock: 0,
          toBlock: 'latest',
        });
        console.log('Found HarvestRecorded logs:', logs.length);
        for (const log of logs) {
          try {
            const parsed   = iface.parseLog({ topics: log.topics, data: log.data });
            const farmerId = String(parsed.args.farmer_id);
            const batchId  = String(parsed.args.batch_id);
            events.push({ args: { farmer_id: farmerId, batch_id: batchId } });
          } catch (e) {
            console.error('Error parsing log:', e.message);
          }
        }
      } catch (logsErr) {
        console.error('getLogs also failed:', logsErr.message);
      }
    }

    console.log('Total valid events:', events.length);

    const farmerMap = {};
    for (const event of events) {
      let farmerId = event.args?.farmer_id ?? '';
      let batchId  = event.args?.batch_id  ?? '';

      if (typeof farmerId !== 'string') farmerId = farmerId.toString();
      if (typeof batchId  !== 'string') batchId  = batchId.toString();

      if (
        !farmerId || !batchId ||
        farmerId === 'undefined' || batchId === 'undefined' ||
        farmerId === '[object Object]' || batchId === '[object Object]'
      ) {
        continue;
      }

      if (!farmerMap[farmerId]) farmerMap[farmerId] = [];
      if (!farmerMap[farmerId].includes(batchId)) farmerMap[farmerId].push(batchId);
    }

    console.log('Final farmer map:', farmerMap);
    return farmerMap;

  } catch (error) {
    console.error('Error in getAllFarmersAndBatches:', error);
    return {};
  }
}

async function getBatchesForFarmer(farmer_id) {
  const farmerMap = await getAllFarmersAndBatches();
  return farmerMap[farmer_id] || [];
}

async function getAllFarmers() {
  const farmerMap = await getAllFarmersAndBatches();
  return Object.keys(farmerMap);
}

// ── AccessControl Helpers ──────────────────────────────────────────────────────

async function grantRole(roleBytes32, account) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.grantRole(roleBytes32, account, { nonce });
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function revokeRole(roleBytes32, account) {
  const c = getContract();
  const nonce = await getNextNonce();
  try {
    return await c.revokeRole(roleBytes32, account, { nonce });
  } catch (err) {
    await resetNonce();
    throw err;
  }
}

async function hasRole(roleBytes32, account) {
  const c = getContract();
  return c.hasRole(roleBytes32, account);
}

// ── Exports ────────────────────────────────────────────────────────────────────

module.exports = {
  // nonce utils
  getCurrentNonce,
  resetNonce,
  syncNonce,

  // writes
  addHarvest,
  addProcessing,
  addDistributor,
  addSupplier,
  addShopkeeper,
  addPacket,
  addPacketsInBatch,
  createPackets,
  setBatchProcessing,

  // reads
  getBatchProcessing,
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

  // validation
  checkDistributorExists,
  checkSupplierExists,
  checkShopkeeperExists,
  validatePacketForStage,

  // farmer/batch queries
  getAllFarmersAndBatches,
  getBatchesForFarmer,
  getAllFarmers,

  // access control
  grantRole,
  revokeRole,
  hasRole,
};