const { getContract } = require('../config/blockchain');

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


