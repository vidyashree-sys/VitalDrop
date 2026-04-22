const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (Hospital, Driver, Bank, Donor)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, contact, driverDetails, organizationDetails } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Auto-verify Donors so they can search immediately. 
    // Hospitals, Blood Banks, and Drivers must wait for Admin approval.
    const autoVerify = (role === 'donor');

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      contact,
      isVerified: autoVerify, 
      driverDetails: role === 'driver' ? driverDetails : undefined,
      organizationDetails: (role === 'hospital' || role === 'blood_bank') ? organizationDetails : undefined
    });

    await user.save();
    
    // Send a dynamic message based on role
    if (autoVerify) {
      res.status(201).json({ message: 'Registration successful. You can now log in.' });
    } else {
      res.status(201).json({ message: 'Registration submitted. Awaiting Admin verification.' });
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    // 3. THE KYC GATE: Check if they are verified by Admin
    // Master Admins and Donors are exempt from this block.
    if (!user.isVerified && user.role !== 'admin' && user.role !== 'donor') {
      return res.status(403).json({ 
        message: 'Your account is currently under review by our Admin team. Please check back later.' 
      });
    }

    // 4. Generate Token (if verified or exempt)
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, role: user.role, name: user.name, id: user._id });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;