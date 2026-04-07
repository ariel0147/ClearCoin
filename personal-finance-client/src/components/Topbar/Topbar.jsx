import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

const Topbar = ({ userName }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear(); // מנקה הכל
        navigate('/');
    };

    return (
        <div className="topbar">
            <div className="welcome-message">
                שלום, <span>{userName}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>התנתק</button>
        </div>
    );
};

export default Topbar;