const mongoose = require('mongoose');

const packetSchema = new mongoose.Schema({
  packet_id: { type: String, required: true, unique: true, index: true },
  batch_id: { type: String, required: true, index: true },
  farmer_id: { type: String, required: true, index: true },
  packet_size_gm: { type: Number, required: true },
  current_stage: {
    type: String,
    required: true,
    enum: ['processing', 'distributor', 'supplier', 'shopkeeper'],
    default: 'processing',
    index: true,
  },
  is_sold: { type: Boolean, default: false, index: true },
  sold_at: { type: Date, default: null },
  sold_tx_hash: { type: String, default: '' },
}, { timestamps: true });

packetSchema.index({ batch_id: 1, current_stage: 1 });
packetSchema.index({ batch_id: 1, current_stage: 1, is_sold: 1 });

module.exports = mongoose.model('Packet', packetSchema);
