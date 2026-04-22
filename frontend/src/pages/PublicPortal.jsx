import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Activity, ShieldCheck, MapPin, Truck, ArrowRight, Heart } from 'lucide-react';

const PublicPortal = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'Inter, sans-serif', color: 'white', overflowX: 'hidden' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Droplet color="#ef4444" fill="#ef4444" size={24} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>VitalDrop</h1>
        </div>
        <button 
          onClick={() => navigate('/login')} 
          style={{ padding: '10px 20px', backgroundColor: 'white', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s, boxShadow 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          Sign In / Register <ArrowRight size={16} />
        </button>
      </header>

      {/* HERO SECTION */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        
        {/* Glowing Background Effects */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '500px', background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(15,23,42,0) 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '100px 20px', maxWidth: '900px' }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', marginBottom: '30px' }}>
            VITALDROP LOGISTICS ENGINE v2.0
          </div>
          <h2 style={{ fontSize: '64px', fontWeight: '900', lineHeight: '1.1', margin: '0 0 25px 0', letterSpacing: '-2px' }}>
            The Decentralized Network for <span style={{ color: '#ef4444' }}>Life-Saving</span> Supply.
          </h2>
          <p style={{ fontSize: '20px', color: '#94a3b8', lineHeight: '1.6', margin: '0 auto 40px auto', maxWidth: '700px' }}>
            Connecting hospitals, blood banks, public donors, and verified dispatch drivers through an ultra-fast, 5km geofenced real-time tracking system.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button 
              onClick={() => navigate('/login')} 
              style={{ padding: '18px 35px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              INITIALIZE COMMAND CENTER
            </button>
            <button 
              onClick={() => navigate('/login')} 
              style={{ padding: '18px 35px', backgroundColor: 'transparent', color: 'white', border: '2px solid #334155', borderRadius: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#64748b'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}
            >
              JOIN AS DONOR
            </button>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', padding: '40px 20px 100px 20px', maxWidth: '1200px', width: '100%', position: 'relative', zIndex: 1 }}>
          
          <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', border: '1px solid #334155', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
              <MapPin size={30} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0' }}>5km Geofence Radar</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Zero latency routing. Emergency SOS broadcasts instantly target facilities and drivers within a precise 5-kilometer radius of the requesting hospital.
            </p>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', border: '1px solid #334155', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
              <ShieldCheck size={30} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0' }}>Mutex Cryptographic Lock</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Immutable state handling. When a facility or donor accepts a dispatch, the system instantly locks the request and vanishes it from the network.
            </p>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '24px', border: '1px solid #334155', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
              <Heart size={30} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 10px 0' }}>Hero Donor Module</h3>
            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Empowering the public. Verified donors can view real-time local shortages for their specific blood type and instantly pledge to fulfill hospital requests.
            </p>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '30px', textAlign: 'center', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '14px' }}>
        <p style={{ margin: 0 }}>© 2026 VitalDrop Logistics Engine. Secure Medical Supply Chain.</p>
      </footer>
    </div>
  );
};

export default PublicPortal;