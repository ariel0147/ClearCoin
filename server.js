const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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

        // טבלת נכסים
        await pool.query(`CREATE TABLE IF NOT EXISTS Assets (
            asset_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100),
            value DECIMAL(10,2),
            type VARCHAR(50),
            icon VARCHAR(255)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        // טבלת יעדי חיסכון (Goals)
        await pool.query(`CREATE TABLE IF NOT EXISTS Goals (
            goal_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100),
            target_amount DECIMAL(10,2),
            current_amount DECIMAL(10,2) DEFAULT 0,
            icon VARCHAR(50)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        // טבלת תקציבים חודשיים (Budgets)
        await pool.query(`CREATE TABLE IF NOT EXISTS Budgets (
                                                                 budget_id INT AUTO_INCREMENT PRIMARY KEY,
                                                                 user_id INT NOT NULL,
                                                                 category VARCHAR(100),
            limit_amount DECIMAL(10,2),
            month VARCHAR(7) -- פורמט של YYYY-MM כדי לדעת לאיזה חודש התקציב שייך
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        // === תוספת: עדכון טבלת משתמשים קיימת - הוספת עמודת אווטאר ===
        try {
            await pool.query(`ALTER TABLE Users ADD COLUMN avatar VARCHAR(50) DEFAULT '👤'`);
            console.log('✅ עמודת אווטאר נוספה לטבלת המשתמשים');
        } catch (err) {
            // מתעלם מהשגיאה במקרה שהעמודה כבר קיימת כדי שהשרת לא יקרוס
        }

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
// --- נתיב העלאה וסריקת תלוש שכר עם מודל AI ויזואלי (הגרסה החכמה) ---
app.post('/api/scan-paycheck', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'לא נבחר קובץ סרוק' });
        }

        console.log(`✅ מתחיל סריקת AI ויזואלית לקובץ: ${req.file.filename}`);

        // אתחול מודל ה-AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // המרת התמונה לפורמט שה-API מבין
        const imageAsBase64 = fs.readFileSync(req.file.path).toString("base64");
        const imagePart = {
            inlineData: {
                data: imageAsBase64,
                mimeType: req.file.mimetype
            }
        };

        // כתיבת פרומפט מדויק שינחה את ה-AI איך לחלץ את הנתונים
        const prompt = `
        You are a highly advanced financial data extraction AI. 
        Attached is an image of an Israeli paycheck (תלוש שכר).
        Please analyze the image and extract the following details:
        1. "company": The name of the employer / company (שם המעסיק).
        2. "date": The date of the paycheck in YYYY-MM-DD format (usually the month and year it was issued).
        3. "netSalary": The absolute final Net Salary to be paid to the bank account (סך הכל לתשלום / נטו לתשלום). Do NOT extract the Gross (ברוטו). Return this as a number only, without currency symbols or commas.
        4. "taxes": The total deductions including Income Tax (מס הכנסה), National Insurance (ביטוח לאומי), and Health Insurance (מס בריאות). Return as a number only.

        Respond ONLY with a valid JSON object. No markdown formatting, no explanations. 
        Example format:
        {
          "company": "Company Name Ltd",
          "date": "2023-10-01",
          "netSalary": "8500.50",
          "taxes": "1200.00"
        }
        `;

        // שליחה למודל
        const result = await model.generateContent([prompt, imagePart]);
        let responseText = result.response.text();

        // ניקוי הטקסט במקרה שהמודל החזיר עטיפה של Markdown (כמו ```json ... ```)
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        console.log("📄 תשובת ה-AI:", responseText);

        const parsedData = JSON.parse(responseText);

        // מחיקת הקובץ מהשרת אחרי הסריקה כדי לא לבזבז מקום
        fs.unlinkSync(req.file.path);

        // החזרת הנתונים המדויקים ללקוח
        res.json({
            company: parsedData.company || 'לא זוהה',
            date: parsedData.date || new Date().toISOString().split('T')[0],
            netSalary: parsedData.netSalary || '0.00',
            taxes: parsedData.taxes || '0.00'
        });

    } catch (err) {
        console.error('❌ שגיאה בסריקת תלוש חכמה:', err);
        // נוודא שאנחנו מוחקים את הקובץ גם אם הייתה שגיאה
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'שגיאה בפענוח התלוש בשרת' });
    }
});
// ==========================================
//          API ליעדים (Goals)
// ==========================================

// שליפת כל היעדים
app.get('/api/goals', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Goals WHERE user_id = ?', [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: 'שגיאה בשליפת יעדים' }); }
});

// יצירת יעד חדש
app.post('/api/goals', authenticateToken, async (req, res) => {
    try {
        const { name, target_amount, current_amount, icon } = req.body;
        await pool.query(
            'INSERT INTO Goals (user_id, name, target_amount, current_amount, icon) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, name, target_amount, current_amount || 0, icon]
        );
        res.status(201).json({ message: 'היעד נוצר בהצלחה!' });
    } catch (err) { res.status(500).json({ message: 'שגיאה בשמירת יעד' }); }
});

// הוספת כסף ליעד קיים (עדכון current_amount)
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        const { add_amount } = req.body;
        await pool.query(
            'UPDATE Goals SET current_amount = current_amount + ? WHERE goal_id = ? AND user_id = ?',
            [add_amount, req.params.id, req.user.id]
        );
        res.json({ message: 'הופקד כסף ליעד בהצלחה!' });
    } catch (err) { res.status(500).json({ message: 'שגיאה בעדכון יעד' }); }
});

// מחיקת יעד
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM Goals WHERE goal_id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'היעד נמחק' });
    } catch (err) { res.status(500).json({ message: 'שגיאה במחיקת יעד' }); }
});
// עריכת שם היעד
app.put('/api/goals/edit/:id', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        await pool.query(
            'UPDATE Goals SET name = ? WHERE goal_id = ? AND user_id = ?',
            [name, req.params.id, req.user.id]
        );
        res.json({ message: 'שם היעד עודכן בהצלחה!' });
    } catch (err) {
        console.error('שגיאה בעדכון שם היעד:', err);
        res.status(500).json({ message: 'שגיאה בעדכון שם היעד' });
    }
});
// ==========================================
//          API לתקציבים (Budgets)
// ==========================================

// שליפת התקציבים לחודש מסוים + חישוב חכם של כמה כבר הוצאנו
// שליפת התקציבים לחודש מסוים + חישוב חכם של כמה כבר הוצאנו (גרסה מתוקנת ובטוחה)
app.get('/api/budgets', authenticateToken, async (req, res) => {
    try {
        const currentMonth = req.query.month || new Date().toISOString().slice(0, 7);

        // 1. שליפת כל התקציבים של המשתמש לאותו חודש
        const [budgets] = await pool.query(
            'SELECT * FROM Budgets WHERE user_id = ? AND month = ?',
            [req.user.id, currentMonth]
        );

        // 2. שליפת כל ההוצאות של המשתמש לאותו חודש בלבד
        const [expenses] = await pool.query(
            `SELECT amount, description FROM Transactions 
             WHERE user_id = ? AND type = 'expense' 
             AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
            [req.user.id, currentMonth]
        );

        // 3. חיבור וחישוב ההוצאות בתוך השרת (מונע שגיאות מסד נתונים)
        const result = budgets.map(budget => {
            let spent = 0;
            expenses.forEach(expense => {
                // בדיקה: אם תיאור ההוצאה מכיל את שם הקטגוריה (למשל "מסעדה" בתוך "מסעדת פסטה")
                if (expense.description && expense.description.includes(budget.category)) {
                    spent += parseFloat(expense.amount);
                }
            });

            return {
                ...budget,
                spent_amount: spent
            };
        });

        res.json(result);
    } catch (err) {
        console.error('❌ שגיאה מפורטת בשליפת תקציב:', err);
        res.status(500).json({ message: 'שגיאה בשליפת תקציבים' });
    }
});

// הגדרת תקציב חדש לקטגוריה
app.post('/api/budgets', authenticateToken, async (req, res) => {
    try {
        const { category, limit_amount, month } = req.body;
        await pool.query(
            'INSERT INTO Budgets (user_id, category, limit_amount, month) VALUES (?, ?, ?, ?)',
            [req.user.id, category, limit_amount, month]
        );
        res.status(201).json({ message: 'תקציב הוגדר בהצלחה!' });
    } catch (err) { res.status(500).json({ message: 'שגיאה בשמירת תקציב' }); }
});

// מחיקת תקציב
app.delete('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM Budgets WHERE budget_id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'התקציב בוטל' });
    } catch (err) { res.status(500).json({ message: 'שגיאה במחיקת תקציב' }); }
});
// ==========================================
//          API לפרופיל משתמש והגדרות
// ==========================================

// שליפת נתוני המשתמש (שם, אימייל ושם משתמש)
// שליפת נתוני המשתמש (כולל אווטאר)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT name, email, userName, avatar FROM Users WHERE user_id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'משתמש לא נמצא' });
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בשליפת נתוני משתמש' });
    }
});

// עדכון תמונת אווטאר
app.put('/api/user/avatar', authenticateToken, async (req, res) => {
    try {
        const { avatar } = req.body;
        await pool.query('UPDATE Users SET avatar = ? WHERE user_id = ?', [avatar, req.user.id]);
        res.json({ message: 'האווטאר עודכן בהצלחה!' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בעדכון אווטאר' });
    }
});

// עדכון פרטי משתמש (שם ואימייל)
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        await pool.query('UPDATE Users SET name = ?, email = ? WHERE user_id = ?', [name, email, req.user.id]);
        res.json({ message: 'הפרטים עודכנו בהצלחה!' });
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בעדכון פרטים' });
    }
});

// עדכון סיסמה בצורה מאובטחת
app.put('/api/user/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 1. שליפת הסיסמה המקורית מהמסד
        const [users] = await pool.query('SELECT password_hash FROM Users WHERE user_id = ?', [req.user.id]);

        // 2. בדיקה שהסיסמה הנוכחית שהוזנה באמת תואמת למה שיש בשרת
        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) return res.status(400).json({ message: 'הסיסמה הנוכחית שגויה' });

        // 3. אם הכל תקין - מצפינים את הסיסמה החדשה ושומרים
        const hashPass = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE Users SET password_hash = ? WHERE user_id = ?', [hashPass, req.user.id]);

        res.json({ message: 'הסיסמה שונתה בהצלחה!' });
    } catch (err) {
        console.error('שגיאה בעדכון סיסמה:', err);
        res.status(500).json({ message: 'שגיאה בעדכון סיסמה' });
    }
});
app.listen(5000, () => console.log('🚀 השרת באוויר על פורט 5000'));