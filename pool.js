import { Pool, types } from 'pg'
import config from './../../config/config'

// pg returns NUMERIC (OID 1700) as a string to avoid precision loss.
// The client does arithmetic on amounts, so parse them into numbers.
types.setTypeParser(1700, (val) => parseFloat(val))

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err)
})

export default pool
