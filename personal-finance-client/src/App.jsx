import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth/Auth';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* נתיב ברירת מחדל: מסך התחברות והרשמה */}
                <Route path="/" element={<Auth />} />

                {/* נתיב ללוח הבקרה הפיננסי לאחר התחברות מוצלחת */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* הגנת שגיאות: אם המשתמש מקליד כתובת לא קיימת, נחזיר אותו להתחברות */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;