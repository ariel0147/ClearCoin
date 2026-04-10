import React, { useState } from 'react';
import './AddAsset.css';

const AddAsset = ({ onClose, onAssetAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        value: '',
        type: 'liquid', // ערך ברירת מחדל
        icon: '💰'      // אימוג'י ברירת מחדל
    });
    const [error, setError] = useState('');

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
            const response = await fetch('http://localhost:5000/api/assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to add asset');
            }

            // עדכון רשימת הנכסים בקומפוננטת האב
            if (onAssetAdded) {
                onAssetAdded();
            }
            onClose(); // סגירת המודאל
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    // רשימה קצרה של אימוג'ים לבחירה (אפשר להרחיב)
    const availableIcons = ['💰', '🚗', '🏠', '📈', '🪙', '💻'];

    return (
        <div className="modal-overlay">
            <div className="add-asset-modal">
                <h2>Add New Asset / Saving</h2>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Asset Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Hyundai Veloster"
                        />
                    </div>

                    <div className="form-group">
                        <label>Value</label>
                        {/* הוספנו step="0.01" כדי לאפשר מספרים עשרוניים */}
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
                        <label>Type</label>
                        <select name="type" value={formData.type} onChange={handleChange}>
                            <option value="liquid">Liquid (Cash, Bank)</option>
                            <option value="property">Property (Real Estate, Vehicle)</option>
                            <option value="investment">Investment (Stocks, Crypto)</option>
                        </select>
                    </div>

                    <div className="form-group icon-selection">
                        <label>Select Icon</label>
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
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit">Save Asset</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAsset;