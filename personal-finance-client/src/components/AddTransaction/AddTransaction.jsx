import React, { useState } from 'react';
import './AddTransaction.css';

const AddTransaction = ({ isOpen, onClose, onTransactionAdded }) => {
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // שולפים את האסימון של המשתמש כדי שהשרת ידע מי אנחנו
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // שולחים את האסימון באבטחה
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onTransactionAdded(); // קורא לפונקציה שמרעננת את הנתונים בדשבורד
                onClose(); // סוגר את החלון

                // מאפס את הטופס לפעם הבאה
                setFormData({
                    type: 'expense',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    description: ''
                });
            } else {
                alert('שגיאה בשמירת התנועה');
            }
        } catch (err) {
            console.error('שגיאת תקשורת:', err);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} dir="rtl">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>הוספת תנועה חדשה</h2>
                <form onSubmit={handleSubmit} className="transaction-form">
                    <div className="type-selector">
                        <button type="button" className={`type-btn expense ${formData.type === 'expense' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, type: 'expense' })}>הוצאה</button>
                        <button type="button" className={`type-btn income ${formData.type === 'income' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, type: 'income' })}>הכנסה</button>
                    </div>
                    <div className="input-group">
                        <label>סכום (₪)</label>
                        <div className="input-wrapper">
                            <input type="number" name="amount" required min="1" placeholder="0.00" onChange={handleChange} value={formData.amount} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>תאריך</label>
                        <div className="input-wrapper">
                            <input type="date" name="date" required onChange={handleChange} value={formData.date} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>תיאור</label>
                        <div className="input-wrapper">
                            <input type="text" name="description" required placeholder="לדוגמה: קניות בסופר..." onChange={handleChange} value={formData.description} />
                        </div>
                    </div>
                    <button type="submit" className="submit-btn">שמור תנועה</button>
                </form>
            </div>
        </div>
    );
};

export default AddTransaction;