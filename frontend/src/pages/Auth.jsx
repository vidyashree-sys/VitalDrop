import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, User, Phone, ShieldCheck, Building, Truck, ArrowRight, AlertCircle, Heart, Activity, FileText, Hash, Droplet } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    secure_email: '', 
    secure_pass: '', 
    name: '', 
    role: 'hospital', 
    contact: '',
    vehicleType: 'Ambulance', 
    vehiclePlate: '', 
    licenseNumber: '',
    medicalRegistrationNumber: ''
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    setError('');
    setSuccessMsg('');
  }, [isLogin]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        /**
         * PRODUCTION FIX: Use relative paths ('/api/...') 
         * instead of absolute URLs to ensure it works on Render.
         */
        const response = await axios.post('/api/auth/login', {
          email: formData.secure_email,
          password: formData.secure_pass
        });
        
        const { token, user } = response.data; 
        const finalUser = user || response.data;

        login(token, finalUser); 

        setTimeout(() => {
            const role = finalUser.role;
            if (role === 'admin') navigate('/admin-dashboard');
            else if (role === 'hospital') navigate('/hospital-dashboard');
            else if (role === 'blood_bank') navigate('/bank-dashboard');
            else if (role === 'driver') navigate('/driver-dashboard');
            else if (role === 'donor') navigate('/donor-dashboard'); 
            else navigate('/');
        }, 100);
        
      } else {
        const regData = {
          name: formData.name,
          email: formData.secure_email,
          password: formData.secure_pass,
          role: formData.role,
          contact: formData.contact,
        };

        if (formData.role === 'driver') {
          regData.driverDetails = {
            vehicleType: formData.vehicleType,
            vehiclePlate: formData.vehiclePlate,
            licenseNumber: formData.licenseNumber
          };
        } else if (formData.role === 'hospital' || formData.role === 'blood_bank') {
          regData.organizationDetails = {
            medicalRegistrationNumber: formData.medicalRegistrationNumber
          };
        }

        // PRODUCTION FIX: Relative path used here as well
        await axios.post('/api/auth/register', regData);
        setSuccessMsg('Registration successful! Please log in.');
        setIsLogin(true); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection failed. Ensure MongoDB Atlas access is open (0.0.0.0/0).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      
      {/* LEFT SIDE: BRANDING */}
      <div style={{ flex: 1, backgroundColor: '#020617', color: 'white', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '450px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            <Droplet size={48} color="#ef4444" fill="#ef4444" />
            <h1 style={{ fontSize: '38px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>VitalDrop</h1>
          </div>
          <h2 style={{ fontSize: '32px', color: 'white', marginBottom: '20px', fontWeight: '800' }}>The Network for <span style={{color: '#ef4444'}}>Life.</span></h2>
          <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.7', marginBottom: '40px' }}>
            A decentralized command center connecting the healthcare ecosystem in real-time.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ padding: '8px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.2)' }}>5km Radar</span>
            <span style={{ padding: '8px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Mutex Locking</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: FORM */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '480px', backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>{isLogin ? 'Welcome Back' : 'Join the Grid'}</h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>{isLogin ? 'Authenticate to access your node.' : 'Register your organization or vehicle.'}</p>
          </div>

          {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
          {successMsg && <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#10b981', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>{successMsg}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {!isLogin && (
              <>
                <select name="role" value={formData.role} onChange={handleInputChange} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                  <option value="hospital">Hospital</option>
                  <option value="blood_bank">Blood Bank</option>
                  <option value="driver">Driver</option>
                  <option value="donor">Donor</option>
                </select>

                <input type="text" name="name" placeholder="Full Name / Organization" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                <input type="tel" name="contact" placeholder="Contact Number" value={formData.contact} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />

                {formData.role === 'driver' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="vehiclePlate" placeholder="Plate No." onChange={handleInputChange} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                    <input type="text" name="licenseNumber" placeholder="DL No." onChange={handleInputChange} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                  </div>
                )}

                {(formData.role === 'hospital' || formData.role === 'blood_bank') && (
                  <input type="text" name="medicalRegistrationNumber" placeholder="Medical Reg. ID" onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                )}
              </>
            )}

            <input type="email" name="secure_email" placeholder="Email Address" value={formData.secure_email} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
            
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} name="secure_pass" placeholder="Password" value={formData.secure_pass} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
              {isLoading ? 'VERIFYING...' : (isLogin ? 'SECURE LOGIN' : 'CREATE ACCOUNT')}
            </button>
          </form>

          <button onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', marginTop: '20px', cursor: 'pointer', fontSize: '14px' }}>
            {isLogin ? "Need a node? Create one here." : "Already part of the grid? Login."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;