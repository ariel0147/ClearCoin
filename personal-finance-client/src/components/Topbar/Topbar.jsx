import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

const Topbar = ({ userName, userAvatar }) => { // 1. הוספנו את userAvatar לפרופס
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear(); // מנקה הכל
        navigate('/');
    };

    return (
        <div className="topbar">
            <div className="welcome-message">
                {/* 2. הוספנו את התגית של האווטאר עם ברירת מחדל אם עדיין לא נטען */}
                <span className="user-avatar-top">{userAvatar || '👤'}</span>
                שלום, <span>{userName}</span>
            </div>
            {/* כפתור סייבר עגול קומפקטי */}
            <button className="topbar-logout-btn" onClick={handleLogout} title="התנתק">
                <span className="power-icon">⏻</span>
            </button>
        </div>
    );
};

export default Topbar;