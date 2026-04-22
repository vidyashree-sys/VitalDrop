import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Truck, AlertCircle, LogOut, Navigation, Key, Camera, CheckCircle, Clock, Map as MapIcon, ShieldCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import LanguageSwitcher from '../components/LanguageSwitcher';

// --- PREMIUM MAP MARKERS ---
const driverIcon = new L.divIcon({ className: 'custom-icon', html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 15px rgba(239,68,68,0.9); animation: pulse 1.5s infinite;"></div>` });
const bankIcon = new L.divIcon({ className: 'custom-icon', html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);"></div>` });
const hospitalIcon = new L.divIcon({ className: 'custom-icon', html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>` });

// Mock Coordinates for visual routing
const BANK_COORDS = [17.31, 76.82];
const HOSPITAL_COORDS = [17.3297, 76.8343];

const DriverDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const [socket, setSocket] = useState(null);

  const [incomingAlerts, setIncomingAlerts] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripPhase, setTripPhase] = useState('IDLE'); 
  const [otpInput, setOtpInput] = useState('');
  const [driverCoords, setDriverCoords] = useState([17.30, 76.81]); // Starting slightly southwest of bank

  useEffect(() => {
    // PRODUCTION FIX: Use relative socket connection for Render deployment
    const newSocket = io({ transports: ['websocket'] });
    setSocket(newSocket);

    // CATCH ALERTS (Backend now filters this by 5km radius)
    newSocket.on('emergency-alert', (data) => setIncomingAlerts(prev => [...prev, { ...data, type: 'emergency' }]));
    newSocket.on('routine-dispatch-alert', (data) => setIncomingAlerts(prev => [...prev, { ...data, type: 'routine' }]));
    
    // REMOVE ALERTS IF TAKEN BY ANOTHER DRIVER
    newSocket.on('emergency-resolved', (tripId) => setIncomingAlerts(prev => prev.filter(req => req.tripId !== tripId)));
    newSocket.on('routine-resolved', (tripId) => setIncomingAlerts(prev => prev.filter(req => req.tripId !== tripId)));

    // COMPLETION LOGIC
    newSocket.on('otp-success', () => {
      alert("✅ Delivery Successful! Hospital Confirmed. Returning to IDLE.");
      setActiveTrip(null);
      setTripPhase('IDLE');
      setOtpInput('');
    });

    newSocket.on('otp-error', (msg) => {
      alert(msg);
      setOtpInput(''); 
    });

    return () => newSocket.close();
  }, []);

  // GPS BEACON SIMULATOR (Moves driver towards Hospital when in Phase 3)
  useEffect(() => {
    let gpsInterval;
    if (tripPhase === 'TO_HOSPITAL' && activeTrip && socket) {
      gpsInterval = setInterval(() => {
        setDriverCoords(prev => {
          // Move slowly NorthEast towards Hospital [17.3297, 76.8343]
          const newCoords = [prev[0] + 0.0005, prev[1] + 0.0005]; 
          socket.emit('driver-location-update', {
            tripId: activeTrip.tripId,
            hospitalId: activeTrip.hospitalId,
            coords: newCoords
          });
          return newCoords;
        });
      }, 2000); 
    }
    return () => clearInterval(gpsInterval);
  }, [tripPhase, activeTrip, socket]);

  const acceptTrip = (trip) => {
    setActiveTrip(trip);
    setTripPhase('TO_BANK');
    setIncomingAlerts(prev => prev.filter(t => t.tripId !== trip.tripId));
    if(socket) socket.emit('driver-accept-trip', { tripId: trip.tripId, driverId: user.id, driverName: user.name, type: trip.type });
  };

  const handleQRScan = (result) => {
    if (!result || tripPhase !== 'TO_BANK') return;
    try {
      const rawText = result[0]?.rawValue || result.text || result;
      const scannedData = JSON.parse(rawText);
      if (scannedData.tripId === activeTrip.tripId) {
        setTripPhase('TO_HOSPITAL');
        setDriverCoords(BANK_COORDS); // Snap to bank before driving to hospital
        if (socket) socket.emit('driver-arrived-at-bank', activeTrip.tripId);
      }
    } catch (err) { alert("Invalid QR Format."); }
  };

  const forceVerifyBank = () => {
    setTripPhase('TO_HOSPITAL');
    setDriverCoords(BANK_COORDS);
    if (socket) socket.emit('driver-arrived-at-bank', activeTrip?.tripId);
  };

  const verifyHospitalOTP = () => {
    if (otpInput.length === 4 && socket) {
      socket.emit('trip-completed', { tripId: activeTrip.tripId, enteredOtp: otpInput });
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Truck color="#ef4444" size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>VitalDrop</h1>
        </div>
        <nav style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#1e293b', borderRadius: '12px', fontWeight: 'bold' }}>
            <Navigation size={20} color="#3b82f6" /> <span>Dispatch Console</span>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* HEADER */}
        <header style={{ height: '80px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>Callsign: {user?.name || "Pilot"}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <LanguageSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '2px solid #e2e8f0', paddingLeft: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '900', letterSpacing: '1px' }}>
                  ● {tripPhase === 'IDLE' ? 'AWAITING PINGS' : 'ON ACTIVE DISPATCH'}
                </div>
              </div>
              <button onClick={logout} style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* PHASE 1: IDLE / INCOMING ALERTS */}
            {tripPhase === 'IDLE' && (
              <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}><AlertCircle size={28}/> {t('Local Dispatch Radar')}</h3>
                  <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '900' }}>5KM RADIUS</span>
                </div>

                {incomingAlerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                    <ShieldCheck size={40} style={{ opacity: 0.5, marginBottom: '15px' }} />
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>Sector Clear. No active dispatches nearby.</p>
                  </div>
                ) : incomingAlerts.map((trip, idx) => {
                  
                  // DYNAMIC STYLING: RED FOR EMERGENCY, BLUE FOR ROUTINE
                  const isEmergency = trip.type === 'emergency' || !trip.type;
                  const mainColor = isEmergency ? '#ef4444' : '#3b82f6';
                  const bgColor = isEmergency ? '#fff1f2' : '#eff6ff';

                  return (
                    <div key={idx} style={{ backgroundColor: bgColor, padding: '20px', borderRadius: '20px', border: `2px solid ${mainColor}`, marginBottom: '15px', boxShadow: `0 4px 6px -1px ${isEmergency ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <strong style={{ fontSize: '18px', color: '#0f172a', fontWeight: '900' }}>{trip.hospitalName}</strong>
                        <span style={{ background: mainColor, color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {isEmergency ? <AlertCircle size={16}/> : <Clock size={16}/>}
                          {isEmergency ? 'URGENT SOS' : 'STANDARD'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#475569', fontWeight: '600' }}><strong>Load:</strong> {trip.bloodGroup} ({trip.unitsRequired} Units)</p>
                      <p style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#475569', fontWeight: '600' }}><strong>Pickup:</strong> {trip.bankName}</p>
                      
                      {!isEmergency && <p style={{ margin: '5px 0 15px 0', fontSize: '14px', color: mainColor, fontWeight: '800' }}>Timeframe: {trip.requiredBy}</p>}
                      
                      <button onClick={() => acceptTrip(trip)} style={{ width: '100%', padding: '18px', background: mainColor, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginTop: isEmergency ? '15px' : '5px', transition: 'transform 0.1s' }}>
                        ACCEPT RUN & NAVIGATE
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PHASE 2: BANK PICKUP & QR */}
            {tripPhase === 'TO_BANK' && (
              <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '3px solid #3b82f6', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.15)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}><Camera size={28}/> Step 1: Scan Blood Bank</h3>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5' }}>Arrive at <strong>{activeTrip?.bankName}</strong> and scan their terminal QR code to securely unlock the container.</p>
                <div style={{ borderRadius: '20px', overflow: 'hidden', border: '4px solid #e2e8f0', marginBottom: '20px' }}>
                   <Scanner onScan={handleQRScan} />
                </div>
                <button onClick={forceVerifyBank} style={{ width: '100%', padding: '15px', background: '#f1f5f9', color: '#64748b', border: '2px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '14px' }}>
                  DEV: BYPASS CAMERA & FORCE VERIFY
                </button>
              </div>
            )}

            {/* PHASE 3: HOSPITAL OTP */}
            {tripPhase === 'TO_HOSPITAL' && (
              <div style={{ backgroundColor: 'white', padding: '40px 30px', borderRadius: '24px', border: '4px solid #10b981', boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '70px', height: '70px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}><Key size={35} color="#15803d" /></div>
                <h3 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '26px', fontWeight: '900' }}>Hospital Handover</h3>
                <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', marginBottom: '30px' }}>
                  Arrived at <strong>{activeTrip?.hospitalName}</strong>.<br/> Ask Reception for the <span style={{ color: '#10b981', fontWeight: '900' }}>4-Digit Security OTP</span>.
                </p>
                <input type="text" maxLength="4" placeholder="• • • •" value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', maxWidth: '280px', padding: '25px', borderRadius: '20px', border: '3px solid #cbd5e1', textAlign: 'center', fontSize: '48px', letterSpacing: '20px', fontWeight: '900', color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: '30px', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#10b981'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'} />
                <button onClick={verifyHospitalOTP} disabled={otpInput.length !== 4} style={{ width: '100%', padding: '22px', background: otpInput.length === 4 ? '#10b981' : '#94a3b8', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '18px', cursor: otpInput.length === 4 ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: 'all 0.3s', boxShadow: otpInput.length === 4 ? '0 10px 15px -3px rgba(16, 185, 129, 0.4)' : 'none' }}>
                  <CheckCircle size={24} /> CONFIRM SECURE DELIVERY
                </button>
              </div>
            )}

          </div>

          {/* PREMIUM DARK MODE MAP & ROUTING */}
          <div style={{ height: '70vh', borderRadius: '24px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            
            {/* Dynamic Map Header based on Phase */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.95)', color: 'white', padding: '15px 20px', borderRadius: '12px', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
               <span style={{fontSize: '12px', color: '#94a3b8', fontWeight: '900', letterSpacing: '1px'}}>CURRENT HEADING</span>
               <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold'}}>
                  <MapIcon size={18} color={tripPhase === 'TO_BANK' ? '#3b82f6' : tripPhase === 'TO_HOSPITAL' ? '#10b981' : '#ef4444'}/> 
                  {tripPhase === 'IDLE' ? 'Awaiting Dispatch' : tripPhase === 'TO_BANK' ? activeTrip?.bankName : activeTrip?.hospitalName}
               </div>
            </div>

            <MapContainer center={driverCoords} zoom={13} style={{ height: '100%', width: '100%' }}>
              {/* DARK MODE MAP TILE */}
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              <Marker position={driverCoords} icon={driverIcon}><Popup>Your Vehicle</Popup></Marker>
              
              {/* If on a trip, show the destination markers and draw a routing line */}
              {tripPhase !== 'IDLE' && (
                <>
                  <Marker position={BANK_COORDS} icon={bankIcon}><Popup>Pickup: {activeTrip?.bankName}</Popup></Marker>
                  <Marker position={HOSPITAL_COORDS} icon={hospitalIcon}><Popup>Dropoff: {activeTrip?.hospitalName}</Popup></Marker>
                  
                  {/* Draw line to Bank if in Phase 2, or line to Hospital if in Phase 3 */}
                  <Polyline 
                    positions={[driverCoords, tripPhase === 'TO_BANK' ? BANK_COORDS : HOSPITAL_COORDS]} 
                    pathOptions={{ color: tripPhase === 'TO_BANK' ? '#3b82f6' : '#10b981', weight: 4, dashArray: '10, 10' }} 
                  />
                </>
              )}
            </MapContainer>
          </div>

        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;