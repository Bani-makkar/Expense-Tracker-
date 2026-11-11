import pool from './pool'
import schema from './schema'

// Creates the tables if they don't exist yet (also verifies the connection)
const init = async () => {
  await pool.query(schema)
}

export default init
