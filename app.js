const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
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

const getCSV = async () => {
  try {
    const startDate = '2025-07-15';
    const endDate = new Date().toISOString().slice(0, 10).replace('T', ' ') + " 23:59:59";
    console.log(endDate);
    
    const query = `
      SELECT first_name, last_name, email_id, phone_number, created_at
      FROM user_info
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
    `;
    console.log(query);

    const result = await pool.query(query, [startDate, endDate]);
    const rows = result.rows;

    // Path to save the CSV file
    const filePath = path.join(__dirname, 'public', 'user_info.csv');

    // If file exists, delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'first_name', title: 'First Name' },
        { id: 'last_name', title: 'Last Name' },
        { id: 'email_id', title: 'Email ID' },
        { id: 'phone_number', title: 'Phone Number' },
        { id: 'created_at', title: 'Created At' },
      ],
    });

    // Write data to CSV
    await csvWriter.writeRecords(rows);

  } catch (err) {
    console.error('Error querying DB:', err);
  }
};

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  getCSV();
});
