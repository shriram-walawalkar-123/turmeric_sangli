// Authorizes stage users based on JWT payload from stage login
const jwt = require('jsonwebtoken');

const ROLE_MAP = {
  farmer: 'FARMER_ROLE',
  processing: 'PROCESSOR_ROLE',
  distributor: 'DISTRIBUTOR_ROLE',
  supplier: 'SUPPLIER_ROLE',
  shopkeeper: 'SHOPKEEPER_ROLE',
};

function stageGuard(requiredStage) {
  return (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ message: 'No token' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (decoded.type !== 'stage_user') {
        return res.status(401).json({ message: 'Invalid token type' });
      }
      if (decoded.stage !== requiredStage) {
        return res.status(403).json({ message: 'Forbidden: stage mismatch' });
      }
      req.stageUser = { id: decoded.id, stage: decoded.stage };
      req.stageRoleKey = ROLE_MAP[decoded.stage];
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized', error: err.message });
    }
  };
}

module.exports = { stageGuard };


