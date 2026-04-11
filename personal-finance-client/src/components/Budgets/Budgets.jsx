import React, { useState, useEffect } from 'react';
import './Budgets.css';

const Budgets = ({ showNotification }) => {
    const [budgets, setBudgets] = useState([]);
    const [goals, setGoals] = useState([]);

    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [showGoalForm, setShowGoalForm] = useState(false);

    const [newBudget, setNewBudget] = useState({ category: '', limit_amount: '' });
    const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', icon: '🎯' });

    const [depositAmounts, setDepositAmounts] = useState({});

    // סטייטים חדשים לעריכת שם היעד
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [editGoalName, setEditGoalName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const currentMonth = new Date().toISOString().slice(0, 7);

            const [budgetsRes, goalsRes] = await Promise.all([
                fetch(`http://localhost:5000/api/budgets?month=${currentMonth}`, { headers }),
                fetch('http://localhost:5000/api/goals', { headers })
            ]);

            if (budgetsRes.ok) setBudgets(await budgetsRes.json());
            if (goalsRes.ok) setGoals(await goalsRes.json());
        } catch (err) { console.error('שגיאה בשליפת נתונים:', err); }
    };

    // --- הוספת נתונים ---
    const handleAddBudget = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...newBudget, month: new Date().toISOString().slice(0, 7) })
            });

            if (response.ok) {
                if (showNotification) showNotification('תקציב הוגדר בהצלחה!', 'success');
                setNewBudget({ category: '', limit_amount: '' });
                setShowBudgetForm(false);
                fetchData();
            }
        } catch (err) { if (showNotification) showNotification('שגיאה בהגדרת תקציב', 'error'); }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newGoal)
            });

            if (response.ok) {
                if (showNotification) showNotification('היעד נוצר בהצלחה!', 'success');
                setNewGoal({ name: '', target_amount: '', icon: '🎯' });
                setShowGoalForm(false);
                fetchData();
            }
        } catch (err) { if (showNotification) showNotification('שגיאה ביצירת יעד', 'error'); }
    };

    const handleDeposit = async (goalId) => {
        const amount = parseFloat(depositAmounts[goalId]);
        if (!amount || amount <= 0) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/goals/${goalId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ add_amount: amount })
            });

            if (response.ok) {
                if (showNotification) showNotification('הכסף הופקד ליעד!', 'success');
                setDepositAmounts({ ...depositAmounts, [goalId]: '' });
                fetchData();
            }
        } catch (err) { if (showNotification) showNotification('שגיאה בהפקדה', 'error'); }
    };

    // --- מחיקות ---
    const handleDeleteBudget = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק תקציב זה?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/budgets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (showNotification) showNotification('תקציב נמחק', 'success');
            fetchData();
        } catch (err) { console.error('שגיאה במחיקת תקציב', err); }
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק יעד זה?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/goals/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (showNotification) showNotification('יעד נמחק', 'success');
            fetchData();
        } catch (err) { console.error('שגיאה במחיקת יעד', err); }
    };

    // --- עריכת שם היעד ---
    const startEditingGoal = (goal) => {
        setEditingGoalId(goal.goal_id);
        setEditGoalName(goal.name);
    };

    const saveEditGoal = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/goals/edit/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: editGoalName })
            });

            if (response.ok) {
                if (showNotification) showNotification('שם היעד עודכן', 'success');
                setEditingGoalId(null);
                fetchData();
            }
        } catch (err) {
            if (showNotification) showNotification('שגיאה בעדכון השם', 'error');
        }
    };

    const getBudgetColor = (spent, limit) => {
        const percentage = (spent / limit) * 100;
        if (percentage < 50) return '#4caf50';
        if (percentage < 85) return '#ffeb3b';
        return '#f44336';
    };

    return (
        <div className="budgets-container">
            <div className="budgets-header">
                <h2 className="section-title">יעדים <span className="neon-text">ותקציב</span></h2>
                <p>עקוב אחר ההוצאות החודשיות שלך וחסוך למטרות החשובות באמת.</p>
            </div>

            <div className="dashboard-grid">
                {/* אזור תקציבים */}
                <div className="glass-panel section-panel">
                    <div className="panel-header">
                        <h3>📊 תקציב חודשי</h3>
                        <button className="btn-add" onClick={() => setShowBudgetForm(!showBudgetForm)}>
                            {showBudgetForm ? 'סגור' : '+ תקציב חדש'}
                        </button>
                    </div>

                    {showBudgetForm && (
                        <form className="add-form" onSubmit={handleAddBudget}>
                            <input type="text" placeholder="קטגוריה (למשל: מסעדות)" value={newBudget.category} onChange={(e) => setNewBudget({...newBudget, category: e.target.value})} required />
                            <input type="number" placeholder="סכום גבול (₪)" value={newBudget.limit_amount} onChange={(e) => setNewBudget({...newBudget, limit_amount: e.target.value})} required />
                            <button type="submit" className="btn-submit">שמור תקציב</button>
                        </form>
                    )}

                    <div className="items-list">
                        {budgets.length === 0 ? <p className="empty-state">לא הוגדרו תקציבים לחודש זה.</p> : null}
                        {budgets.map(budget => {
                            const spent = parseFloat(budget.spent_amount) || 0;
                            const limit = parseFloat(budget.limit_amount);
                            const percent = Math.min((spent / limit) * 100, 100);

                            return (
                                <div key={budget.budget_id} className="progress-card">
                                    <div className="progress-info">
                                        <span>{budget.category}</span>
                                        <div className="card-actions">
                                            <span>₪{spent.toFixed(0)} / ₪{limit.toFixed(0)}</span>
                                            <button className="icon-btn delete-btn" title="מחק תקציב" onClick={() => handleDeleteBudget(budget.budget_id)}>🗑️</button>
                                        </div>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: getBudgetColor(spent, limit), boxShadow: `0 0 10px ${getBudgetColor(spent, limit)}` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* אזור יעדים */}
                <div className="glass-panel section-panel">
                    <div className="panel-header">
                        <h3>🎯 יעדי חיסכון</h3>
                        <button className="btn-add" onClick={() => setShowGoalForm(!showGoalForm)}>
                            {showGoalForm ? 'סגור' : '+ יעד חדש'}
                        </button>
                    </div>

                    {showGoalForm && (
                        <form className="add-form" onSubmit={handleAddGoal}>
                            <input type="text" placeholder="שם היעד (למשל: חופשה)" value={newGoal.name} onChange={(e) => setNewGoal({...newGoal, name: e.target.value})} required />
                            <input type="number" placeholder="סכום יעד (₪)" value={newGoal.target_amount} onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})} required />
                            <button type="submit" className="btn-submit">צור יעד</button>
                        </form>
                    )}

                    <div className="items-list">
                        {goals.length === 0 ? <p className="empty-state">אין לך יעדי חיסכון כרגע. הגיע הזמן לחלום!</p> : null}
                        {goals.map(goal => {
                            const current = parseFloat(goal.current_amount);
                            const target = parseFloat(goal.target_amount);
                            const percent = Math.min((current / target) * 100, 100);

                            return (
                                <div key={goal.goal_id} className="progress-card goal-card">
                                    <div className="progress-info">
                                        <div className="goal-name-edit">
                                            <span>{goal.icon} </span>
                                            {editingGoalId === goal.goal_id ? (
                                                <input
                                                    className="edit-name-input"
                                                    autoFocus
                                                    value={editGoalName}
                                                    onChange={(e) => setEditGoalName(e.target.value)}
                                                />
                                            ) : (
                                                <span>{goal.name}</span>
                                            )}
                                        </div>
                                        <div className="card-actions">
                                            <span className="percent-text">{percent.toFixed(1)}%</span>
                                            {editingGoalId === goal.goal_id ? (
                                                <button className="icon-btn save-btn" title="שמור שם" onClick={() => saveEditGoal(goal.goal_id)}>💾</button>
                                            ) : (
                                                <button className="icon-btn edit-btn" title="ערוך שם יעד" onClick={() => startEditingGoal(goal)}>✏️</button>
                                            )}
                                            <button className="icon-btn delete-btn" title="מחק יעד" onClick={() => handleDeleteGoal(goal.goal_id)}>🗑️</button>
                                        </div>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill neon-blue-fill" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="goal-amounts">
                                        <span>נצבר: ₪{current.toFixed(0)}</span>
                                        <span>יעד: ₪{target.toFixed(0)}</span>
                                    </div>
                                    <div className="deposit-action">
                                        <input type="number" placeholder="סכום להפקדה..." value={depositAmounts[goal.goal_id] || ''} onChange={(e) => setDepositAmounts({...depositAmounts, [goal.goal_id]: e.target.value})} />
                                        <button onClick={() => handleDeposit(goal.goal_id)}>הפקד</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Budgets;