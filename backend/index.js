//Exportacion de librerias
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

//Middlewares
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

//Conexion de base de datos
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


//Encendido de servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`)
})