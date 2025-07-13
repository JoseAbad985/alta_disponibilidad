const express = require('express');
const { Pool } = require('pg');

const pools = {
  primary: new Pool({
    connectionString: 'postgres://postgres:ejemplo123@postgresql-primary:5432/postgres'
  }),
  replica: new Pool({
    connectionString: 'postgres://postgres:ejemplo123@postgresql-replica:5432/postgres'
  })
};

const aplicacion = express();

aplicacion.get('/', async (req, res) => {
  let resultado;
  try {
    resultado = await pools.primary.query('SELECT NOW()');
  } catch (errorPrimary) {
    console.error('Error en primaria, intentando réplica:', errorPrimary);
    try {
      resultado = await pools.replica.query('SELECT NOW()');
    } catch (errorReplica) {
      console.error('Error en réplica también:', errorReplica);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  res.json({ hora: resultado.rows[0].now });
});

const puerto = 3000;
aplicacion.listen(puerto, () => {
  console.log(`Servidor iniciado en puerto ${puerto}`);
});
