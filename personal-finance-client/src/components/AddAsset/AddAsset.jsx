import React, { useState } from 'react';
import './AddAsset.css';

const AddAsset = ({ isOpen, onClose, onAssetAdded, showNotification }) => {
    // רשימת אייקונים לבחירה
    const availableIcons = ['💰', '📈', '🚗', '🏠', '💎', '🎓', '🏦'];

    const [formData, setFormData] = useState({
        name: '',
        value: '',
        type: 'savings',
        icon: '💰' // אייקון ברירת מחדל
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleIconSelect = (icon) => {
        setFormData({ ...formData, icon });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onAssetAdded();
                showNotification('הנכס נשמר בהצלחה!', 'success');
                onClose();
                setFormData({ name: '', value: '', type: 'savings', icon: '💰' }); // איפוס
            } else {
                showNotification('שגיאה בשמירת הנכס', 'error');
            }
        } catch (err) {
            showNotification('שגיאת תקשורת עם השרת', 'error');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} dir="rtl">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>הוספת נכס חדש</h2>

                <form onSubmit={handleSubmit} className="transaction-form">

                    <div className="input-group">
                        <label>שם הנכס / חיסכון</label>
                        <div className="input-wrapper">
                            <input type="text" name="name" required placeholder="לדוגמה: יונדאי ולוסטר, קופת גמל..." onChange={handleChange} value={formData.name} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>שווי נוכחי (₪)</label>
                        <div className="input-wrapper">
                            <input type="number" name="value" required min="0" placeholder="0" onChange={handleChange} value={formData.value} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>בחר אייקון</label>
                        <div className="icon-selector">
                            {availableIcons.map(icon => (
                                <div
                                    key={icon}
                                    className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                                    onClick={() => handleIconSelect(icon)}
                                >
                                    {icon}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="submit-btn">שמור נכס</button>
                </form>
            </div>
        </div>
    );
};

export default AddAsset;