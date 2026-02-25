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
}, { timestamps: true });

packetSchema.index({ batch_id: 1, current_stage: 1 });

module.exports = mongoose.model('Packet', packetSchema);
