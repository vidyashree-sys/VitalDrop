const express = require('express');
const BloodInventory = require('../models/BloodInventory');

const router = express.Router();

// @route   GET /api/public/search
// @desc    Search for available blood (No Auth Required)
router.get('/search', async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    
    // Base query: Only look for blood that is currently 'available'
    let query = { status: 'available' };
    
    // If the user selected a specific blood type, add it to the filter
    if (bloodGroup && bloodGroup !== 'All') {
      // Allow exact match, or encode the '+' symbol properly
      query.bloodGroup = bloodGroup.replace(' ', '+'); 
    }

    // Find the blood and "populate" the bloodBank field so we get the Hospital's name and contact info
    const inventory = await BloodInventory.find(query)
      .populate('bloodBank', 'name contact location') 
      .sort({ createdAt: -1 });

    res.json(inventory);
  } catch (error) {
    console.error("Public Search Error:", error);
    res.status(500).json({ message: 'Server error while searching inventory' });
  }
});

module.exports = router;