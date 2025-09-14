require('dotenv').config();

// Load required libraries
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const fetch = require('node-fetch');

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3000;

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

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;
const JSEARCH_BASE_URL = process.env.JSEARCH_BASE_URL || 'https://jsearch.p.rapidapi.com';

if (!JSEARCH_API_KEY) {
    console.warn('Warning: JSEARCH_API_KEY is not set. Job search functionality will be disabled.');
}


// Create jobs table if it doesn't exist 
db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        company TEXT,
        date TEXT,
        link TEXT,
        notes TEXT,
        status TEXT DEFAULT 'saved'
    )
`);

function mapJSearchJobToDB(job){
    return {
        job_id: job.job_id,
        title: job.job_title || null,
        company: job.employer_name || null,
        location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
        employment_type: job.job_employment_type || null,
        description: job.job_description || null,
        apply_link: (job.job_apply_link || (Array.isArray(job.job_apply_links) ? job.job_apply_links[0] : null)) || null,
        is_remote: job.job_is_remote ? 1 : 0 || null,
        posted_date: job.job_posted_at_datetime_utc || job.job_posted_at_timestamp || null,
        salary_min: job.job_min_salary || null,
        salary_max: job.job_max_salary || null,
        salary_currency: job.job_salary_currency|| null,
    };
}

function upsertJobListing(db, row){
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO job_listings (
                job_id, title, company, location, employment_type, description, 
                apply_link, is_remote, posted_date, salary_min, salary_max, salary_currency
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                title = excluded.title,
                company = excluded.company,
                location = excluded.location,
                employment_type = excluded.employment_type,
                description = excluded.description,
                apply_link = excluded.apply_link,
                is_remote = excluded.is_remote,
                posted_date = excluded.posted_date,
                salary_min = excluded.salary_min,
                salary_max = excluded.salary_max,
                salary_currency = excluded.salary_currency

        `;
        db.run(
            sql, 
            [
                row.job_id, 
                row.title,
                row.company,
                row.location,
                row.employment_type,
                row.description,
                row.apply_link,
                row.is_remote,
                row.posted_date,
                row.salary_min,
                row.salary_max,
                row.salary_currency,

            ], 
            function(err) {
                if(err) return reject(err);
                resolve(this.changes);
            }
        );
    });
}

app.get('/api/jobs/search', async (req, res) => {
    try{
        const query = (req.query.query || '').toString();
        const page = parseInt(req.query.page, 10) || 1;
        const country = (req.query.country, 'us').toString();
        const date_posted = (req.query.date_posted, 'all').toString();
        if(!query) {
            return res.status(400).json({error: 'Missing query parameter: query'});
        }
        if(!JSEARCH_API_KEY) {
            return res.status(500).json({error: 'Server missing API configuration'});
        }

        const url = `${JSEARCH_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&num_pages=1&country=${encodeURIComponent(country)}&date_posted=${encodeURIComponent(date_posted)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': JSEARCH_API_KEY,
                'x-rapidapi-host': 'jsearch.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            const text = await response.text()
            console.error('JSearch error:', response.status, text);
            return res.status(502).json({error: 'Failed to fetch jobs from JSearch'});
        }

        const data = await response.json();
        const jobs = Array.isArray(data.data) ? data.data : [];

        for (const job of jobs) {
            const row = mapJSearchJobToDB(job);
            if(!row.job_id) continue;
            try{
                await upsertJobListing(db, row);
            } catch (e) {
                console.error('Failed to upsert job', row.job_id, e.message);
            }
        }
        const result = jobs.map(mapJSearchJobToDB)
        res.json({count: result.length, jobs: result});
    }catch (err){
        console.error('Error in /api/jobs/search:', err);
        res.status(500).json({error: 'Internal server error'});
    }
});

app.get('/api/jobs', (req, res) =>{
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100); 
    const offset = (parseInt(req.query.offset, 10) || 0); 
    const params = [];
    let whereClause = '';
    if (q) {
        whereClause = `WHERE title LIKE ? OR company LIKE ? OR location LIKE ?`;
        const likeQ = `%${q}%`;
        params.push(likeQ, likeQ, likeQ);
    }
    const sql = `SELECT id, job_id, title, company, location, employment_type, description, apply_link, is_remote, posted_date, salary_min, salary_max, salary_currency
                 FROM job_listings ${whereClause}
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching jobs from database:', err.message);
            return res.status(500).json({error: 'Failed to fetch jobs'});
        }
        res.json({count: rows.length, jobs: rows});
    });
});


db.run(`
    CREATE TABLE IF NOT EXISTS job_listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT UNIQUE,
        title TEXT,
        company TEXT,
        location TEXT,
        employment_type TEXT,
        description TEXT,
        apply_link TEXT,
        is_remote BOOLEAN,
        posted_date TEXT,
        salary_min INTEGER,
        salary_max INTEGER,
        salary_currency TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

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
    const {title, company, date, link, notes, status} = req.body;
    const query = 'INSERT INTO jobs (title, company, date, link, notes, status) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(query, [title, company, date, link, notes, status || 'saved'], function (err) {
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
    const {title, company, date, link, notes, status} = req.body;
    const query = 'UPDATE jobs SET title = ?, company = ?, date = ?, link = ?, notes = ?, status = ? WHERE id = ?';
    db.run(query, [title, company, date, link, notes, status || 'saved', jobID], function(err) {
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


