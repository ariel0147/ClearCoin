import React, { useState, useEffect } from 'react';
import '../AddAsset/AddAsset.css'; // משתמשים באותו עיצוב סייברפאנק של חלון ההוספה!

const EditAsset = ({ isOpen, onClose, asset, onAssetUpdated, showNotification }) => {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    // ברגע שהחלון נפתח עם נכס מסוים, נטען את השווי הנוכחי שלו לתוך התיבה
    useEffect(() => {
        if (asset) {
            setValue(asset.value);
        }
    }, [asset]);

    if (!isOpen || !asset) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/assets/${asset.asset_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value: parseFloat(value) })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'שגיאה בעדכון הנכס');
            }

            if (showNotification) showNotification('שווי הנכס עודכן בהצלחה!', 'success');
            if (onAssetUpdated) onAssetUpdated();
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-asset-modal" onClick={e => e.stopPropagation()}>
                <h2>עדכון שווי: {asset.icon} {asset.name}</h2>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>שווי עדכני (₪)</label>
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>ביטול</button>
                        <button type="submit" className="btn-submit">עדכן שווי</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAsset;