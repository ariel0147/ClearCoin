import React, { useState } from 'react';
import './AddAsset.css';

const AddAsset = ({ isOpen, onClose, onAssetAdded, showNotification }) => {
    const [formData, setFormData] = useState({
        name: '',
        value: '',
        type: 'liquid',
        icon: '💰'
    });
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleIconSelect = (icon) => {
        setFormData({ ...formData, icon });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                value: parseFloat(formData.value)
            };

            const response = await fetch('http://localhost:5000/api/assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'שגיאה בהוספת הנכס');
            }

            if (showNotification) {
                showNotification('נכס / חיסכון נוסף בהצלחה!', 'success');
            }

            if (onAssetAdded) {
                onAssetAdded();
            }

            setFormData({ name: '', value: '', type: 'liquid', icon: '💰' });
            onClose();
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    const availableIcons = ['💰', '🚗', '🏠', '📈', '🪙', '💻', '⌚', '💎', '🚀'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-asset-modal" onClick={e => e.stopPropagation()}>
                <h2>הוספת נכס חדש</h2>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>שם הנכס או החיסכון</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="לדוגמה: חיסכון לחופשה, רכב..."
                        />
                    </div>

                    <div className="form-group">
                        <label>שווי הנכס (₪)</label>
                        <input
                            type="number"
                            name="value"
                            value={formData.value}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label>סוג הנכס</label>
                        <select name="type" value={formData.type} onChange={handleChange}>
                            <option value="liquid">נזיל (מזומן, עו"ש, פק"מ)</option>
                            <option value="property">רכוש (נדל"ן, רכב, חפצים)</option>
                            <option value="investment">השקעות (מניות, קריפטו, פנסיה)</option>
                        </select>
                    </div>

                    <div className="form-group icon-selection">
                        <label>בחר אימוג'י לתצוגה</label>
                        <div className="icon-grid">
                            {availableIcons.map(icon => (
                                <button
                                    type="button"
                                    key={icon}
                                    className={`icon-btn ${formData.icon === icon ? 'selected' : ''}`}
                                    onClick={() => handleIconSelect(icon)}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>ביטול</button>
                        <button type="submit" className="btn-submit">שמירת נכס</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAsset;