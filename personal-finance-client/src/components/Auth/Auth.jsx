import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', userName: '', pass: '' });

    // מערכת ההודעות המעוצבת החדשה שלנו
    const [toast, setToast] = useState({ message: '', type: '' });

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const navigate = useNavigate();

    // פונקציה להצגת הודעות קופצות
    const showNotification = (message, type) => {
        setToast({ message, type });
        // ההודעה תיעלם אוטומטית אחרי 3.5 שניות
        setTimeout(() => setToast({ message: '', type: '' }), 3500);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX;
            const y = e.clientY;
            setMousePos({ x, y });

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const rotateX = ((y - centerY) / centerY) * -1.5;
            const rotateY = ((x - centerX) / centerX) * 1.5;
            setTilt({ rotateX, rotateY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLoginView ? 'http://localhost:5000/auth/login' : 'http://localhost:5000/auth/reg';

        if (!formData.userName || !formData.pass || (!isLoginView && (!formData.name || !formData.email))) {
            showNotification('נא למלא את כל השדות החסרים', 'error');
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                if (isLoginView) {
                    // התחברות מוצלחת
                    localStorage.setItem('name', data.name);
                    localStorage.setItem('is_admin', data.is_admin);
                    localStorage.setItem('token', data.token); // שומרים את האסימון החדש
                    navigate('/dashboard');
                } else {
                    // הרשמה מוצלחת
                    setIsLoginView(true);
                    showNotification('🚀 נרשמת בהצלחה! כעת התחבר', 'success');
                }
            } else {
                showNotification(data.message || 'אירעה שגיאה בשרת', 'error');
            }
        } catch (err) {
            showNotification('שגיאת תקשורת עם השרת', 'error');
        }
    };

    return (
        <div className="auth-container" dir="rtl">
            <div className="cursor-glow" style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }} />

            {/* --- הצגת ההודעה המעוצבת (Toast) --- */}
            {toast.message && (
                <div className={`cyber-toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <div className="floating-elements">
                <div className="float-item float-1">₿</div>
                <div className="float-item float-2">📈</div>
                <div className="float-item float-3">₪</div>
                <div className="float-item float-4">💳</div>
                <div className="float-item float-6">$</div>
            </div>

            <div className="tilt-wrapper" style={{ transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)` }}>
                <h1 className="cyber-title">WELCOME TO CLEARCOIN</h1>

                <div className="auth-card">
                    <div className="electric-trace"></div>
                    <div className="bsd-text">בס"ד</div>
                    <h2>{isLoginView ? 'התחברות' : 'הרשמה'}</h2>

                    <form onSubmit={handleSubmit}>
                        {!isLoginView && (
                            <>
                                <div className="input-group">
                                    <label>שם מלא</label>
                                    <div className="input-wrapper">
                                        <div className="input-lightning"></div>
                                        <input type="text" name="name" onChange={handleChange} value={formData.name} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>אימייל</label>
                                    <div className="input-wrapper">
                                        <div className="input-lightning"></div>
                                        <input type="email" name="email" onChange={handleChange} value={formData.email} />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="input-group">
                            <label>שם משתמש</label>
                            <div className="input-wrapper">
                                <div className="input-lightning"></div>
                                <input type="text" name="userName" onChange={handleChange} value={formData.userName} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>סיסמה</label>
                            <div className="input-wrapper">
                                <div className="input-lightning"></div>
                                <input type="password" name="pass" onChange={handleChange} value={formData.pass} />
                            </div>
                        </div>
                        <button type="submit" className="auth-btn">
                            {isLoginView ? 'היכנס למערכת' : 'צור חשבון'}
                        </button>
                    </form>
                    <div className="toggle-link" onClick={() => { setIsLoginView(!isLoginView); setToast({message:'', type:''}); }}>
                        {isLoginView ? 'משתמש חדש? לחץ כאן להרשמה' : 'כבר רשום? לחץ כאן להתחברות'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;