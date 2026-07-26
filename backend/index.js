const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`)
})