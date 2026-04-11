import React, { useState } from 'react';
import './Transactions.css';

const Transactions = ({ transactions, onDelete }) => {
    // סטייטים למנוע החיפוש והסינון
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');

    // שליפת כל החודשים הייחודיים שיש בהם תנועות (כדי למלא את תיבת הבחירה)
    const uniqueMonths = [...new Set(transactions.map(t => t.transaction_date.substring(0, 7)))].sort().reverse();

    // סינון התנועות לפי מה שהמשתמש בחר
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.amount.toString().includes(searchTerm);
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesMonth = filterMonth === 'all' || t.transaction_date.startsWith(filterMonth);
        return matchesSearch && matchesType && matchesMonth;
    });

    // פונקציית ייצוא לאקסל (CSV) תומכת עברית
    const exportToCSV = () => {
        const headers = ['תאריך', 'תיאור', 'סוג', 'סכום'];
        const csvRows = [headers.join(',')];

        filteredTransactions.forEach(t => {
            const date = new Date(t.transaction_date).toLocaleDateString('he-IL');
            const type = t.type === 'income' ? 'הכנסה' : 'הוצאה';
            const desc = `"${t.description.replace(/"/g, '""')}"`; // מונע שבירת שורות בגלל פסיקים בתיאור
            csvRows.push([date, desc, type, t.amount].join(','));
        });

        // הוספת BOM כדי שאקסל יקרא עברית בלי ג'יבריש
        const csvString = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ClearCoin_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="transactions-full-container">
            <div className="transactions-header">
                <h2 className="section-title">תנועות <span className="neon-text">העו"ש</span></h2>
                <p>נהל, חפש וסנן את כל ההכנסות וההוצאות שלך.</p>
            </div>

            <div className="glass-panel filters-panel">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="חיפוש לפי תיאור או סכום..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filters-group">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="all">כל התנועות</option>
                        <option value="income">הכנסות בלבד</option>
                        <option value="expense">הוצאות בלבד</option>
                    </select>

                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                        <option value="all">כל החודשים</option>
                        {uniqueMonths.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>

                    <button className="export-btn" onClick={exportToCSV}>
                        📥 ייצא לאקסל
                    </button>
                </div>
            </div>

            <div className="glass-panel table-panel">
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">לא נמצאו תנועות התואמות את החיפוש.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="transactions-table">
                            <thead>
                            <tr>
                                <th>תאריך</th>
                                <th>תיאור</th>
                                <th>סוג</th>
                                <th>סכום</th>
                                <th>פעולות</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredTransactions.map(t => (
                                <tr key={t.transaction_id}>
                                    <td>{new Date(t.transaction_date).toLocaleDateString('he-IL')}</td>
                                    <td>{t.description}</td>
                                    <td>
                                            <span className={`type-badge ${t.type}`}>
                                                {t.type === 'income' ? 'הכנסה' : 'הוצאה'}
                                            </span>
                                    </td>
                                    <td className={`amount ${t.type}`}>
                                        {t.type === 'income' ? '+' : '-'}₪{parseFloat(t.amount).toFixed(2)}
                                    </td>
                                    <td>
                                        <button
                                            className="icon-btn delete-btn"
                                            title="מחק תנועה"
                                            onClick={() => onDelete(t.transaction_id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Transactions;