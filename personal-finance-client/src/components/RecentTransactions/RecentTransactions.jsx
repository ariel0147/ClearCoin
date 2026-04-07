import React from 'react';
import './RecentTransactions.css';

const RecentTransactions = ({ transactions = [], onDelete }) => {
    return (
        <div className="transactions-container">
            <div className="transactions-header">
                <h3>תנועות אחרונות</h3>
            </div>

            <div className="table-responsive">
                <table className="cyber-table">
                    <thead>
                    <tr>
                        <th>תאריך</th>
                        <th>תיאור</th>
                        <th>סכום</th>
                        <th>פעולות</th>
                    </tr>
                    </thead>
                    <tbody>
                    {transactions.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{textAlign: 'center', padding: '30px', color: '#8892b0'}}>
                                אין תנועות להצגה עדיין. הוסף תנועה חדשה!
                            </td>
                        </tr>
                    ) : (
                        transactions.map((tx) => (
                            <tr key={tx.transaction_id} className="table-row">
                                <td className="tx-date">
                                    {new Date(tx.transaction_date).toLocaleDateString('he-IL')}
                                </td>
                                <td className="tx-desc">{tx.description}</td>
                                <td className={`tx-amount ${tx.type}`}>
                                    {tx.type === 'income' ? '+' : '-'}₪{parseFloat(tx.amount).toLocaleString()}
                                </td>
                                <td>
                                    {/* כפתור המחיקה */}
                                    <button
                                        className="delete-row-btn"
                                        onClick={() => onDelete(tx.transaction_id)}
                                        title="מחק תנועה"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentTransactions;