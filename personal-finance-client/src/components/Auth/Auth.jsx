import React, { useState, useEffect } from 'react';
import './Auth.css';

const Auth = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', userName: '', pass: '' });
    const [errorMessage, setErrorMessage] = useState('');

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX;
            const y = e.clientY;
            setMousePos({ x, y });

            // הורדנו את עוצמת התזוזה מ-10 ל-3 בלבד כדי שיהיה נעים לעין
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;

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
        setErrorMessage('');
        const endpoint = isLoginView ? 'http://localhost:5000/auth/login' : 'http://localhost:5000/auth/reg';

        if (!formData.userName || !formData.pass || (!isLoginView && (!formData.name || !formData.email))) {
            setErrorMessage('נא למלא את כל השדות החסרים');
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
                    localStorage.setItem('name', data.name);
                    localStorage.setItem('is_admin', data.is_admin);
                    window.location.href = '/dashboard';
                } else {
                    setIsLoginView(true);
                    setErrorMessage('');
                    alert("נרשמת בהצלחה! כעת התחבר.");
                }
            } else {
                setErrorMessage(data.message || 'אירעה שגיאה בשרת');
            }
        } catch (err) {
            setErrorMessage('שגיאת תקשורת עם השרת');
        }
    };

    return (
        <div className="auth-container" dir="rtl">
            <div className="cursor-glow" style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }} />

            <div className="floating-elements">
                <div className="float-item float-1">₿</div>
                <div className="float-item float-2">📈</div>
                <div className="float-item float-3">₪</div>
                <div className="float-item float-4">💳</div>
                <div className="float-item float-5">📊</div>
                <div className="float-item float-6">$</div>
            </div>

            <div
                className="tilt-wrapper"
                style={{ transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)` }}
            >
                <h1 className="cyber-title">WELCOME TO CLEARCOIN</h1>

                <div className="auth-card">
                    <div className="electric-trace"></div>
                    <div className="bsd-text">בס"ד</div>
                    <h2>{isLoginView ? 'התחברות' : 'הרשמה'}</h2>

                    {errorMessage && <div className="error-msg">{errorMessage}</div>}

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
                    <div className="toggle-link" onClick={() => { setIsLoginView(!isLoginView); setErrorMessage(''); }}>
                        {isLoginView ? 'משתמש חדש? לחץ כאן להרשמה' : 'כבר רשום? לחץ כאן להתחברות'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;