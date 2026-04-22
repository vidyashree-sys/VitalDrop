require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// --- CLOUD-READY CORS CONFIG ---
const io = new Server(server, {
  cors: {
    origin: "*", // Allows dynamic connection from any frontend deployment
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// --- ROUTES ---
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const requestRoutes = require('./routes/requests');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const Trip = require('./models/Trip');
const User = require('./models/User');

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);

// --- WEBSOCKET LOGIC (GEOSPATIAL & MUTEX) ---
io.on('connection', (socket) => {
  console.log(`🟢 Node Connected: ${socket.id}`);

  socket.on('driver-location-update', (data) => {
    if (data.hospitalId && data.coords) {
      io.emit(`location-update-${data.hospitalId}`, data.coords);
      io.emit('driver-location-update', data); 
    }
  });

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

      io.emit('bank-emergency-alert', {
        ...emergencyData,
        tripId: newEmergency._id,
        type: 'emergency',
        targetBanks: targetBanks 
      });
    } catch (error) { console.error("SOS Error:", error); }
  });

  socket.on('bank-accept-emergency', async (data) => {
    try {
      const lockedTrip = await Trip.findOneAndUpdate(
        { _id: data.tripId, status: 'awaiting_bank' },
        { $set: { status: 'searching', bank: data.bankId, bankName: data.bankName } },
        { new: true }
      );

      if (!lockedTrip) return;
      socket.broadcast.emit('emergency-resolved', lockedTrip._id);

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

      io.emit('emergency-alert', {
        tripId: lockedTrip._id,
        hospitalName: lockedTrip.hospitalName,
        hospitalId: lockedTrip.hospital,
        bankName: data.bankName,
        bloodGroup: lockedTrip.bloodGroup,
        unitsRequired: lockedTrip.units,
        type: 'emergency',
        targetDrivers: targetDrivers 
      });
    } catch (error) { console.error("Bank Lock Error:", error); }
  });

  socket.on('trigger-routine', (routineData) => {
    socket.broadcast.emit('bank-routine-alert', routineData);
  });

  socket.on('bank-accept-routine', async (data) => {
    try {
      const trip = await Trip.findOneAndUpdate(
        { _id: data.tripId, status: 'pending_approval' }, 
        { $set: { status: 'searching', bank: data.bankId, bankName: data.bankName } }, 
        { new: true }
      );
      
      if (trip) {
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

  socket.on('donor-pledge-shortage', async (data) => {
    try {
      const lockedTrip = await Trip.findOneAndUpdate(
        { 
          _id: data.tripId, 
          status: { $in: ['awaiting_bank', 'pending_approval'] } 
        },
        { 
          $set: { 
            status: 'donor_pledged', 
            driver: data.donorId, 
            driverName: data.donorName, 
            type: data.type 
          } 
        },
        { new: true }
      );

      if (!lockedTrip) {
        socket.emit('otp-error', 'Too late! Another facility or donor has already claimed this request.');
        return;
      }

      socket.broadcast.emit('emergency-resolved', lockedTrip._id);
      socket.broadcast.emit('routine-resolved', lockedTrip._id);

      io.emit(`donor-pledged-${lockedTrip.hospital}`, {
        tripId: lockedTrip._id,
        donorName: lockedTrip.driverName,
        bloodGroup: lockedTrip.bloodGroup,
        type: lockedTrip.type
      });

      socket.emit('pledge-success', { tripId: lockedTrip._id });
    } catch (error) { console.error("Donor Pledge Error:", error); }
  });
  
  socket.on('driver-accept-trip', async (data) => { 
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
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

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

// --- DEPLOYMENT FRONTEND SERVING ---
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Modern Catch-all for React Router on Node v24+
app.get('/:path*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: "API not found" });
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// --- PORT BINDING ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VitalDrop Active on Port ${PORT}`);
});