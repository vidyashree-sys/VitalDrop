const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['hospital', 'driver', 'donor', 'blood_bank', 'admin'], required: true },
  contact: { type: String, required: true },
  
  // --- THE NEW ENTERPRISE FIELDS ---
  // Security Flag: Admins must verify Hospitals, Banks, and Drivers. Donors are auto-verified.
  isVerified: { type: Boolean, default: false }, 

  // Fields strictly for Drivers (like Uber/Rapido)
  driverDetails: {
    vehicleType: { type: String, enum: ['Bike', 'Car', 'Ambulance', 'Refrigerated Van'] },
    vehiclePlate: { type: String }, // e.g., KA-32-AB-1234
    licenseNumber: { type: String } // e.g., DL-14-2020-1234567
  },

  // Fields strictly for Hospitals and Blood Banks
  organizationDetails: {
    medicalRegistrationNumber: { type: String }, // e.g., Government Health ID
    addressLine: { type: String }
  },
  // ---------------------------------

  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  status: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' }
}, { timestamps: true });

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', userSchema);