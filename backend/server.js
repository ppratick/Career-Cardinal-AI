// Load required libraries
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Setup Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database or create one if not found
const db = new sqlite3.Database('jobs.db', (err) => {
    if (err) {
        console.error('DB error:', err.message);
    } else {
        console.log('Connected to jobs.db');
    }
});

// Create jobs table if it doesn't exist 
db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        company TEXT,
        date TEXT,
        link TEXT,
        notes TEXT
    )
`);

// Test route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
