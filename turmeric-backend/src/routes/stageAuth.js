const express = require('express');
const jwt = require('jsonwebtoken');
const StageUser = require('../models/StageUser');
const authMiddleware = require('../middleware/auth');
const { getContract } = require('../config/blockchain');
const { grantRole} = require('../services/contractService');
const router = express.Router();


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

// Stage user login
router.post('/login', async (req, res) => {
  try {
    const { username, password, stage } = req.body;

    // Check if stage user exists
    const stageUser = await StageUser.findOne({ 
      username, 
      stage,
      isActive: true 
    });
    
    if (!stageUser) {
      return res.status(400).json({ message: 'Invalid credentials or stage' });
    }

    // Check password
    const isMatch = await stageUser.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: stageUser._id, 
        stage: stageUser.stage,
        type: 'stage_user'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      stageUser: {
        id: stageUser._id,
        username: stageUser.username,
        stage: stageUser.stage
      }
    });
  } catch (error) {
    console.error('Stage login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current stage user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'stage_user') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const stageUser = await StageUser.findById(decoded.id).select('-password');
    
    if (!stageUser || !stageUser.isActive) {
      return res.status(401).json({ message: 'Stage user not found or inactive' });
    }

    res.json({
      stageUser: {
        id: stageUser._id,
        username: stageUser.username,
        stage: stageUser.stage
      }
    });
  } catch (error) {
    console.error('Get stage user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Admin routes for managing stage users
// router.post('/create', authMiddleware, async (req, res) => {
//   try {
//     const { username, password, stage } = req.body;

//     // Check if stage user already exists
//     const existingUser = await StageUser.findOne({ username, stage });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Stage user already exists' });
//     }

//     // Create new stage user
//     const stageUser = new StageUser({
//       username,
//       password,
//       stage,
//       createdBy: req.admin._id
//     });

//     await stageUser.save();

//     res.status(201).json({
//       message: 'Stage user created successfully',
//       stageUser: {
//         id: stageUser._id,
//         username: stageUser.username,
//         stage: stageUser.stage,
//         isActive: stageUser.isActive
//       }
//     });
//   } catch (error) {
//     console.error('Create stage user error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });




// Correct Admin routes for managing stage users
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { username, password, stage } = req.body;

    // Check if stage user already exists
    const existingUser = await StageUser.findOne({ username, stage });
    if (existingUser) {
      return res.status(400).json({ message: 'Stage user already exists' });
    }

    // Create new stage user
    const stageUser = new StageUser({
      username,
      password,
      stage,
      createdBy: req.admin._id
    });

    await stageUser.save();

    // Grant role on blockchain
    try {
     const role = stage.toUpperCase(); // using stage as role
      console.log("role is :",role);
      const account = process.env.ACCOUNT_ADDRESS; 
      console.log("account is :",account);

      if (!role || !account) {
        return res.status(400).json({ message: 'role and account are required' });
      }

      const roleBytes = await resolveRoleBytes(role);
      const tx = await grantRole(roleBytes, account);
      const receipt = await tx.wait();

      // Final response
      return res.status(201).json({
        message: 'Stage user created and role granted successfully',
        stageUser: {
          id: stageUser._id,
          username: stageUser.username,
          stage: stageUser.stage,
          isActive: stageUser.isActive
        },
        blockchain: {
          txHash: receipt.hash,
          roleGranted: role
        }
      });

    } catch (error) {
      console.error("Grant role error:", error);
      return res.status(500).json({ message: 'User created but grantRole failed', error: error.message });
    }

  } catch (error) {
    console.error('Create stage user error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get all stage users (admin only)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const stageUsers = await StageUser.find()
      .select('-password')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({ stageUsers });
  } catch (error) {
    console.error('Get stage users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update stage user status (admin only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    const stageUser = await StageUser.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!stageUser) {
      return res.status(404).json({ message: 'Stage user not found' });
    }

    res.json({
      message: 'Stage user status updated',
      stageUser
    });
  } catch (error) {
    console.error('Update stage user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete stage user (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const stageUser = await StageUser.findByIdAndDelete(req.params.id);

    if (!stageUser) {
      return res.status(404).json({ message: 'Stage user not found' });
    }

    res.json({ message: 'Stage user deleted successfully' });
  } catch (error) {
    console.error('Delete stage user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
