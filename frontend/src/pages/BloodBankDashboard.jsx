import React, { useContext, useState, useEffect } from 'react'; 
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Activity, ShieldCheck, LogOut, AlertCircle, Box, Truck, CheckCircle, Clock, Map as MapIcon, Crosshair } from 'lucide-react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { QRCodeCanvas } from 'qrcode.react';

// --- PREMIUM MAP MARKERS ---
const bankIcon = new L.divIcon({ 
  className: 'custom-icon', 
  html: `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);"></div>` 
});
const driverIcon = new L.divIcon({ 
  className: 'custom-icon', 
  html: `<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(239, 68, 68, 0.9); animation: pulse 1.5s infinite;"></div>` 
});

// Mock coordinates for the Blood Bank
const BANK_COORDS = [17.31, 76.82];

const BloodBankDashboard = () => {
  const { user, logout } = useContext(AuthContext); 
  const { t } = useTranslation();
  const [socket, setSocket] = useState(null);
  
  const [incomingSOS, setIncomingSOS] = useState([]);
  const [incomingRoutine, setIncomingRoutine] = useState([]); 
  const [activeDispatch, setActiveDispatch] = useState(null);
  const [driverLocation, setDriverLocation] = useState(BANK_COORDS);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // --- EMERGENCY PROTOCOLS ---
    // Filter alerts: Only show if this bank is within the 5km target array (handled mostly by backend, but safe to filter here too if needed)
    newSocket.on('bank-emergency-alert', (data) => setIncomingSOS(prev => [...prev, data]));
    newSocket.on('emergency-resolved', (tripId) => setIncomingSOS(prev => prev.filter(req => req.tripId !== tripId)));
    
    // --- ROUTINE PROTOCOLS ---
    newSocket.on('bank-routine-alert', (data) => setIncomingRoutine(prev => [...prev, data]));
    newSocket.on('routine-resolved', (tripId) => setIncomingRoutine(prev => prev.filter(r => r.tripId !== tripId)));

    // --- DISPATCH TRACKING ---
    newSocket.on('driver-arrived-at-bank', (tripId) => setActiveDispatch(prev => prev?.tripId === tripId ? { ...prev, status: 'EN_ROUTE_TO_HOSPITAL' } : prev));
    newSocket.on('driver-location-update', (data) => setDriverLocation(data.coords));
    
    newSocket.on('trip-completed', (tripId) => {
      setActiveDispatch(prev => {
        if (prev?.tripId === tripId) {
          alert("✅ Hospital Verified OTP! Delivery Successful. Inventory Deducted.");
          return null; 
        }
        return prev;
      });
    });

    return () => newSocket.close();
  }, []);

  const acceptEmergency = (request) => {
    socket.emit('bank-accept-emergency', { 
      tripId: request.tripId, 
      bankId: user.id, 
      bankName: user.name,
      bankCoords: BANK_COORDS // Send coords to find drivers within 5km of BANK
    });
    const qrPayload = JSON.stringify({ tripId: request.tripId, bankId: user.id, authCode: "VERIFIED" });
    setActiveDispatch({ ...request, status: 'AWAITING_DRIVER', qrPayload, type: 'emergency' });
    setIncomingSOS(prev => prev.filter(req => req.tripId !== request.tripId));
  };

  const acceptRoutine = (request) => {
    socket.emit('bank-accept-routine', { tripId: request.tripId, bankId: user.id, bankName: user.name });
    const qrPayload = JSON.stringify({ tripId: request.tripId, bankId: user.id, authCode: "VERIFIED" });
    setActiveDispatch({ ...request, status: 'AWAITING_DRIVER', qrPayload, type: 'routine' });
    setIncomingRoutine(prev => prev.filter(req => req.tripId !== request.tripId));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      
      {/* PROFESSIONAL SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Activity color="#ef4444" size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>VitalDrop</h1>
        </div>
        <nav style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#1e293b', borderRadius: '12px', fontWeight: 'bold' }}>
            <Box size={20} color="#10b981" /> <span>Blood Bank Terminal</span>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{ height: '80px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>Active Node: {user?.name || "Blood Bank Facility"}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <LanguageSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '2px solid #e2e8f0', paddingLeft: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '900', letterSpacing: '1px' }}>● NETWORK ONLINE</div>
              </div>
              <button onClick={logout} style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* INCOMING EMERGENCIES (RED) */}
            <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '2px solid #fee2e2', boxShadow: '0 10px 25px -5px rgba(239,68,68,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '22px' }}><AlertCircle size={28}/> {t('Active SOS Broadcasts')}</h3>
                <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '900' }}>5KM RADAR</span>
              </div>
              
              {incomingSOS.length === 0 ? <p style={{ color: '#64748b', fontSize: '15px' }}>No active emergencies in your sector.</p> : incomingSOS.map(req => (
                <div key={req.tripId} style={{ backgroundColor: '#fff1f2', padding: '20px', borderRadius: '16px', border: '1px solid #fecdd3', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <strong style={{ fontSize: '18px', color: '#7f1d1d' }}>{req.hospitalName}</strong>
                    <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '900' }}>{req.bloodGroup} URGENT</span>
                  </div>
                  <button onClick={() => acceptEmergency(req)} style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.3)' }}>
                    ACCEPT & LOCK INVENTORY
                  </button>
                </div>
              ))}
            </div>

            {/* INCOMING ROUTINE ORDERS (BLUE) */}
            <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '22px' }}><Clock size={28}/> Pending Routine Orders</h3>
                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '900' }}>GLOBAL POOL</span>
              </div>

              {incomingRoutine.length === 0 ? <p style={{ color: '#64748b', fontSize: '15px' }}>No pending routine orders.</p> : incomingRoutine.map(req => (
                <div key={req.tripId} style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '18px', color: '#1e3a8a' }}>{req.hospitalName}</strong>
                    <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '900' }}>{req.bloodGroup} x {req.units} Units</span>
                  </div>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#3b82f6', fontWeight: 'bold' }}>Needed: {req.requiredBy}</p>
                  <button onClick={() => acceptRoutine(req)} style={{ width: '100%', padding: '16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}>
                    <CheckCircle size={20}/> APPROVE & SCHEDULE
                  </button>
                </div>
              ))}
            </div>

          </div>

          {/* DYNAMIC DISPATCH TRACKER */}
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', height: 'fit-content', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 25px 0', fontSize: '22px' }}><ShieldCheck color="#10b981" size={28}/> {t('Active Dispatch')}</h3>

            {!activeDispatch ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                <Truck size={50} style={{ opacity: 0.5, marginBottom: '15px' }} />
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>Awaiting emergency or routine acceptance...</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#0f172a' }}>
                  {activeDispatch.hospitalName}
                  <span style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '900', backgroundColor: activeDispatch.type === 'emergency' ? '#fee2e2' : '#eff6ff', color: activeDispatch.type === 'emergency' ? '#ef4444' : '#3b82f6' }}>
                    {activeDispatch.type.toUpperCase()}
                  </span>
                </p>
                <p style={{ margin: '0 0 25px 0', color: activeDispatch.type === 'emergency' ? '#ef4444' : '#3b82f6', fontWeight: '800', fontSize: '16px' }}>
                  Load: {activeDispatch.bloodGroup} x {activeDispatch.unitsRequired} Units
                </p>

                {activeDispatch.status === 'AWAITING_DRIVER' ? (
                  <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '20px', display: 'inline-block', border: '3px dashed #cbd5e1' }}>
                    <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b', fontWeight: '900', letterSpacing: '1px' }}>DRIVER MUST SCAN TO UNLOCK</p>
                    <QRCodeCanvas value={activeDispatch.qrPayload} size={200} level={"H"} />
                  </div>
                ) : (
                  <div style={{ height: '350px', borderRadius: '20px', overflow: 'hidden', border: '4px solid #10b981', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, background: '#10b981', color: 'white', padding: '8px 12px', fontSize: '13px', fontWeight: '900', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
                      <Truck size={16}/> EN ROUTE TO HOSPITAL
                    </div>
                    <MapContainer center={driverLocation} zoom={14} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      <Marker position={BANK_COORDS} icon={bankIcon}><Popup>Your Facility</Popup></Marker>
                      <Marker position={driverLocation} icon={driverIcon}><Popup>🚨 Ambulance Live Location</Popup></Marker>
                    </MapContainer>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default BloodBankDashboard;