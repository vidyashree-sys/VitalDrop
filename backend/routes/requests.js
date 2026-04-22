const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Trip = require('../models/Trip');

// Simple Middleware to verify token
const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No auth token found' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid' });
  }
};

// @route   POST /api/requests/routine
// @desc    Hospital submits a normal blood request
router.post('/routine', protect, async (req, res) => {
  try {
    const { bloodGroup, units, hospitalName, requiredBy } = req.body; // Add requiredBy
    
    const routineRequest = new Trip({
      hospital: req.user.id,
      hospitalName: hospitalName,
      bloodGroup: bloodGroup,
      units: units,
      requiredBy: requiredBy, // Save it to DB
      type: 'routine',
      status: 'pending_approval'
    });

    await routineRequest.save();
    res.status(201).json(routineRequest);
  } catch (err) {
    res.status(500).json({ message: 'Server Error saving routine request' });
  }
});

// @route   GET /api/requests/my-requests
// @desc    Get history for logged-in Hospital
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Trip.find({ hospital: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server Error fetching history' });
  }
});

// @route   GET /api/requests/all
// @desc    Admin gets ALL network requests
router.get('/all', protect, async (req, res) => {
  try {
    const requests = await Trip.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server Error fetching all requests' });
  }
});

module.exports = router;