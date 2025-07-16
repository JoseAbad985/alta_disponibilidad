const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:ejemplo123@postgresql-primary:5432/postgres'
});

const app = express();

// Healthcheck original
app.get('/messages/health', (req, res) => {
  res.json({ status: 'message service OK' });
});

// NUEVA RUTA: Endpoint de estado para el monitoreo del dashboard
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'Operativo' });
});

// Endpoint principal para demo: devuelve hora desde la BD
app.get('/messages/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ hora: result.rows[0].now });
  } catch (error) {
    console.error('Error en message-service:', error);
    res.status(500).json({ error: 'Error interno en message-service' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Message Service iniciado en puerto ${port}`);
});
