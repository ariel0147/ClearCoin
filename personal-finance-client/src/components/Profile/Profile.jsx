import React, { useState, useEffect } from 'react';
import './Profile.css';

// רשימת האווטארים לבחירה
const AVATARS = ['👤', '👨‍💻', '👩‍💻', '🤖', '👽', '🥷', '🦁', '🐉', '🦉', '🚀', '💎', '👑'];

const Profile = ({ showNotification, setUserNameGlobal, setUserAvatarGlobal }) => {
    // הוספנו את ה-avatar לסטייט ההתחלתי
    const [userData, setUserData] = useState({ name: '', email: '', userName: '', avatar: '👤' });
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // שומרים גם את האווטאר שמגיע מהשרת
                setUserData({ ...data, avatar: data.avatar || '👤' });
                // מעדכנים מיד את הבר העליון
                if (setUserAvatarGlobal) setUserAvatarGlobal(data.avatar || '👤');
            }
        } catch (err) {
            console.error('שגיאה בטעינת נתוני משתמש:', err);
        }
    };

    // --- הפונקציה החדשה לטיפול בבחירת אווטאר ---
    const handleAvatarSelect = async (avatar) => {
        // מעדכנים את התצוגה מיד כדי שירגיש מהיר וחלוק
        setUserData({ ...userData, avatar });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/avatar', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatar })
            });

            if (response.ok) {
                localStorage.setItem('avatar', avatar);
                if (setUserAvatarGlobal) setUserAvatarGlobal(avatar);
                if (showNotification) showNotification('האווטאר נשמר בהצלחה!', 'success');
            }
        } catch (err) {
            if (showNotification) showNotification('שגיאה בשמירת האווטאר', 'error');
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: userData.name, email: userData.email })
            });

            if (response.ok) {
                if (showNotification) showNotification('הפרטים עודכנו בהצלחה!', 'success');
                localStorage.setItem('name', userData.name);
                if (setUserNameGlobal) setUserNameGlobal(userData.name);
            } else {
                if (showNotification) showNotification('שגיאה בעדכון הפרטים', 'error');
            }
        } catch (err) {
            if (showNotification) showNotification('שגיאת תקשורת', 'error');
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            if (showNotification) showNotification('הסיסמאות החדשות אינן תואמות', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (showNotification) showNotification('הסיסמה שונתה בהצלחה!', 'success');
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                if (showNotification) showNotification(data.message || 'שגיאה בעדכון הסיסמה', 'error');
            }
        } catch (err) {
            if (showNotification) showNotification('שגיאת תקשורת', 'error');
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2 className="section-title">הגדרות <span className="neon-text">פרופיל</span></h2>
                <p>נהל את החשבון האישי שלך ואת הגדרות האבטחה.</p>
            </div>

            {/* --- אזור בחירת האווטאר החדש --- */}
            <div className="glass-panel avatar-panel">
                <h3>בחר דמות ייצוגית</h3>
                <div className="avatars-grid">
                    {AVATARS.map(avatar => (
                        <div
                            key={avatar}
                            className={`avatar-item ${userData.avatar === avatar ? 'active' : ''}`}
                            onClick={() => handleAvatarSelect(avatar)}
                        >
                            {avatar}
                        </div>
                    ))}
                </div>
            </div>

            <div className="dashboard-grid">
                {/* עדכון פרטים אישיים */}
                <div className="glass-panel section-panel">
                    <div className="panel-header">
                        <h3>👤 פרטים אישיים</h3>
                    </div>
                    <form className="settings-form" onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label>שם משתמש (לא ניתן לשינוי)</label>
                            <input type="text" value={userData.userName} disabled className="disabled-input" />
                        </div>
                        <div className="form-group">
                            <label>שם מלא</label>
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => setUserData({...userData, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>כתובת אימייל</label>
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData({...userData, email: e.target.value})}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-submit">שמור שינויים</button>
                    </form>
                </div>

                {/* החלפת סיסמה */}
                <div className="glass-panel section-panel">
                    <div className="panel-header">
                        <h3>🔒 אבטחה וסיסמה</h3>
                    </div>
                    <form className="settings-form" onSubmit={handlePasswordUpdate}>
                        <div className="form-group">
                            <label>סיסמה נוכחית</label>
                            <input
                                type="password"
                                placeholder="הזן סיסמה נוכחית"
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>סיסמה חדשה</label>
                            <input
                                type="password"
                                placeholder="מינימום 6 תווים"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>אימות סיסמה חדשה</label>
                            <input
                                type="password"
                                placeholder="הזן שוב את הסיסמה החדשה"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-submit security-btn">עדכן סיסמה</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;