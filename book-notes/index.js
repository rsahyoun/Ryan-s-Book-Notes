const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// PostgreSQL pool setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'book_notes',
    password: 'Athan123!',
    port: 5432,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books');
        res.render('index', { books: result.rows });
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});