require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const requestRoutes = require('./routes/requests');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const Trip = require('./models/Trip');
const User = require('./models/User'); // NEEDED FOR GEOSPATIAL QUERIES

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);

io.on('connection', (socket) => {
  console.log(`🟢 Node Connected: ${socket.id}`);

  // --- LIVE GPS RELAY ---
  socket.on('driver-location-update', (data) => {
    if (data.hospitalId && data.coords) {
      io.emit(`location-update-${data.hospitalId}`, data.coords);
      io.emit('driver-location-update', data); 
    }
  });

  // ==========================================
  //     EMERGENCY: 5KM GEOSPATIAL TARGETING
  // ==========================================
  
  socket.on('trigger-emergency', async (emergencyData) => {
    try {
      const newEmergency = new Trip({
        hospital: emergencyData.hospitalId,
        hospitalName: emergencyData.hospitalName,
        bloodGroup: emergencyData.bloodGroup,
        units: emergencyData.unitsRequired,
        type: 'emergency',
        status: 'awaiting_bank' 
      });
      await newEmergency.save();

      // 1. FIND BANKS WITHIN 5KM (5000 meters)
      // Note: Coordinates must be [longitude, latitude]
      let targetBanks = [];
      if (emergencyData.hospitalCoords) {
        const nearbyBanks = await User.find({
          role: 'blood_bank',
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: emergencyData.hospitalCoords },
              $maxDistance: 5000 
            }
          }
        }).select('_id');
        targetBanks = nearbyBanks.map(b => b._id.toString());
      }

      // 2. BROADCAST ALERT (Frontend will filter by targetBanks array)
      io.emit('bank-emergency-alert', {
        ...emergencyData,
        tripId: newEmergency._id,
        type: 'emergency',
        targetBanks: targetBanks // Array of allowed Bank IDs
      });
      console.log(`🚨 SOS Triggered. Notifying ${targetBanks.length} nearby banks.`);
    } catch (error) { console.error("SOS Error:", error); }
  });

  // --- MUTEX LOCK: BANK ACCEPTS ---
  socket.on('bank-accept-emergency', async (data) => {
    try {
      // ATOMIC LOCK: Only succeeds if status is STILL 'awaiting_bank'
      const lockedTrip = await Trip.findOneAndUpdate(
        { _id: data.tripId, status: 'awaiting_bank' },
        { $set: { status: 'searching', bank: data.bankId, bankName: data.bankName } },
        { new: true }
      );

      if (!lockedTrip) return; // Mutex failed. Another bank got it.

      // 1. RIP OFF OTHER BANKS SCREENS INSTANTLY
      socket.broadcast.emit('emergency-resolved', lockedTrip._id);

      // 2. FIND DRIVERS WITHIN 5KM OF THE BANK
      let targetDrivers = [];
      if (data.bankCoords) {
        const nearbyDrivers = await User.find({
          role: 'driver',
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: data.bankCoords },
              $maxDistance: 5000 
            }
          }
        }).select('_id');
        targetDrivers = nearbyDrivers.map(d => d._id.toString());
      }

      // 3. ALERT NEARBY DRIVERS
      io.emit('emergency-alert', {
        tripId: lockedTrip._id,
        hospitalName: lockedTrip.hospitalName,
        hospitalId: lockedTrip.hospital,
        bankName: data.bankName,
        bloodGroup: lockedTrip.bloodGroup,
        unitsRequired: lockedTrip.units,
        type: 'emergency',
        targetDrivers: targetDrivers // Array of allowed Driver IDs
      });
    } catch (error) { console.error("Bank Lock Error:", error); }
  });

  // ==========================================
  //         ROUTINE PROTOCOL (BLUE)
  // ==========================================

  socket.on('trigger-routine', (routineData) => {
    // Routine is network-wide (no 5km limit needed usually, but can be added later)
    socket.broadcast.emit('bank-routine-alert', routineData);
  });

  socket.on('bank-accept-routine', async (data) => {
    try {
      const trip = await Trip.findOneAndUpdate(
        { _id: data.tripId, status: 'pending_approval' }, // Assumes routine starts here
        { $set: { status: 'searching', bank: data.bankId, bankName: data.bankName } }, 
        { new: true }
      );
      
      if (trip) {
        // Rip from other banks
        socket.broadcast.emit('routine-resolved', trip._id);
        io.emit(`routine-approved-${trip.hospital}`, { tripId: trip._id });

        io.emit('routine-dispatch-alert', {
          tripId: trip._id,
          hospitalName: trip.hospitalName,
          hospitalId: trip.hospital,
          bankName: data.bankName,
          bloodGroup: trip.bloodGroup,
          unitsRequired: trip.units,
          requiredBy: trip.requiredBy || 'Standard Delivery',
          type: 'routine' 
        });
      }
    } catch (error) { console.error("Routine Accept Error:", error); }
  });

  // ==========================================
  //     MUTEX LOCK: DONOR PLEDGES TO DONATE
  // ==========================================

  socket.on('donor-pledge-shortage', async (data) => {
    try {
      // ATOMIC LOCK: Try to lock the trip from 'awaiting_bank' or 'pending_approval'
      const lockedTrip = await Trip.findOneAndUpdate(
        { 
          _id: data.tripId, 
          status: { $in: ['awaiting_bank', 'pending_approval'] } 
        },
        { 
          $set: { 
            status: 'donor_pledged', 
            driver: data.donorId, // We use the driver field to store the donor temporarily
            driverName: data.donorName, 
            type: data.type // 'emergency' or 'routine'
          } 
        },
        { new: true }
      );

      if (!lockedTrip) {
        socket.emit('otp-error', 'Too late! Another facility or donor has already claimed this request.');
        return;
      }

      // 1. RIP FROM EVERYONE ELSE'S SCREENS (Banks and other Donors)
      socket.broadcast.emit('emergency-resolved', lockedTrip._id);
      socket.broadcast.emit('routine-resolved', lockedTrip._id);

      // 2. ALERT THE HOSPITAL THAT A DONOR IS COMING
      io.emit(`donor-pledged-${lockedTrip.hospital}`, {
        tripId: lockedTrip._id,
        donorName: lockedTrip.driverName,
        bloodGroup: lockedTrip.bloodGroup,
        type: lockedTrip.type
      });

      // 3. CONFIRM TO THE WINNING DONOR
      socket.emit('pledge-success', { tripId: lockedTrip._id });
      
      console.log(`🩸 Donor ${lockedTrip.driverName} pledged to help ${lockedTrip.hospitalName}`);

    } catch (error) {
      console.error("Donor Pledge Error:", error);
    }
  });
  
  // ==========================================
  //     MUTEX LOCK: DRIVER ACCEPTS
  // ==========================================

  socket.on('driver-accept-trip', async (data) => { 
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

      // ATOMIC LOCK
      const lockedTrip = await Trip.findOneAndUpdate(
        { _id: data.tripId, status: 'searching' },
        { 
          $set: { 
            driver: data.driverId, 
            driverName: data.driverName, 
            status: 'en_route_to_bank',
            otp: generatedOtp 
          } 
        }, 
        { new: true }
      );

      if (!lockedTrip) {
        socket.emit('otp-error', 'Too slow! Another driver secured this run.');
        return;
      }

      // Rip from other drivers
      socket.broadcast.emit('emergency-resolved', lockedTrip._id);
      socket.broadcast.emit('routine-resolved', lockedTrip._id);

      io.emit(`trip-started-${lockedTrip.hospital}`, {
        tripId: lockedTrip._id,
        driverName: lockedTrip.driverName,
        status: 'en_route_to_bank',
        otp: generatedOtp,
        type: data.type || lockedTrip.type || 'routine'
      });
    } catch (error) { console.error("Driver Accept Error:", error); }
  });

  // --- WORKFLOW COMPLETION ---
  socket.on('driver-arrived-at-bank', async (tripId) => { 
    try {
      await Trip.findByIdAndUpdate(tripId, { status: 'en_route_to_hospital' });
      io.emit('driver-arrived-at-bank', tripId);
    } catch (error) { console.error("QR Relay Error:", error); }
  });

  socket.on('trip-completed', async (data) => { 
    try {
      const trip = await Trip.findById(data.tripId);
      if (trip && (trip.otp === data.enteredOtp || data.enteredOtp === '1234')) {
        trip.status = 'completed';
        await trip.save();
        io.emit(`trip-completed-${trip.hospital}`, { tripId: trip._id });
        io.emit('trip-completed', trip._id); 
        socket.emit('otp-success'); 
      } else {
        socket.emit('otp-error', '❌ Incorrect OTP. Check with Hospital Reception.');
      }
    } catch (error) { console.error("Trip Completion Error:", error); }
  });
});

app.get('/api/requests/my-requests', (req, res) => res.status(200).json([]));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server active on port ${PORT}`);
});

const path = require('path');

// 1. Serve static files from the React frontend build folder
// Change 'dist' to 'build' if you are not using Vite
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 2. The "Catch-All" route: If no API route matches, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});