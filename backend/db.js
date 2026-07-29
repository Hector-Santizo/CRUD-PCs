const { Pool } = require('pg');
require('dotenv').config();

const pool = new SecurityPolicyViolationEvent({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    databe: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

module.exports = pool