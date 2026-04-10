import React, { useState, useEffect } from 'react';
import AddAsset from '../AddAsset/AddAsset';
import EditAsset from './EditAsset'; // ייבוא מודל העריכה החדש
import './Assets.css';

const Assets = ({ showNotification }) => {
    const [assetsData, setAssetsData] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // סטייטים חדשים לעריכה
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

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

    // פונקציית מחיקה
    const handleDelete = async (assetId, assetName) => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הנכס "${assetName}"?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/assets/${assetId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                if (showNotification) showNotification('הנכס נמחק בהצלחה', 'success');
                fetchAssets(); // רענון הרשימה
            }
        } catch (err) {
            console.error('שגיאה במחיקת נכס:', err);
        }
    };

    // פתיחת מודל העריכה
    const openEditModal = (asset) => {
        setSelectedAsset(asset);
        setIsEditModalOpen(true);
    };

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
                        {/* כפתור מחיקה בפינת הכרטיס */}
                        <button
                            className="delete-asset-btn"
                            onClick={() => handleDelete(asset.asset_id, asset.name)}
                            title="מחק נכס"
                        >
                            <i className="fa-solid fa-trash"></i> 🗑️
                        </button>

                        <div className="asset-icon">{asset.icon}</div>
                        <div className="asset-details">
                            <h3>{asset.name}</h3>
                            <p className="asset-value">₪{parseFloat(asset.value).toLocaleString('he-IL')}</p>
                        </div>
                        {/* כפתור עדכון שפותח את המודל */}
                        <button className="edit-asset-btn" onClick={() => openEditModal(asset)}>
                            עדכן שווי
                        </button>
                    </div>
                ))}

                <div className="asset-card add-new-asset" onClick={() => setIsAddModalOpen(true)}>
                    <div className="add-icon">+</div>
                    <h3>הוסף נכס חדש</h3>
                </div>
            </div>

            <AddAsset
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAssetAdded={fetchAssets}
                showNotification={showNotification}
            />

            {/* שילוב מודל העריכה שיצרנו */}
            <EditAsset
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                asset={selectedAsset}
                onAssetUpdated={fetchAssets}
                showNotification={showNotification}
            />
        </div>
    );
};

export default Assets;