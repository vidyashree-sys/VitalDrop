import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import '../pages/Modal.css';

const AddBloodModal = ({ isOpen, onClose, onAddSuccess }) => {
  const { token } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    bloodGroup: 'A+',
    componentType: 'Whole Blood',
    units: 1,
    expiryDays: 35
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Send the data to your backend API
      const response = await axios.post(
        'http://localhost:5000/api/inventory/add', 
        formData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Pass the newly created data back to the dashboard to update the UI instantly
      onAddSuccess(response.data.data); 
      onClose(); // Close the modal
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        
        <div className="modal-header">
          <h3>Add Blood Unit</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="alert error-alert" style={{ marginBottom: '15px' }}>
            <AlertCircle size={18}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Blood Group</label>
              <select name="bloodGroup" className="form-input" value={formData.bloodGroup} onChange={handleChange}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Component</label>
              <select name="componentType" className="form-input" value={formData.componentType} onChange={handleChange}>
                <option value="Whole Blood">Whole Blood</option>
                <option value="Red Cells">Red Cells</option>
                <option value="Platelets">Platelets</option>
                <option value="Plasma">Plasma</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number of Units</label>
              <input 
                type="number" 
                name="units" 
                className="input-with-icon" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                min="1" 
                value={formData.units} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Valid For (Days)</label>
              <input 
                type="number" 
                name="expiryDays" 
                className="input-with-icon" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                min="1" 
                value={formData.expiryDays} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading} style={{ marginTop: '20px' }}>
            {isLoading ? 'Adding...' : 'Save to Inventory'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AddBloodModal;