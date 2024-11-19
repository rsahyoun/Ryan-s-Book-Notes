const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
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
app.use(bodyParser.urlencoded({ extended: true }));

// Route to add a new user
app.post('/users', async (req, res) => {
    const { username } = req.body;
    try {
        await pool.query('INSERT INTO users (username) VALUES ($1)', [username]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

// Route to add a new review
app.post('/reviews', async (req, res) => {
    const { user_id, book_id, review, rating } = req.body;
    try {
        await pool.query('INSERT INTO reviews (user_id, book_id, review, rating) VALUES ($1, $2, $3, $4)', [user_id, book_id, review, rating]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.get('/', async (req, res) => {
    try {
        const booksResult = await pool.query('SELECT * FROM books');
        const usersResult = await pool.query('SELECT * FROM users');
        const reviewsResult = await pool.query(`
            SELECT reviews.review, reviews.rating, users.username, books.title
            FROM reviews
            JOIN users ON reviews.user_id = users.id
            JOIN books ON reviews.book_id = books.id
        `);
        res.render('index', { books: booksResult.rows, users: usersResult.rows, reviews: reviewsResult.rows });
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.get('/add-book', (req, res) => {
    res.render('add-book', { book: {} });
});

app.post('/add-book', async (req, res) => {
    const { title, author, rating } = req.body;
    try {
        await pool.query('INSERT INTO books (title, author, rating) VALUES ($1, $2, $3)', [title, author, rating]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.get('/add-review', async (req, res) => {
    try {
        const booksResult = await pool.query('SELECT * FROM books');
        const usersResult = await pool.query('SELECT * FROM users');
        res.render('add-review', { books: booksResult.rows, users: usersResult.rows });
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.get('/add-user', (req, res) => {
    res.render('add-user');
});

app.get('/edit-book/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        res.render('edit-book', { book: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.post('/edit-book/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, rating } = req.body;
    try {
        await pool.query('UPDATE books SET title = $1, author = $2, rating = $3 WHERE id = $4', [title, author, rating, id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.post('/delete-book/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.redirect('/');
});

// Edit review
app.get('/edit-review/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
        const booksResult = await pool.query('SELECT * FROM books');
        const usersResult = await pool.query('SELECT * FROM users');
        res.render('edit-review', { review: result.rows[0], books: booksResult.rows, users: usersResult.rows });
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.post('/edit-review/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id, book_id, review, rating } = req.body;
    try {
        await pool.query('UPDATE reviews SET user_id = $1, book_id = $2, review = $3, rating = $4 WHERE id = $5', [user_id, book_id, review, rating, id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

// Delete review
app.post('/delete-review/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

// Edit user
app.get('/edit-user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        res.render('edit-user', { user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.post('/edit-user/:id', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    try {
        await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

// Delete user
app.post('/delete-user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

// Route to render the add/edit book form
app.get('/book-form/:id?', async (req, res) => {
    const { id } = req.params;
    let book = {};
    if (id) {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        book = result.rows[0];
    }
    res.render('add-book', { book });
});

// Route to handle form submission for adding/editing a book
app.post('/book-form/:id?', async (req, res) => {
    const { id } = req.params;
    const { title, author, rating } = req.body;
    try {
        if (id) {
            await pool.query('UPDATE books SET title = $1, author = $2, rating = $3 WHERE id = $4', [title, author, rating, id]);
        } else {
            await pool.query('INSERT INTO books (title, author, rating) VALUES ($1, $2, $3)', [title, author, rating]);
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.send('Error ' + err);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});