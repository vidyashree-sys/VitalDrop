const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalName: { type: String, required: true },
  bank: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bankName: { type: String },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverName: { type: String },
  
  bloodGroup: { type: String, required: true },
  units: { type: Number, required: true },
  requiredBy: { type: String },
  // NEW FIELD: Distinguish between Emergency (Socket) and Routine (API)
  type: { type: String, enum: ['emergency', 'routine'], default: 'emergency' },
  
  status: { type: String, default: 'pending' },
  otp: { type: String },
  
  createdAt: { type: Date, default: Date.now }
  
});

module.exports = mongoose.model('Trip', TripSchema);