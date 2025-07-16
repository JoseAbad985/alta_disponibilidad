const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const axios = require('axios');
const os = require('os');

const pools = {
  primary: new Pool({
    connectionString: 'postgres://postgres:ejemplo123@postgresql-primary:5432/postgres'
  }),
  replica: new Pool({
    connectionString: 'postgres://postgres:ejemplo123@postgresql-replica:5432/postgres'
  })
};

const aplicacion = express();
const hostname = os.hostname();

// NUEVA RUTA: Healthcheck que no depende de la BD
aplicacion.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

aplicacion.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

aplicacion.get('/api/time', async (req, res) => {
  let resultado;
  let fuente = 'primary';
  try {
    resultado = await pools.primary.query('SELECT NOW()');
  } catch (errorPrimary) {
    console.error(`[${hostname}] Error en BD primaria, intentando réplica:`, errorPrimary.message);
    try {
      resultado = await pools.replica.query('SELECT NOW()');
      fuente = 'replica';
    } catch (errorReplica) {
      console.error(`[${hostname}] Error en BD réplica también:`, errorReplica.message);
      return res.status(500).json({ error: 'Fallo de conexión: Ambas bases de datos están inaccesibles.' });
    }
  }
  res.json({
    hora: resultado.rows[0].now,
    fuente: fuente,
    hostname: hostname
  });
});

aplicacion.get('/api/message-status', async (req, res) => {
    try {
        const response = await axios.get('http://message-service:3000/status', { timeout: 2000 });
        if (response.status === 200) {
            res.status(200).json({ status: 'Operativo' });
        } else {
            res.status(500).json({ status: 'No disponible', error: `Respuesta inesperada: ${response.status}` });
        }
    } catch (error) {
        console.error(`[${hostname}] Error al contactar message-service:`, error.message);
        res.status(503).json({ status: 'No disponible', error: 'El servicio no responde.' });
    }
});

const puerto = 3000;
aplicacion.listen(puerto, () => {
  console.log(`Servidor de la aplicación principal iniciado en puerto ${puerto} en el host ${hostname}`);
});
