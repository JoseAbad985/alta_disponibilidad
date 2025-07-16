const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  connectionString: 'postgres://postgres:ejemplo123@postgresql-primary:5432/postgres',
});


const connectWithRetry = async () => {
  let retries = 5;
  while (retries) {
    try {
      await pool.connect();
      console.log('Conexión a la base de datos establecida.');
      break; 
    } catch (err) {
      console.error('Fallo al conectar con la base de datos. Reintentando...', err.message);
      retries -= 1;
      console.log(`Reintentos restantes: ${retries}`);
      if (retries === 0) {
        
        process.exit(1);
      }

      await new Promise(res => setTimeout(res, 5000));
    }
  }
};


app.get('/auth/', (req, res) => {
  res.json({ status: 'auth service OK' });
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ hora: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: 'Error interno en auth-service' });
  }
});


const startApp = async () => {

  await connectWithRetry();
  

  app.listen(port, () => {
    console.log(`Auth Service iniciado en puerto ${port}`);
  });
};


startApp();