const express = require('express');
const crypto = require('crypto'); // Built into Node.js, no need to install
const BloodInventory = require('../models/BloodInventory');
const auth = require('../middleware/authMiddleware'); // Bring in the security guard

const router = express.Router();

// @route   POST /api/inventory/add
// @desc    Add new blood units to inventory (Protected Route)
router.post('/add', auth, async (req, res) => {
  try {
    // Only allow hospitals or blood banks to add inventory
    if (req.user.role !== 'hospital' && req.user.role !== 'blood_bank') {
      return res.status(403).json({ message: 'Access denied. Only hospitals can add inventory.' });
    }

    const { bloodGroup, componentType, units, expiryDays } = req.body;

    // Calculate expiry date (e.g., today + 35 days for whole blood)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 35));

    // Generate a unique ID for the QR Code
    const qrCodeData = `VD-${req.user.id.substring(0, 4)}-${crypto.randomUUID()}`;

    // Create the inventory record
    const newBlood = new BloodInventory({
      bloodBank: req.user.id, // Pulled securely from the JWT token
      bloodGroup,
      componentType,
      units,
      expiryDate,
      qrCodeData,
      status: 'available'
    });

    await newBlood.save();
    res.status(201).json({ message: 'Blood inventory added successfully', data: newBlood });

  } catch (error) {
    console.error("Inventory Add Error:", error);
    res.status(500).json({ message: 'Server error while adding inventory' });
  }
});

// @route   GET /api/inventory/my-inventory
// @desc    Get all inventory for the logged-in hospital (Protected Route)
router.get('/my-inventory', auth, async (req, res) => {
  try {
    // Find all blood units belonging to this specific user ID
    const inventory = await BloodInventory.find({ bloodBank: req.user.id }).sort({ createdAt: -1 });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching inventory' });
  }
});

module.exports = router;