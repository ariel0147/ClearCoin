import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

const Topbar = ({ userName, userAvatar }) => {
    const navigate = useNavigate();

    // לוגיקת החלפת ערכת נושא
    const [isLight, setIsLight] = useState(localStorage.getItem('theme') === 'light');

    useEffect(() => {
        if (isLight) {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    }, [isLight]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="topbar">
            <div className="welcome-message">
                <span className="user-avatar-top">{userAvatar || '👤'}</span>
                שלום, <span>{userName}</span>
            </div>

            <div className="topbar-actions">
                {/* כפתור ה-Toggle המעוצב (מד שמש/ירח) */}
                <div className="theme-toggle" onClick={() => setIsLight(!isLight)} title="החלף מצב תצוגה">
                    <div className={`toggle-track ${isLight ? 'light' : 'dark'}`}>
                        <div className="toggle-thumb">
                            {isLight ? '☀️' : '🌙'}
                        </div>
                    </div>
                </div>

                {/* כפתור התנתקות הקיים שלך */}
                <button className="topbar-logout-btn" onClick={handleLogout} title="התנתק">
                    <span className="power-icon">⏻</span>
                </button>
            </div>
        </div>
    );
};

export default Topbar;