const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getContract } = require('../config/blockchain');
const { grantRole, revokeRole, hasRole } = require('../services/contractService');

const router = express.Router();

// Utility to map human-readable role to keccak bytes32 via contract constants
function resolveRoleBytes(role) {
  const c = getContract();
  const key = (role || '').toUpperCase();
  switch (key) {
    case 'FARMER_ROLE':
    case 'FARMER':
      return c.FARMER_ROLE();
    case 'PROCESSOR_ROLE':
    case 'PROCESSOR':
    case 'PROCESSING':
      return c.PROCESSOR_ROLE();
    case 'DISTRIBUTOR_ROLE':
    case 'DISTRIBUTOR':
      return c.DISTRIBUTOR_ROLE();
    case 'SUPPLIER_ROLE':
    case 'SUPPLIER':
      return c.SUPPLIER_ROLE();
    case 'SHOPKEEPER_ROLE':
    case 'SHOPKEEPER':
      return c.SHOPKEEPER_ROLE();
    default:
      throw new Error('Unknown role');
  }
}

// Grant a role to an EOA or contract account
router.post('/grant', authMiddleware, async (req, res) => {
  try {
    const { role, account } = req.body;
    if (!role || !account) return res.status(400).json({ message: 'role and account are required' });
    const roleBytes = await resolveRoleBytes(role);
    const tx = await grantRole(roleBytes, account);
    const receipt = await tx.wait();
    return res.json({ message: 'Role granted', txHash: receipt.hash });
  } catch (error) {
    return res.status(500).json({ message: 'Grant failed', error: error.message });
  }
});

// Revoke a role
router.post('/revoke', authMiddleware, async (req, res) => {
  try {
    const { role, account } = req.body;
    if (!role || !account) return res.status(400).json({ message: 'role and account are required' });
    const roleBytes = await resolveRoleBytes(role);
    const tx = await revokeRole(roleBytes, account);
    const receipt = await tx.wait();
    return res.json({ message: 'Role revoked', txHash: receipt.hash });
  } catch (error) {
    return res.status(500).json({ message: 'Revoke failed', error: error.message });
  }
});

// Check if account has role
router.get('/has', authMiddleware, async (req, res) => {
  try {
    const { role, account } = req.query;
    if (!role || !account) return res.status(400).json({ message: 'role and account are required' });
    const roleBytes = await resolveRoleBytes(role);
    const result = await hasRole(roleBytes, account);
    return res.json({ hasRole: !!result });
  } catch (error) {
    return res.status(500).json({ message: 'Check failed', error: error.message });
  }
});

module.exports = router;


