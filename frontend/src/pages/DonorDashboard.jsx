import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Heart, Activity, LogOut, Droplet, Map as MapIcon, Calendar, CheckCircle, ShieldCheck, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { io } from 'socket.io-client';

// --- PREMIUM MAP MARKERS ---
const donorIcon = new L.divIcon({ 
  className: 'custom-icon', 
  html: `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(16, 185, 129, 0.9); animation: pulse 1.5s infinite;"></div>` 
});
const facilityIcon = new L.divIcon({ 
  className: 'custom-icon', 
  html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);"></div>` 
});

// Mock coordinates for Donor
const DONOR_COORDS = [17.3250, 76.8300]; 

const DonorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  
  // Donor's specific profile (In a real app, this comes from the DB)
  const donorProfile = { bloodGroup: 'O+', lastDonation: '2025-10-12', status: 'Eligible' };
  
  const [activeShortages, setActiveShortages] = useState([]);
  const [pledgedDonation, setPledgedDonation] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for network-wide emergencies so donors can step up
    newSocket.on('bank-emergency-alert', (data) => {
      // Only show if it matches donor's blood group (or if O- universal)
      if (data.bloodGroup === donorProfile.bloodGroup || donorProfile.bloodGroup === 'O-') {
        setActiveShortages(prev => [...prev, { ...data, type: 'emergency' }]);
      }
    });

    // Listen for routine shortages
    newSocket.on('bank-routine-alert', (data) => {
      if (data.bloodGroup === donorProfile.bloodGroup || donorProfile.bloodGroup === 'O-') {
        setActiveShortages(prev => [...prev, { ...data, type: 'routine' }]);
      }
    });

    return () => newSocket.close();
  }, []);

  // Inside DonorDashboard.jsx
  const pledgeDonation = (shortage) => {
    if (socket) {
      socket.emit('donor-pledge-shortage', {
        tripId: shortage.tripId,
        donorId: user.id,
        donorName: user.name,
        type: shortage.type
      });
    }

    // Set local state assuming success (backend will handle the global lock)
    setPledgedDonation(shortage);
    setActiveShortages(prev => prev.filter(s => s.tripId !== shortage.tripId));
    alert(`✅ You have pledged to donate ${shortage.bloodGroup} at ${shortage.hospitalName}! Please arrive within 2 hours.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* PROFESSIONAL SIDEBAR */}
      <aside style={{ width: '280px', backgroundColor: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Heart color="#ef4444" fill="#ef4444" size={32} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>VitalDrop</h1>
        </div>
        <nav style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#1e293b', borderRadius: '12px', marginBottom: '10px', fontWeight: 'bold' }}>
            <Droplet size={20} color="#ef4444" /> <span>Donor Portal</span>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* HEADER */}
        <header style={{ height: '80px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>Welcome, Hero: {user?.name || "Donor"}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <LanguageSwitcher />
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '2px solid #e2e8f0', paddingLeft: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '900', letterSpacing: '1px' }}>● ELIGIBLE TO DONATE</div>
              </div>
              <button onClick={logout} style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* DONOR PROFILE CARD */}
            <div style={{ backgroundColor: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '30px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#fff1f2', border: '4px solid #ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: '900', color: '#ef4444' }}>
                {donorProfile.bloodGroup}
              </div>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#0f172a' }}>Your Blood Profile</h3>
                <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px' }}>You are a universal lifesaver. Your blood is in high demand.</p>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold', color: '#10b981', backgroundColor: '#dcfce7', padding: '5px 10px', borderRadius: '8px' }}><CheckCircle size={14}/> {donorProfile.status}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', backgroundColor: '#f1f5f9', padding: '5px 10px', borderRadius: '8px' }}><Calendar size={14}/> Last: {donorProfile.lastDonation}</span>
                </div>
              </div>
            </div>

            {/* LIVE SHORTAGES FEED */}
            <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '24px', border: '2px solid #fee2e2', boxShadow: '0 10px 25px -5px rgba(239,68,68,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '22px' }}><Activity size={28}/> Urgent Local Shortages</h3>
                <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '900' }}>MATCHES YOUR TYPE</span>
              </div>

              {activeShortages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                  <ShieldCheck size={40} color="#94a3b8" style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold' }}>No urgent shortages for {donorProfile.bloodGroup} nearby.</p>
                </div>
              ) : activeShortages.map((req, idx) => (
                <div key={idx} style={{ backgroundColor: '#fff1f2', padding: '20px', borderRadius: '16px', border: '1px solid #fecdd3', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '18px', color: '#7f1d1d' }}>{req.hospitalName}</strong>
                    <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>{req.unitsRequired} UNITS NEEDED</span>
                  </div>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#ef4444', fontWeight: 'bold' }}>Facility needs {req.bloodGroup} immediately.</p>
                  <button onClick={() => pledgeDonation(req)} style={{ width: '100%', padding: '15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)' }}>
                    PLEDGE DONATION
                  </button>
                </div>
              ))}
            </div>

          </div>

          {/* PREMIUM DARK MODE MAP WITH 5KM RADAR RING */}
          <div style={{ height: '75vh', borderRadius: '24px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.95)', color: 'white', padding: '15px 20px', borderRadius: '12px', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
               <span style={{fontSize: '12px', color: '#94a3b8', fontWeight: '900', letterSpacing: '1px'}}>DONATION STATUS</span>
               <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold'}}>
                  <Navigation size={18} color={pledgedDonation ? '#10b981' : '#ef4444'}/> 
                  {pledgedDonation ? `En route to ${pledgedDonation.hospitalName}` : 'Monitoring 5km Radius'}
               </div>
            </div>

            <MapContainer center={DONOR_COORDS} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              
              <Marker position={DONOR_COORDS} icon={donorIcon}><Popup>Your Location</Popup></Marker>
              <Circle center={DONOR_COORDS} radius={5000} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.05, weight: 1, dashArray: '5, 5' }} />
              
              {/* Show pledged destination on map if they accepted */}
              {pledgedDonation && (
                <Marker position={[17.3297, 76.8343]} icon={facilityIcon}>
                  <Popup>Drop-off: {pledgedDonation.hospitalName}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;