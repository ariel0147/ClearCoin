import React from 'react';
import './Overview.css';

// מקבלים את התנועות כ-Prop מהדשבורד
const Overview = ({ transactions }) => {

    // משתנים לשמירת הסכומים המחושבים
    let totalIncome = 0;
    let totalExpenses = 0;

    // חישוב אוטומטי - עוברים על כל התנועות
    if (transactions && transactions.length > 0) {
        transactions.forEach(tx => {
            const amount = parseFloat(tx.amount); // המרה למספר עשרוני כדי למנוע שגיאות חישוב
            if (tx.type === 'income') {
                totalIncome += amount;
            } else if (tx.type === 'expense') {
                totalExpenses += amount;
            }
        });
    }

    // היתרה היא פשוט ההכנסות פחות ההוצאות
    const currentBalance = totalIncome - totalExpenses;

    return (
        <div className="overview-container">
            {/* כרטיס יתרה */}
            <div className="stat-card balance">
                <div className="card-icon">₪</div>
                <div className="card-info">
                    <h3>יתרה נוכחית בעו"ש</h3>
                    <h2 className="amount" dir="ltr">₪{currentBalance.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</h2>
                </div>
            </div>

            {/* כרטיס הכנסות */}
            <div className="stat-card income">
                <div className="card-icon">📈</div>
                <div className="card-info">
                    <h3>הכנסות החודש</h3>
                    <h2 className="amount" dir="ltr">₪{totalIncome.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</h2>
                </div>
            </div>

            {/* כרטיס הוצאות */}
            <div className="stat-card expenses">
                <div className="card-icon">📉</div>
                <div className="card-info">
                    <h3>הוצאות החודש</h3>
                    <h2 className="amount" dir="ltr">₪{totalExpenses.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</h2>
                </div>
            </div>
        </div>
    );
};

export default Overview;