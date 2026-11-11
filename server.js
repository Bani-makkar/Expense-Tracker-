import config from './../config/config'
import app from './express'
import initDb from './db/init'

// Connect to PostgreSQL and make sure the tables exist, then start the server
initDb()
  .then(() => {
    app.listen(config.port, (err) => {
      if (err) {
        console.log(err)
      }
      console.info('Server started on port %s.', config.port)
    })
  })
  .catch((err) => {
    console.error(`unable to connect to database: ${err.message}`)
    process.exit(1)
  })
