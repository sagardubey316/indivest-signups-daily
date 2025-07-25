const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); 

const app = express();
const PORT = 3000;

// PostgreSQL connection using env variables
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('PostgreSQL connection error:', err);
    process.exit(1); // stop the server if DB can't connect
  });

app.use(express.static('public'));

app.get('/fetch-latest-users', async (req, res) => {
  try {
    const startDate = '2025-07-18';
    const endDate = new Date().toISOString().slice(0, 10).replace('T', ' ') + " 23:59:59";

    const query = `
      SELECT first_name, last_name, email_id, phone_number, created_at
      FROM user_info
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    console.log(query, endDate);
    
    const result = await pool.query(query, [startDate, endDate]);

    const rows = result.rows;

    // Create HTML table
    let html = `
      <html>
      <head><title>User Info</title></head>
      <body>
        <h2>Latest User Records (From ${startDate} to ${endDate})</h2>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email ID</th>
            <th>Phone Number</th>
            <th>Created At</th>
          </tr>
    `;

    rows.forEach(row => {
      html += `
        <tr>
          <td>${row.first_name}</td>
          <td>${row.last_name}</td>
          <td>${row.email_id}</td>
          <td>${row.phone_number}</td>
          <td>${row.created_at}</td>
        </tr>
      `;
    });

    html += `
        </table>
      </body>
      </html>
    `;

    // Write to public/table.html
    const filePath = path.join(__dirname, 'public', 'table.html');
    fs.writeFileSync(filePath, html, 'utf8');

    // Redirect user to the table
    res.redirect('/table.html');

  } catch (err) {
    console.error('Error querying DB:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/fetch-latest-xl', async (req, res) => {
  try {
    const startDate = '2025-07-18';
    const endDate = new Date().toISOString().slice(0, 19).replace('T', ' '); 

    const query = `
      SELECT first_name, last_name, email_id, phone_number, created_at
      FROM user_info
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    console.log(query);
    
    const result = await pool.query(query, [startDate, endDate]);

    const rows = result.rows;

    res.status(200).json(rows);

  } catch (err) {
    console.error('Error querying DB:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
