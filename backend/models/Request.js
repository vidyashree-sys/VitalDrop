const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, required: true },
  priority: { type: String, enum: ['normal', 'emergency'], default: 'normal' },
  status: { type: String, enum: ['pending', 'accepted', 'in_transit', 'delivered'], default: 'pending' },
  
  // Logistics linking
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sourceBloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  otp: { type: String } // For 3-way verification handshake
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);