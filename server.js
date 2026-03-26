// ייבוא הספריות שהתקנו
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config(); // טעינת משתני הסביבה מקובץ ה-.env

// יצירת אפליקציית השרת
const app = express();

// הגדרות בסיסיות לשרת (Middlewares)
app.use(cors()); // מאפשר קבלת בקשות מדומיינים אחרים (למשל מה-React שיירוץ בפורט אחר)
app.use(express.json()); // מאפשר לשרת לקרוא מידע שנשלח אליו בפורמט JSON

// הגדרת החיבור למסד הנתונים
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// ניסיון התחברות ל-MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ שגיאה בחיבור למסד הנתונים:', err.message);
        return;
    }
    console.log('✅ מחובר בהצלחה למסד הנתונים של MySQL!');
});

// נתיב בדיקה ראשוני (Route)
app.get('/', (req, res) => {
    res.send('ברוך הבא לשרת הניהול הפיננסי האישי!');
});

// הפעלת השרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 השרת רץ בהצלחה על פורט ${PORT}`);
});