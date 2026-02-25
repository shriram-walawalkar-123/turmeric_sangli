const mongoose = require('mongoose');

const batchStockSchema = new mongoose.Schema({
  farmer_id: { type: String, required: true, index: true },
  batch_id: { type: String, required: true, unique: true, index: true },
  quantity_gm: { type: Number, required: true },           // raw quantity from harvest
  available_gm: { type: Number, required: true },          // after 8% processing reduction
  used_gm: { type: Number, default: 0 },                   // consumed by packets created
  packet_ids: [{ type: String }],                           // list of packet IDs created from this batch
  packet_size_gm: { type: Number, default: null },         // last used packet size (optional)
}, { timestamps: true });

batchStockSchema.index({ farmer_id: 1, batch_id: 1 });

module.exports = mongoose.model('BatchStock', batchStockSchema);
