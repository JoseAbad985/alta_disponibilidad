const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:ejemplo123@postgresql-primary:5432/postgres'
});

const app = express();

// Healthcheck
app.get('/auth/', (req, res) => {
  res.json({ status: 'auth service OK' });
});

// Endpoint raíz (devuelve hora)
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ hora: result.rows[0].now });
  } catch (error) {
    console.error('Error en auth-service:', error);
    res.status(500).json({ error: 'Error interno en auth-service' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Auth Service iniciado en puerto ${port}`);
});
