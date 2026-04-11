import React, { useState } from 'react';
import '../Transactions/Transactions.css'; // משתמשים בעיצוב שכבר כתבנו

const ImportModal = ({ isOpen, onClose, onSuccess, showNotification }) => {
    const [importFile, setImportFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    if (!isOpen) return null; // אם החלון לא פתוח, אל תרנדר כלום

    const handleFileDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
        if (file) setImportFile(file);
    };

    const handleImportSubmit = async () => {
        if (!importFile) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/transactions/import', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                if (showNotification) showNotification(`יובאו וקוטלגו ${data.count} תנועות!`, 'success');
                setImportFile(null);
                onSuccess(); // קורא לפונקציה שמרעננת את הנתונים וסוגרת את החלון
            } else {
                if (showNotification) showNotification(data.message || 'שגיאה בפענוח הקובץ', 'error');
            }
        } catch (err) {
            if (showNotification) showNotification('שגיאת תקשורת עם השרת', 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setImportFile(null);
        onClose();
    };

    return (
        <div className="import-modal-overlay">
            <div className="glass-panel import-modal-content">
                <h3>ייבוא תנועות חכם מקובץ בנק</h3>
                <p>העלה קובץ PDF, CSV או Excel. ה-AI שלנו ינקה, יסדר ויקטלג את התנועות אוטומטית.</p>

                <div
                    className={`file-drop-area ${importFile ? 'has-file' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                >
                    {importFile ? (
                        <div className="file-ready">
                            <span>📄 {importFile.name}</span>
                            <button className="remove-file-btn" onClick={() => setImportFile(null)}>✖</button>
                        </div>
                    ) : (
                        <div className="file-placeholder">
                            <span className="upload-icon">📁</span>
                            <p>גרור את הקובץ לכאן או לחץ לבחירה</p>
                            <input type="file" accept=".csv, .txt, .pdf" onChange={handleFileDrop} />
                        </div>
                    )}
                </div>

                {isImporting && (
                    <div className="ai-processing-loader">
                        <div className="spinner"></div>
                        <span>ה-AI מנתח את המסמך... נא להמתין.</span>
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={handleClose} disabled={isImporting}>ביטול</button>
                    <button className="btn-submit ai-submit-btn" onClick={handleImportSubmit} disabled={!importFile || isImporting}>
                        {isImporting ? 'מעבד...' : 'התחל סריקה חכמה'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;