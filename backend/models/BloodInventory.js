const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: { type: String, required: true },
  componentType: { type: String, default: 'Whole Blood' },
  units: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  qrCodeData: { type: String, unique: true, required: true }, 
  status: { type: String, enum: ['available', 'reserved', 'dispatched'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);