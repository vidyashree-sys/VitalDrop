const express = require('express');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/admin/pending-users
// @desc    Get all users waiting for verification
router.get('/pending-users', async (req, res) => {
  try {
    // Find users who are NOT verified and are NOT donors
    const pendingUsers = await User.find({ 
      isVerified: false, 
      role: { $ne: 'donor' } 
    }).sort({ createdAt: -1 }).select('-password'); // Added .select() to hide passwords from the frontend!
    
    res.json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({ message: 'Server error fetching pending users' });
  }
});

// @route   PUT /api/admin/approve/:id
// @desc    Approve a user's account
router.put('/approve/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { isVerified: true }, 
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User approved successfully!', user });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ message: 'Error approving user' });
  }
});

module.exports = router;