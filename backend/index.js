const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,

});

app.get('/api/computadoras', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM computadoras')
        res.json(result.rows)
    } catch (error) {
        console.error(error.message)
        res.status(500).json({ message: 'Error al obtener computadoras' })
    }
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`)
})