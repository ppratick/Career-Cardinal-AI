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

// GET all jobs 
app.get('/jobs', (req, res) => {
    db.all('SELECT * FROM jobs', [], (err, rows) => {
        if (err) {
            console.error('Error fetching jobs:', err.message);
            return res.status(500).json({error: 'failed to fetch jobs'});
        }
        res.json(rows);
    });
} );

// POST a new job
app.post('/jobs', (req, res) => {
    const {title, company, date, link, notes} = req.body;
    const query = 'INSERT INTO jobs (title, company, date, link, notes) VALUES (?, ?, ?, ?, ?)';
    db.run(query, [title, company, date, link, notes], function (err) {
        if (err) {
            console.error('Error putting jobs:', err.message);
            return res.status(500).json({error: 'failed to put jobs'});
        }
        res.status(201).json({id: this.lastID});
    });
});

// PUT update job
app.put('/jobs/:id', (req, res) =>{
    const jobID = req.params.id;
    const {title, company, date, link, notes} = req.body;
    const query = 'UPDATE jobs SET title = ?, company = ?, date = ?, link = ?, notes = ?, WHERE id = ?';
    db.run(query, [title, company, date, link, notes, jobID], function(err) {
        if (err) {
            console.error('Error updating jobs:', err.message);
            return res.status(500).json({error: 'failed to update job'});
        }
        res.json({updated: this.changes});
    });
});

// DELETE job
app.delete('/jobs/:id', (req, res) =>{
    const jobID = req.params.id;
    db.run('DELETE FROM jobs WHERE id = ?', [jobID], function(err){
         if (err) {
            console.error('Error deleting jobs:', err.message);
            return res.status(500).json({error: 'failed to delete job'});
        }
        res.json({deleted: this.changes});
    })
}); 

// Test route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});


// curl [OPTIONS] URL