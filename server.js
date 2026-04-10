const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
// יצירת תיקיית העלאות אם היא לא קיימת
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// הגדרות שמירת הקבצים של Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // שמירה בתיקיית uploads
    },
    filename: function (req, file, cb) {
        // נותנים לקובץ שם ייחודי מבוסס על הזמן הנוכחי כדי שלא יידרסו קבצים
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'paycheck-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} request to ${req.url}`);
    next();
});

// הגדרת החיבור - הוספנו charset בשביל תמיכה מושלמת באימוג'ים!
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'personal_finance_db',
    charset: 'utf8mb4'
});

// הכנת מסד הנתונים
async function prepareDB() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS Users (
                                                               user_id INT AUTO_INCREMENT PRIMARY KEY,
                                                               name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            userName VARCHAR(100) UNIQUE,
            password_hash VARCHAR(255)
            )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS Transactions (
                                                                      transaction_id INT AUTO_INCREMENT PRIMARY KEY,
                                                                      user_id INT NOT NULL,
                                                                      amount DECIMAL(10,2),
            transaction_date DATE,
            description VARCHAR(255),
            type VARCHAR(50)
            )`);

        // === השורה שהייתה פה (DROP TABLE) נמחקה! ===
        // מעכשיו הנתונים יישמרו לתמיד.

        // טבלת נכסים
        await pool.query(`CREATE TABLE IF NOT EXISTS Assets (
                                                                asset_id INT AUTO_INCREMENT PRIMARY KEY,
                                                                user_id INT NOT NULL,
                                                                name VARCHAR(100),
            value DECIMAL(10,2),
            type VARCHAR(50),
            icon VARCHAR(255)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        console.log('✅ מסד הנתונים מוכן לעבודה!');
    } catch (err) {
        console.error('❌ שגיאה בהכנת ה-DB:', err.message);
    }
}
prepareDB();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'נא להתחבר שוב' });

    jwt.verify(token, process.env.SECRET_KEY || 'ClearCoinSecretKey123', (err, user) => {
        if (err) return res.status(403).json({ message: 'פג תוקף החיבור' });
        req.user = user;
        next();
    });
};

app.post('/auth/reg', async (req, res) => {
    try {
        const { name, email, userName, pass } = req.body;
        const hashPass = await bcrypt.hash(pass, 10);
        await pool.query('INSERT INTO Users (name, email, userName, password_hash) VALUES (?, ?, ?, ?)', [name, email, userName, hashPass]);
        res.status(201).json({ message: 'נרשמת בהצלחה' });
    } catch (err) {
        console.error("שגיאה בהרשמה:", err);
        res.status(500).json({ message: 'שגיאה בהרשמה' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { userName, pass } = req.body;
        const [users] = await pool.query('SELECT * FROM Users WHERE userName = ?', [userName]);

        if (users.length === 0) return res.status(400).json({ message: 'משתמש לא קיים' });

        const isMatch = await bcrypt.compare(pass, users[0].password_hash);
        if (!isMatch) return res.status(400).json({ message: 'סיסמה שגויה' });

        const token = jwt.sign({ id: users[0].user_id, name: users[0].name }, process.env.SECRET_KEY || 'ClearCoinSecretKey123', { expiresIn: '3h' });
        res.json({ name: users[0].name, token });
    } catch (err) {
        console.error("שגיאה בהתחברות:", err);
        res.status(500).json({ message: 'שגיאה בכניסה' });
    }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Transactions WHERE user_id = ? ORDER BY transaction_date DESC', [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: 'שגיאה בשליפת תנועות' }); }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { amount, date, description, type } = req.body;
        await pool.query('INSERT INTO Transactions (user_id, amount, transaction_date, description, type) VALUES (?, ?, ?, ?, ?)', [req.user.id, amount, date, description, type]);
        res.status(201).json({ message: 'נשמר בהצלחה' });
    } catch (err) { res.status(500).json({ message: 'שגיאה בשמירת תנועה' }); }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM Transactions WHERE transaction_id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'נמחק' });
    } catch (err) { res.status(500).json({ message: 'שגיאה במחיקה' }); }
});

app.get('/api/assets', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Assets WHERE user_id = ?', [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: 'שגיאה בשליפת נכסים' }); }
});

app.post('/api/assets', authenticateToken, async (req, res) => {
    try {
        const { name, value, type, icon } = req.body;
        await pool.query('INSERT INTO Assets (user_id, name, value, type, icon) VALUES (?, ?, ?, ?, ?)', [req.user.id, name, value, type, icon]);
        res.status(201).json({ message: 'נכס נשמר בהצלחה' });
    } catch (err) {
        console.error('שגיאה בהוספת נכס:', err);
        res.status(500).json({ message: 'שגיאה בשמירת נכס' });
    }
});
// --- עדכון שווי של נכס קיים ---
app.put('/api/assets/:id', authenticateToken, async (req, res) => {
    try {
        const { value } = req.body;
        await pool.query(
            'UPDATE Assets SET value = ? WHERE asset_id = ? AND user_id = ?',
            [value, req.params.id, req.user.id]
        );
        res.json({ message: 'שווי הנכס עודכן בהצלחה' });
    } catch (err) {
        console.error('שגיאה בעדכון נכס:', err);
        res.status(500).json({ message: 'שגיאה בעדכון הנכס' });
    }
});

// --- מחיקת נכס ---
app.delete('/api/assets/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM Assets WHERE asset_id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'הנכס נמחק בהצלחה' });
    } catch (err) {
        console.error('שגיאה במחיקת נכס:', err);
        res.status(500).json({ message: 'שגיאה במחיקת הנכס' });
    }
});

// --- נתיב העלאה וסריקת תלוש שכר אמיתית עם Tesseract A.I (גרסה 3 - חכמה) ---
app.post('/api/scan-paycheck', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'לא נבחר קובץ סרוק' });
        }

        if (req.file.mimetype === 'application/pdf') {
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'מערכת ה-AI תומכת כרגע בתמונות בלבד (JPG/PNG).' });
        }

        console.log(`✅ מתחיל סריקת A.I לקובץ: ${req.file.filename}`);

        const { data: { text } } = await Tesseract.recognize(
            req.file.path,
            'heb+eng'
        );

        console.log("📄 סריקה הושלמה. מפעיל אלגוריתם חילוץ V3...");

        // 1. תאריך
        let dateStr = new Date().toISOString().split('T')[0];
        const dateMatch = text.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
        if (dateMatch) {
            let day = dateMatch[1].padStart(2, '0');
            let month = dateMatch[2].padStart(2, '0');
            let year = dateMatch[3];
            if (year.length === 2) year = '20' + year;
            dateStr = `${year}-${month}-${day}`;
        }

        // 2. חילוץ שכר לתשלום (נטו / לאחר הורדות)
        let guessedNetSalary = '0.00';

        // מוצא את כל המספרים העשרוניים במסמך (למשל 8500.50 או 12,000.00)
        const decimalRegex = /\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g;
        const fallbackRegex = /\b\d{4,5}\.\d{2}\b/g;

        const decimalNumbers = text.match(decimalRegex) || text.match(fallbackRegex) || [];

        if (decimalNumbers.length > 0) {
            // מנקים פסיקים והופכים למספרים אמיתיים (מעל 1500 ש"ח)
            const validSalaries = decimalNumbers
                .map(n => parseFloat(n.replace(/,/g, '')))
                .filter(n => n > 1500 && n < 80000);

            if (validSalaries.length > 0) {
                // טריק 1: חיפוש מספר שנמצא בסמוך למילים מובהקות של שכר נטו (כולל שגיאות כתיב של ה-OCR)
                const netMatch = text.match(/(?:לתשלום|נטו|העברה|תטלומים|הורדות)[\s\S]{0,35}?(\d{1,3}(?:,\d{3})*\.\d{2}|\d{4,5}\.\d{2})/);

                if (netMatch) {
                    guessedNetSalary = parseFloat(netMatch[1].replace(/,/g, '')).toFixed(2);
                    console.log("🎯 הנטו אותר באמצעות מילת מפתח:", guessedNetSalary);
                } else {
                    // טריק 2: הנטו לרוב מופיע בחלק הכי תחתון של התלוש.
                    // לכן ניקח את המספר החוקי *האחרון* שהמערכת קראה!
                    guessedNetSalary = validSalaries[validSalaries.length - 1].toFixed(2);
                    console.log("🎯 הנטו אותר לפי מיקום בתחתית התלוש:", guessedNetSalary);
                }
            }
        }

        const guessedTaxes = (parseFloat(guessedNetSalary) * 0.2).toFixed(2); // נשאיר כרגע הערכה גסה למס

        // 3. חילוץ שם המעסיק (מקום העבודה)
        let companyName = '';

        // מנסה למצוא שם שמסתיים בבע"מ/ע"מ (לוקח עד 4 מילים לפני הבע"מ)
        const companyMatch = text.match(/([א-ת]+(?:\s+[א-ת]+){0,3}\s+(?:בע"מ|בע״מ|ע"מ|בעמ|inc|ltd))/i);
        if (companyMatch) {
            companyName = companyMatch[1].trim();
        } else {
            // אם אין בע"מ, המערכת תסרוק את השורות הראשונות של התלוש (שם לרוב מופיע הלוגו/שם העסק)
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
            for (let line of lines) {
                // אם השורה כולה בעברית ואינה מכילה מילות "תלוש שכר" גנריות
                if (/^[א-ת\s]+$/.test(line) && !line.includes('תלוש') && !line.includes('שכר') && !line.includes('חודש')) {
                    companyName = line;
                    break;
                }
            }
        }

        // אם כלום לא עבד, נשים טקסט ברירת מחדל
        if (!companyName || companyName.length < 2) {
            companyName = 'לא מזהה מעסיק (נא להזין)';
        }

        // מחזירים את התשובה ללקוח
        res.json({
            company: companyName,
            date: dateStr,
            netSalary: guessedNetSalary,
            taxes: guessedTaxes
        });

    } catch (err) {
        console.error('❌ שגיאה בסריקת תלוש:', err);
        res.status(500).json({ message: 'שגיאה בעיבוד התלוש בשרת' });
    }
});
app.listen(5000, () => console.log('🚀 השרת באוויר על פורט 5000'));