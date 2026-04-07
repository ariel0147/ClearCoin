import React from 'react';
import './Sidebar.css';

// התפריט מקבל עכשיו את הלשונית הפעילה, ופונקציה שמשנה אותה
const Sidebar = ({ activeTab, setActiveTab }) => {

    // רשימת הכפתורים בתפריט
    const menuItems = [
        { id: 'overview', label: 'סקירה כללית' },
        { id: 'transactions', label: 'תנועות ועו"ש' },
        { id: 'assets', label: 'נכסים וחסכונות' },
        { id: 'paychecks', label: 'תלושי שכר' }
    ];

    return (
        <div className="sidebar">
            <div className="logo-area">
                <h2>CLEAR<span>COIN</span></h2>
            </div>
            <nav className="nav-menu">
                {menuItems.map(item => (
                    <div
                        key={item.id}
                        // אם הלשונית פעילה, מוסיף מחלקת active שצובעת את הכפתור בטורקיז
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        {item.label}
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;