import React, { useContext, useState, useEffect } from 'react'; 
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, AlertCircle, LogOut, X, Droplet, Search, History, CheckCircle, Clock, Map as MapIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import LanguageSwitcher from '../components/LanguageSwitcher';
import axios from 'axios';

// --- PREMIUM MAP MARKERS ---
const hospitalIcon = new L.divIcon({ 
  className: 'custom-icon', 
  html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>` 
});
const driverIcon = new L.divIcon({ 
  className: 'custom-icon', 
  html: `<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(239, 68, 68, 0.9); animation: pulse 1.5s infinite;"></div>` 
});

// Mock coordinates for the hospital (Gulbarga Region)
const HOSPITAL_COORDS = [17.3297, 76.8343];

const HospitalDashboard = () => {
  const { user, logout, token } = useContext(AuthContext); 
  const { t } = useTranslation();
  const [socket, setSocket] = useState(null);
  
  const [activeTrip, setActiveTrip] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [authData, setAuthData] = useState({ bloodGroup: 'O+', componentType: 'Whole Blood', units: 1, reason: '', pin: '' });
  const [routineData, setRoutineData] = useState({ bloodGroup: 'A+', units: 5, requiredBy: 'Within 24 Hours' });
  const [requestHistory, setRequestHistory] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    if (user?.id) {
      newSocket.on(`trip-started-${user.id}`, (data) => setActiveTrip(data));
      newSocket.on(`location-update-${user.id}`, (coords) => setDriverLocation(coords));
      
      // NEW: Listen for Hero Donors!
      newSocket.on(`donor-pledged-${user.id}`, (data) => {
        alert(`🩸 INCOMING DONOR! ${data.donorName} has pledged to donate ${data.bloodGroup} and is en route!`);
        fetchHistory(); // Refresh history to show 'donor_pledged' status
      });

      newSocket.on(`trip-completed-${user.id}`, () => {
        setActiveTrip(null);
        setDriverLocation(null);
        alert("✅ Blood Delivery Verified & Secured!");
        fetchHistory();
      });
    }
    fetchHistory();
    return () => newSocket.close();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/requests/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequestHistory(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error("History fetch error", e); }
  };

  const triggerSOS = () => {
    if (authData.pin !== "1234") return alert("ACCESS DENIED: Invalid CMO PIN");
    if (!authData.reason) return alert("VALIDATION ERROR: Clinical Reason Required");
    if (socket) {
      socket.emit('trigger-emergency', {
        hospitalId: user?.id, 
        hospitalName: user?.name,
        hospitalCoords: HOSPITAL_COORDS, 
        bloodGroup: authData.bloodGroup, 
        unitsRequired: authData.units, 
        reason: authData.reason
      });
      setIsAuthModalOpen(false);
      setTimeout(fetchHistory, 1000); 
    }
  };

  const submitRoutineRequest = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/requests/routine', {
        hospitalName: user.name, bloodGroup: routineData.bloodGroup,
        units: routineData.units, requiredBy: routineData.requiredBy 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (socket && res.data) {
        socket.emit('trigger-routine', {
          tripId: res.data._id, hospitalId: user.id, hospitalName: user.name,
          bloodGroup: routineData.bloodGroup, units: routineData.units, requiredBy: routineData.requiredBy 
        });
      }
      alert("✅ Routine Request Submitted to Network!");
      fetchHistory(); 
    } catch (err) { alert("Error submitting request."); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      
      {/* PROFESSIONAL SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Droplet color="#ef4444" fill="#ef4444" size={32} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>VitalDrop</h2>
        </div>
        <nav style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#1e293b', borderRadius: '12px', marginBottom: '10px', fontWeight: 'bold' }}>
            <LayoutDashboard size={20} color="#3b82f6" /> <span>Hospital Command</span>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{ height: '80px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>Active Node: {user?.name || "Healthcare Facility"}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
          
          {/* EMERGENCY CARD (RED) */}
          <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '24px', border: '2px solid #fee2e2', boxShadow: '0 10px 25px -5px rgba(239,68,68,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 10px 0', fontSize: '22px' }}><AlertCircle size={28}/> Emergency SOS</h3>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5' }}>Initiate an immediate Code Red broadcast. Bypasses standard queues and targets banks within a 5km radius.</p>
            
            {activeTrip?.type === 'emergency' || (activeTrip?.type === undefined && activeTrip !== null) ? (
              <div style={{ textAlign: 'center', padding: '25px', backgroundColor: '#fff1f2', borderRadius: '16px', border: '2px dashed #ef4444' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#ef4444', letterSpacing: '1px' }}>SECURITY OTP (GIVE TO DRIVER)</span>
                <div style={{ fontSize: '54px', letterSpacing: '12px', fontWeight: '900', margin: '15px 0', color: '#0f172a' }}>{activeTrip.otp}</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Assigned Driver: <strong style={{color: '#0f172a'}}>{activeTrip.driverName}</strong></p>
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} style={{ width: '100%', padding: '20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)' }}>
                AUTHORIZE CODE RED
              </button>
            )}
          </div>

          {/* ROUTINE PROCUREMENT CARD (BLUE) */}
          <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 10px 0', fontSize: '22px' }}><Search size={28}/> Routine Order</h3>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5' }}>Submit standard procurement orders to the central supply network for scheduled deliveries.</p>
            
            {activeTrip?.type === 'routine' ? (
              <div style={{ textAlign: 'center', padding: '25px', backgroundColor: '#eff6ff', borderRadius: '16px', border: '2px dashed #3b82f6' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#3b82f6', letterSpacing: '1px' }}><Clock size={14} style={{display: 'inline', verticalAlign:'middle'}}/> STANDARD DELIVERY OTP</span>
                <div style={{ fontSize: '54px', letterSpacing: '12px', fontWeight: '900', margin: '15px 0', color: '#0f172a' }}>{activeTrip.otp}</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Assigned Driver: <strong style={{color: '#0f172a'}}>{activeTrip.driverName}</strong></p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <select value={routineData.bloodGroup} onChange={(e)=>setRoutineData({...routineData, bloodGroup: e.target.value})} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold' }}>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                  <input type="number" min="1" value={routineData.units} onChange={(e)=>setRoutineData({...routineData, units: e.target.value})} style={{ width: '90px', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', textAlign: 'center' }} />
                </div>
                
                <select value={routineData.requiredBy} onChange={(e)=>setRoutineData({...routineData, requiredBy: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px', fontSize: '15px', fontWeight: 'bold' }}>
                  <option value="Within 12 Hours">Deliver Within 12 Hours</option>
                  <option value="Within 24 Hours">Deliver Within 24 Hours</option>
                  <option value="Within 48 Hours">Deliver Within 48 Hours</option>
                  <option value="Next Week">Scheduled for Next Week</option>
                </select>
                
                <button onClick={submitRoutineRequest} style={{ width: '100%', padding: '20px', backgroundColor: '#f1f5f9', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  SUBMIT ROUTINE REQUEST
                </button>
              </>
            )}
          </div>

          {/* PREMIUM DARK MODE MAP WITH 5KM RADAR RING */}
          <div style={{ gridColumn: 'span 2', height: '400px', borderRadius: '24px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '10px 15px', borderRadius: '10px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <MapIcon size={18} color="#3b82f6"/> <span style={{fontSize: '13px', fontWeight: 'bold'}}>Live 5km Geofence Radar</span>
            </div>
            
            <MapContainer center={HOSPITAL_COORDS} zoom={13} style={{ height: '100%', width: '100%' }}>
              {/* DARK MODE TILE LAYER FOR PREMIUM LOOK */}
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              <Marker position={HOSPITAL_COORDS} icon={hospitalIcon}><Popup>Your Facility</Popup></Marker>
              
              {/* THE 5KM RADAR RING */}
              <Circle center={HOSPITAL_COORDS} radius={5000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} />
              
              {driverLocation && <Marker position={driverLocation} icon={driverIcon}><Popup>🚨 Ambulance Live Location</Popup></Marker>}
            </MapContainer>
          </div>

          {/* HISTORY LOG TABLE */}
          <div style={{ gridColumn: 'span 2', backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 25px 0', fontSize: '20px', color: '#0f172a' }}><History color="#64748b" /> Facility Request History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '15px' }}>Date</th>
                    <th style={{ padding: '15px' }}>Type</th>
                    <th style={{ padding: '15px' }}>Payload</th>
                    <th style={{ padding: '15px' }}>Timeframe</th>
                    <th style={{ padding: '15px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requestHistory.map(req => (
                    <tr key={req._id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '18px 15px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '18px 15px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', backgroundColor: req.type === 'emergency' ? '#fee2e2' : '#eff6ff', color: req.type === 'emergency' ? '#ef4444' : '#3b82f6' }}>
                          {req.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '18px 15px', fontWeight: '800', color: '#0f172a' }}>{req.bloodGroup} <span style={{ color: '#94a3b8', fontWeight: '600' }}>({req.units}u)</span></td>
                      <td style={{ padding: '18px 15px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{req.requiredBy || 'ASAP'}</td>
                      <td style={{ padding: '18px 15px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', backgroundColor: req.status === 'completed' ? '#dcfce7' : '#fef3c7', color: req.status === 'completed' ? '#15803d' : '#d97706' }}>
                          {req.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* EMERGENCY SECURITY MODAL */}
      {isAuthModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ backgroundColor: '#ef4444', padding: '25px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>CMO Authorization</h2>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', opacity: 0.9 }}>Code Red Initialization Protocol</p>
              </div>
              <X onClick={() => setIsAuthModalOpen(false)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.2)', padding: '5px', borderRadius: '50%' }} size={28} />
            </div>
            
            <div style={{ padding: '35px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '1px' }}>BLOOD GROUP</label>
                  <select value={authData.bloodGroup} onChange={(e)=>setAuthData({...authData, bloodGroup: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', marginTop: '5px' }}>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '1px' }}>UNITS REQUIRED</label>
                  <input type="number" min="1" value={authData.units} onChange={(e)=>setAuthData({...authData, units: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 'bold', marginTop: '5px' }} />
                </div>
              </div>
              
              <label style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '1px' }}>CLINICAL REASON</label>
              <textarea value={authData.reason} onChange={(e)=>setAuthData({...authData, reason: e.target.value})} placeholder="Describe critical need..." style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', margin: '5px 0 20px 0', height: '90px', resize: 'none', fontSize: '14px' }} />
              
              <label style={{ fontSize: '11px', fontWeight: '900', color: '#ef4444', letterSpacing: '1px' }}>SECURE PIN (1234)</label>
              <input type="password" maxLength="4" onChange={(e)=>setAuthData({...authData, pin: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #ef4444', textAlign: 'center', fontSize: '32px', letterSpacing: '20px', fontWeight: '900', marginTop: '5px', color: '#0f172a' }} />
              
              <button onClick={triggerSOS} style={{ width: '100%', padding: '20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', marginTop: '25px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)', transition: 'transform 0.1s' }}>
                AUTHORIZE & BROADCAST 🚨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;