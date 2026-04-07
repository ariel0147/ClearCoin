const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// הגדרות בסיסיות - חייב להופיע בסדר הזה!
app.use(cors());
app.use(express.json());

// לוגר בקשות - כדי שתראה בטרמינל שזה עובד
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} request to ${req.url}`);
    next();
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'personal_finance_db'
});

// הכנת מסד הנתונים
async function prepareDB() {
    try {
        // טבלת משתמשים
        await pool.query(`CREATE TABLE IF NOT EXISTS Users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            userName VARCHAR(100) UNIQUE,
            password_hash VARCHAR(255)
        )`);

        // טבלת תנועות
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
            icon VARCHAR(10)
        )`);

        console.log('✅ מסד הנתונים מוכן לעבודה!');
    } catch (err) {
        console.error('❌ שגיאה בהכנת ה-DB:', err.message);
    }
}
prepareDB();

// מידלוואר אבטחה
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

// --- נתיבי אימות ---
app.post('/auth/reg', async (req, res) => {
    try {
        const { name, email, userName, pass } = req.body;
        const hashPass = await bcrypt.hash(pass, 10);
        await pool.query('INSERT INTO Users (name, email, userName, password_hash) VALUES (?, ?, ?, ?)', [name, email, userName, hashPass]);
        res.status(201).json({ message: 'נרשמת בהצלחה' });
    } catch (err) { res.status(500).json({ message: 'שגיאה בהרשמה' }); }
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
    } catch (err) { res.status(500).json({ message: 'שגיאה בכניסה' }); }
});

// --- נתיבי תנועות ---
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Transactions WHERE user_id = ? ORDER BY transaction_date DESC', [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: 'שגיאה' }); }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { amount, date, description, type } = req.body;
        await pool.query('INSERT INTO Transactions (user_id, amount, transaction_date, description, type) VALUES (?, ?, ?, ?, ?)', [req.user.id, amount, date, description, type]);
        res.status(201).json({ message: 'נשמר' });
    } catch (err) { res.status(500).json({ message: 'שגיאה' }); }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM Transactions WHERE transaction_id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'נמחק' });
    } catch (err) { res.status(500).json({ message: 'שגיאה' }); }
});

// --- נתיבי נכסים ---
app.get('/api/assets', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Assets WHERE user_id = ?', [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: 'שגיאה' }); }
});

app.post('/api/assets', authenticateToken, async (req, res) => {
    try {
        const { name, value, type, icon } = req.body;
        await pool.query('INSERT INTO Assets (user_id, name, value, type, icon) VALUES (?, ?, ?, ?, ?)', [req.user.id, name, value, type, icon]);
        res.status(201).json({ message: 'נשמר' });
    } catch (err) { res.status(500).json({ message: 'שגיאה' }); }
});

app.listen(5000, () => console.log('🚀 השרת באוויר על פורט 5000'));