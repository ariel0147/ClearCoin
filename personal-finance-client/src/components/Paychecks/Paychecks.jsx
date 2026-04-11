import React, { useState, useRef } from 'react';
import './Paychecks.css';


const Paychecks = ({ showNotification, onTransactionAdded }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

    const handleFileInput = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) processFile(selectedFile);
    };

    const processFile = async (selectedFile) => {
        // --- חסימת PDF בצד לקוח ---
        if (selectedFile.type === 'application/pdf') {
            if (showNotification) showNotification('נא להעלות תמונה (JPG/PNG) ולא קובץ PDF', 'error');
            return;
        }

        setFile(selectedFile);
        setIsScanning(true);
        setScanResult(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/scan-paycheck', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            // אם השרת החזיר לנו שגיאה (כמו קובץ לא נתמך)
            if (!response.ok) {
                throw new Error(data.message || 'שגיאה מול השרת בסריקה');
            }

            setScanResult(data);

            if (showNotification) showNotification('התלוש נסרק בהצלחה! נא לאשר נתונים.', 'success');
        } catch (err) {
            console.error(err);
            if (showNotification) showNotification(err.message, 'error');
        } finally {
            setIsScanning(false);
        }
    };

    const handleInputChange = (e) => {
        setScanResult({
            ...scanResult,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveToTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                amount: parseFloat(scanResult.netSalary),
                date: scanResult.date,
                description: `משכורת - ${scanResult.company}`,
                type: 'income'
            };

            const response = await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('שגיאה בשמירת התנועה');

            if (showNotification) showNotification('המשכורת נוספה לתנועות העו"ש!', 'success');

            if (onTransactionAdded) onTransactionAdded();

            setFile(null);
            setScanResult(null);
        } catch (err) {
            console.error(err);
            if (showNotification) showNotification('שגיאה בשמירת הנתונים למערכת', 'error');
        }
    };

    return (
        <div className="paychecks-container">
            <div className="paychecks-header">
                <h2 className="section-title">סריקת תלושי שכר <span className="neon-text">A.I</span></h2>
                <p>העלה תמונה (JPG/PNG) של תלוש השכר שלך והמערכת תחלץ את הנתונים אוטומטית.</p>
            </div>

            {!isScanning && !scanResult && (
                <div
                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                >
                    {/* חסמנו בחירת PDF, עכשיו מקבל רק תמונות */}
                    <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" hidden />
                    <div className="drop-icon">🖼️</div>
                    <h3>גרור ושחרר צילום של התלוש כאן</h3>
                    <p>או לחץ כדי לבחור קובץ מהמחשב (תמונות בלבד)</p>
                </div>
            )}

            {isScanning && (
                <div className="scanning-container">
                    <div className="scanner-box">
                        <div className="scanner-laser"></div>
                        <p className="scanning-text">מפענח נתונים... נא להמתין</p>
                    </div>
                </div>
            )}

            {scanResult && !isScanning && (
                <div className="scan-results glass-panel">
                    <h3>נתונים שחולצו:</h3>
                    <div className="result-grid">
                        <div className="result-item">
                            <label>מקום עבודה</label>
                            <input type="text" name="company" value={scanResult.company} onChange={handleInputChange} />
                        </div>
                        <div className="result-item">
                            <label>תאריך משכורת</label>
                            <input type="date" name="date" value={scanResult.date} onChange={handleInputChange} />
                        </div>
                        <div className="result-item">
                            <label>שכר נטו (₪)</label>
                            <input type="number" name="netSalary" value={scanResult.netSalary} onChange={handleInputChange} className="highlight-input" />
                        </div>
                        <div className="result-item">
                            <label>מיסים וניכויים (₪)</label>
                            <input type="number" name="taxes" value={scanResult.taxes} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="results-actions">
                        <button className="btn-cancel" onClick={() => { setScanResult(null); setFile(null); }}>סרוק מחדש</button>
                        <button className="btn-submit" onClick={handleSaveToTransactions}>אשר והוסף כהכנסה</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Paychecks;