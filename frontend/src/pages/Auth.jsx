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

        await axios.post('/api/auth/register', regData);
        setSuccessMsg('Registration successful! (Hackathon Sandbox: KYC Auto-Verified). You may now log in.');
        setIsLogin(true); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection failed. Ensure MongoDB Atlas access is open (0.0.0.0/0).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 📱 MOBILE RESPONSIVE CSS INJECTION */}
      <style>
        {`
          .auth-wrapper { display: flex; min-height: 100vh; background-color: #0f172a; font-family: Inter, sans-serif; }
          .auth-brand { flex: 1; background-color: #020617; color: white; padding: 60px; display: flex; flex-direction: column; justify-content: center; border-right: 1px solid #1e293b; }
          .auth-form-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; overflow-y: auto; }
          .auth-form-box { width: 100%; max-width: 480px; background-color: white; padding: 40px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
          .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
          
          /* WHEN SCREEN IS SMALLER THAN 768px (Phones/Tablets) */
          @media (max-width: 768px) {
            .auth-wrapper { flex-direction: column; }
            .auth-brand { padding: 30px 20px; text-align: center; align-items: center; border-right: none; border-bottom: 1px solid #1e293b; flex: none; }
            .auth-brand h1 { font-size: 28px !important; }
            .auth-brand h2 { font-size: 22px !important; }
            .auth-brand p { font-size: 14px !important; margin-bottom: 20px !important; }
            .auth-form-container { padding: 20px; align-items: flex-start; }
            .auth-form-box { padding: 25px; }
            .demo-grid { grid-template-columns: 1fr; }
          }
        `}
      </style>

      <div className="auth-wrapper">
        
        {/* LEFT SIDE: BRANDING */}
        <div className="auth-brand">
          <div style={{ maxWidth: '450px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', justifyContent: 'center' }}>
              <Droplet size={48} color="#ef4444" fill="#ef4444" />
              <h1 style={{ fontSize: '38px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>VitalDrop</h1>
            </div>
            <h2 style={{ fontSize: '32px', color: 'white', marginBottom: '20px', fontWeight: '800' }}>The Network for <span style={{color: '#ef4444'}}>Life.</span></h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.7', marginBottom: '40px' }}>
              A decentralized command center connecting the healthcare ecosystem in real-time.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              <span style={{ padding: '8px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.2)' }}>5km Radar</span>
              <span style={{ padding: '8px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Mutex Locking</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="auth-form-container">
          <div className="auth-form-box">
            
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

                  <input type="text" name="name" placeholder="Full Name / Organization" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  <input type="tel" name="contact" placeholder="Contact Number" value={formData.contact} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />

                  {formData.role === 'driver' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" name="vehiclePlate" placeholder="Plate No." onChange={handleInputChange} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', minWidth: 0 }} />
                      <input type="text" name="licenseNumber" placeholder="DL No." onChange={handleInputChange} required style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', minWidth: 0 }} />
                    </div>
                  )}

                  {(formData.role === 'hospital' || formData.role === 'blood_bank') && (
                    <input type="text" name="medicalRegistrationNumber" placeholder="Medical Reg. ID" onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  )}
                </>
              )}

              <input type="email" name="secure_email" placeholder="Email Address" value={formData.secure_email} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} name="secure_pass" placeholder="Password" value={formData.secure_pass} onChange={handleInputChange} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
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

            {/* HACKATHON FIX: DEMO CREDENTIALS BOX */}
            {isLogin && (
              <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', fontSize: '13px', color: '#475569' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0f172a', fontSize: '14px', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="#10b981"/> Hackathon Sandbox Demo
                </strong>
                <div className="demo-grid">
                  <span style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}><strong>Hosp:</strong> hosp@demo.com</span>
                  <span style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}><strong>Bank:</strong> bank@demo.com</span>
                  <span style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}><strong>Driver:</strong> driver@demo.com</span>
                  <span style={{ backgroundColor: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}><strong>Admin:</strong> admin@demo.com</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold', color: '#ef4444' }}>
                  Universal Password: <span style={{ letterSpacing: '2px' }}>123456</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;