import React, { useState, useEffect } from 'react';
import AddAsset from '../AddAsset/AddAsset'; // <-- ייבוא המודל
import './Assets.css';

// הוספנו את ה-showNotification כדי שנוכל להקפיץ הודעות הצלחה
const Assets = ({ showNotification }) => {
    const [assetsData, setAssetsData] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // סטייט לפתיחת החלון

    const fetchAssets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/assets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAssetsData(data);
            }
        } catch (err) {
            console.error('שגיאה במשיכת נכסים:', err);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const totalAssets = assetsData.reduce((sum, item) => sum + parseFloat(item.value), 0);

    return (
        <div className="assets-container">
            <div className="assets-header">
                <h2 className="section-title">נכסים וחסכונות</h2>
                <div className="total-assets-badge">
                    <span>סה"כ שווי נכסים:</span>
                    <strong>₪{totalAssets.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</strong>
                </div>
            </div>

            <div className="assets-grid">
                {assetsData.map(asset => (
                    <div key={asset.asset_id} className="asset-card">
                        <div className="asset-icon">{asset.icon}</div>
                        <div className="asset-details">
                            <h3>{asset.name}</h3>
                            <p className="asset-value">₪{parseFloat(asset.value).toLocaleString('he-IL')}</p>
                        </div>
                        <button className="edit-asset-btn">עדכן שווי</button>
                    </div>
                ))}

                {/* כרטיס הוספת נכס חדש - עכשיו הוא פותח את המודל! */}
                <div className="asset-card add-new-asset" onClick={() => setIsAddModalOpen(true)}>
                    <div className="add-icon">+</div>
                    <h3>הוסף נכס חדש</h3>
                </div>
            </div>

            {/* החלון הקופץ שייצרנו עכשיו */}
            <AddAsset
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAssetAdded={fetchAssets}
                showNotification={showNotification}
            />
        </div>
    );
};

export default Assets;