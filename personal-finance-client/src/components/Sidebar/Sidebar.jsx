import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    // רשימת הלשוניות שלנו
    const menuItems = [
        { id: 'overview', label: 'סקירה כללית', icon: '📊' },
        { id: 'transactions', label: 'תנועות העו"ש', icon: '💸' },
        { id: 'assets', label: 'נכסים וחסכונות', icon: '💎' },
        { id: 'paychecks', label: 'תלושי שכר', icon: '📄' },
        { id: 'budgets', label: 'יעדים ותקציב', icon: '🎯' }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <h2>Clear<span className="neon-text">Coin</span></h2>
                <div className="logo-line"></div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {/* אפקט זוהר בלשונית הפעילה */}
                        {activeTab === item.id && <div className="active-glow"></div>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogout}>
                    <span className="nav-icon">🚪</span>
                    <span className="nav-label">התנתק</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;