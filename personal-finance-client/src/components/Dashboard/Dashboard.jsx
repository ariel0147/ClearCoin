import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import Overview from '../Overview/Overview';
import RecentTransactions from '../RecentTransactions/RecentTransactions';
import ExpenseChart from '../ExpenseChart/ExpenseChart';
import AddTransaction from '../AddTransaction/AddTransaction';
import Assets from '../Assets/Assets';
import Paychecks from '../Paychecks/Paychecks';
import './Dashboard.css';

const Dashboard = () => {
    const [userName, setUserName] = useState('');
    const [transactions, setTransactions] = useState([]);

    // --- מנגנון הניווט (איזה מסך מוצג כרגע) ---
    const [activeTab, setActiveTab] = useState('overview'); // ברירת מחדל: סקירה כללית

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const navigate = useNavigate();

    const showNotification = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: '' }), 3500);
    };

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/transactions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
        } catch (err) { console.error('שגיאה:', err); }
    };

    const requestDeleteTransaction = (id) => setTransactionToDelete(id);

    const confirmDelete = async () => {
        if (!transactionToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/transactions/${transactionToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchTransactions();
                showNotification('התנועה נמחקה בהצלחה', 'success');
            } else {
                showNotification('שגיאה במחיקת התנועה', 'error');
            }
        } catch (err) { showNotification('שגיאת תקשורת עם השרת', 'error'); }
        setTransactionToDelete(null);
    };

    // פונקציית התנתקות חדשה
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('name');
        navigate('/'); // חזרה למסך ההתחברות/הרשמה
    };

    useEffect(() => {
        const storedName = localStorage.getItem('name');
        if (!storedName) navigate('/');
        else {
            setUserName(storedName);
            fetchTransactions();
        }
    }, [navigate]);

    return (
        <div className="dashboard-layout" dir="rtl">
            {/* מעבירים לתפריט הצד את הסטייט וגם את פונקציית ההתנתקות! */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
            />

            <div className="main-area">
                <Topbar userName={userName} />

                <div className="content-area">

                    {/* ========== מרכז בקרת התצוגה (ראוטר פנימי) ========== */}

                    {/* תצוגה 1: מסך הסקירה הכללית */}
                    {activeTab === 'overview' && (
                        <>
                            <div className="dashboard-header-flex">
                                <h2 className="section-title">סקירה כללית</h2>
                                <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
                                    + תנועה חדשה
                                </button>
                            </div>
                            <Overview transactions={transactions} />
                            <div className="bottom-row">
                                <div className="transactions-section">
                                    <RecentTransactions transactions={transactions} onDelete={requestDeleteTransaction} />
                                </div>
                                <div className="chart-section">
                                    <ExpenseChart transactions={transactions} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* תצוגה 2: מסך נכסים וחסכונות החדש */}
                    {activeTab === 'assets' && (
                        <Assets showNotification={showNotification} />
                    )}

                    {/* מסכי פלייסבולדר לבינתיים */}
                    {activeTab === 'transactions' && <h2 className="section-title">פירוט תנועות ועו"ש (בקרוב)</h2>}
                    {activeTab === 'paychecks' && (
                        <Paychecks
                            showNotification={showNotification}
                            onTransactionAdded={() => fetchTransactions()}
                        />
                    )}
                    {activeTab === 'budgets' && <h2 className="section-title">יעדים ותקציב (בקרוב)</h2>}

                </div>
            </div>

            <AddTransaction
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onTransactionAdded={() => {
                    fetchTransactions();
                    showNotification('תנועה חדשה נשמרה בהצלחה', 'success');
                }}
            />

            {transactionToDelete && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-content">
                        <h3>מחיקת תנועה</h3>
                        <p>האם אתה בטוח שברצונך למחוק תנועה זו? המספרים יתעדכנו בהתאם ופעולה זו אינה הפיכה.</p>
                        <div className="confirm-actions">
                            <button className="cancel-btn" onClick={() => setTransactionToDelete(null)}>ביטול</button>
                            <button className="delete-btn" onClick={confirmDelete}>מחק תנועה</button>
                        </div>
                    </div>
                </div>
            )}

            {toast.message && (
                <div className={`cyber-toast ${toast.type}`}>{toast.message}</div>
            )}
        </div>
    );
};

export default Dashboard;