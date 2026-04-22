import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, LogOut, Activity, Users, Database, LayoutDashboard, Map as MapIcon, CheckCircle, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { io } from 'socket.io-client'; // NEEDED FOR LIVE RADAR

// --- CUSTOM COLORED MAP MARKERS FOR ADMIN RADAR ---
const hospitalIcon = new L.divIcon({ className: 'custom-icon', html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>` });
const bankIcon = new L.divIcon({ className: 'custom-icon', html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>` });
const driverIcon = new L.divIcon({ className: 'custom-icon', html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239,68,68,0.8); animation: pulse 1.5s infinite;"></div>` });

// Mock static locations for the map until you have real DB data
const MOCK_HOSPITALS = [{ id: 'h1', name: 'City Hospital', coords: [17.3297, 76.8343] }, { id: 'h2', name: 'District General', coords: [17.34, 76.85] }];
const MOCK_BANKS = [{ id: 'b1', name: 'Red Cross Bank', coords: [17.31, 76.82] }];

const AdminDashboard = () => {
  const { user, logout, token } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, KYC, MAP
  const [allRequests, setAllRequests] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState({}); // Stores live driver locations { driverId: coords }

  useEffect(() => {
    // 1. Fetch History Logs
    const fetchHistory = async () => {
      try {
        // PRODUCTION FIX: Use relative path to connect to Render Backend
        const res = await axios.get('/api/requests/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllRequests(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error("Admin fetch error", err); }
    };

    // 2. Fetch KYC Pending Users (MOCK DATA FOR NOW - Replace with real API later)
    const fetchPendingKYC = async () => {
      setPendingUsers([
        { id: 'u1', name: 'City Central Hospital', role: 'hospital', regNum: 'HMIS-9921', date: new Date().toISOString() },
        { id: 'u2', name: 'Red Cross District', role: 'blood_bank', regNum: 'BB-442', date: new Date().toISOString() },
        { id: 'u3', name: 'John Doe Logistics', role: 'driver', plate: 'KA-32-M-1122', date: new Date().toISOString() }
      ]);
    };

    fetchHistory();
    fetchPendingKYC();
  }, [token]);

  // 3. LIVE RADAR SOCKET CONNECTION
  useEffect(() => {
    // PRODUCTION FIX: Use dynamic host for websocket
    const newSocket = io({ transports: ['websocket'] });
    
    // Listen for any driver moving anywhere in the network
    newSocket.on('driver-location-update', (data) => {
      setActiveDrivers(prev => ({
        ...prev,
        [data.tripId]: data.coords // Store by tripId so multiple drivers don't overwrite each other
      }));
    });

    // When a trip finishes, remove that driver from the radar
    newSocket.on('trip-completed', (tripId) => {
      setActiveDrivers(prev => {
        const updated = { ...prev };
        delete updated[tripId];
        return updated;
      });
    });

    return () => newSocket.close();
  }, []);

  const handleKYCAction = (userId, action) => {
    alert(`User ${userId} has been ${action === 'approve' ? 'APPROVED' : 'REJECTED'}.`);
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
  };

  const emergencyCount = allRequests.filter(r => r.type === 'emergency').length;
  const routineCount = allRequests.filter(r => r.type === 'routine').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      
      {/* PREMIUM DARK SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#020617', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <ShieldCheck color="#10b981" size={32} />
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>VitalDrop Admin</h1>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab('DASHBOARD')} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: activeTab === 'DASHBOARD' ? '#1e293b' : 'transparent', color: activeTab === 'DASHBOARD' ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', transition: 'all 0.2s' }}>
            <LayoutDashboard size={20} color={activeTab === 'DASHBOARD' ? '#10b981' : '#64748b'} /> System Metrics
          </button>
          
          <button onClick={() => setActiveTab('KYC')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: activeTab === 'KYC' ? '#1e293b' : 'transparent', color: activeTab === 'KYC' ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><Users size={20} color={activeTab === 'KYC' ? '#3b82f6' : '#64748b'} /> KYC Approvals</div>
            {pendingUsers.length > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{pendingUsers.length}</span>}
          </button>
          
          <button onClick={() => setActiveTab('MAP')} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: activeTab === 'MAP' ? '#1e293b' : 'transparent', color: activeTab === 'MAP' ? 'white' : '#94a3b8', border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', transition: 'all 0.2s' }}>
            <MapIcon size={20} color={activeTab === 'MAP' ? '#ef4444' : '#64748b'} /> Live Radar
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', backgroundColor: '#0f172a' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: 0, color: 'white' }}>
              {activeTab === 'DASHBOARD' && "Network Intelligence"}
              {activeTab === 'KYC' && "Compliance & Onboarding"}
              {activeTab === 'MAP' && "Live Logistics Radar"}
            </h2>
            <p style={{ color: '#94a3b8', margin: '5px 0 0 0', fontWeight: '600' }}>God-Mode access active.</p>
          </div>
          <button onClick={logout} style={{ padding: '12px 20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <LogOut size={18} /> Exit Console
          </button>
        </header>

        {/* --- TAB 1: SYSTEM METRICS & LOGS --- */}
        {activeTab === 'DASHBOARD' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '20px', border: '1px solid #334155', borderLeft: '5px solid #ef4444' }}>
                <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>EMERGENCY CODE REDS</p>
                <h3 style={{ margin: 0, fontSize: '36px', color: 'white', fontWeight: '900' }}>{emergencyCount}</h3>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '20px', border: '1px solid #334155', borderLeft: '5px solid #3b82f6' }}>
                <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>ROUTINE DISPATCHES</p>
                <h3 style={{ margin: 0, fontSize: '36px', color: 'white', fontWeight: '900' }}>{routineCount}</h3>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '20px', border: '1px solid #334155', borderLeft: '5px solid #10b981' }}>
                <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}>TOTAL TRANSACTIONS</p>
                <h3 style={{ margin: 0, fontSize: '36px', color: 'white', fontWeight: '900' }}>{allRequests.length}</h3>
              </div>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '24px', border: '1px solid #334155' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><Database color="#3b82f6"/> Immutable System Log</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '12px', letterSpacing: '1px' }}>
                    <th style={{ padding: '15px' }}>TIMESTAMP</th>
                    <th style={{ padding: '15px' }}>HOSPITAL NODE</th>
                    <th style={{ padding: '15px' }}>PAYLOAD</th>
                    <th style={{ padding: '15px' }}>CARRIER / BANK</th>
                    <th style={{ padding: '15px' }}>STATE</th>
                  </tr>
                </thead>
                <tbody>
                  {allRequests.map(req => (
                    <tr key={req._id} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#cbd5e1' }}>{new Date(req.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: 'white' }}>
                        {req.hospitalName}
                        {req.type === 'emergency' && <span style={{ marginLeft: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>SOS</span>}
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#cbd5e1' }}>{req.bloodGroup} <span style={{ color: '#64748b' }}>({req.units}u)</span></td>
                      <td style={{ padding: '15px', fontSize: '13px', color: '#94a3b8' }}>{req.driverName || req.bankName || 'Awaiting Node'}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', backgroundColor: req.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: req.status === 'completed' ? '#6ee7b7' : '#fcd34d', border: `1px solid ${req.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}` }}>
                          {req.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- TAB 2: KYC APPROVALS --- */}
        {activeTab === 'KYC' && (
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '24px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><Users color="#3b82f6"/> Pending Verification Queue</h3>
            
            {pendingUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <CheckCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p>All nodes are verified. No pending KYC applications.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pendingUsers.map(user => (
                  <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #334155', borderRadius: '16px', backgroundColor: '#0f172a' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <strong style={{ fontSize: '18px', color: 'white' }}>{user.name}</strong>
                        <span style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: user.role === 'hospital' ? 'rgba(59, 130, 246, 0.2)' : user.role === 'blood_bank' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: user.role === 'hospital' ? '#93c5fd' : user.role === 'blood_bank' ? '#6ee7b7' : '#fca5a5' }}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                        {user.regNum ? `Govt Reg: ${user.regNum}` : `License Plate: ${user.plate}`} • Applied: {new Date(user.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleKYCAction(user.id, 'reject')} style={{ padding: '10px 15px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><XCircle size={16}/> Reject</button>
                      <button onClick={() => handleKYCAction(user.id, 'approve')} style={{ padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><CheckCircle size={16}/> Verify & Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: LIVE RADAR MAP --- */}
        {activeTab === 'MAP' && (
          <div style={{ height: '75vh', borderRadius: '24px', overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', color: 'white', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(5px)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#94a3b8', letterSpacing: '1px' }}>RADAR LEGEND</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6', border: '2px solid white' }}></div> Hospitals</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid white' }}></div> Blood Banks</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid white', boxShadow: '0 0 5px red' }}></div> Active Dispatches</div>
              </div>
            </div>

            <MapContainer center={[17.3297, 76.8343]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              {MOCK_HOSPITALS.map(h => (
                <React.Fragment key={h.id}>
                  <Marker position={h.coords} icon={hospitalIcon}><Popup>{h.name}</Popup></Marker>
                  <Circle center={h.coords} radius={5000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1, dashArray: '5, 5' }} />
                </React.Fragment>
              ))}
              
              {MOCK_BANKS.map(b => (
                <Marker key={b.id} position={b.coords} icon={bankIcon}><Popup>{b.name}</Popup></Marker>
              ))}
              
              {/* Dynamic Drivers via WebSocket */}
              {Object.values(activeDrivers).map((coords, idx) => (
                <Marker key={idx} position={coords} icon={driverIcon}><Popup>🚨 Active Dispatch Unit</Popup></Marker>
              ))}
            </MapContainer>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;