const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key",
  // PostgreSQL connection string, e.g. postgresql://user:password@host:5432/dbname
  databaseUrl: process.env.DATABASE_URL ||
    'postgresql://' + (process.env.PGUSER || 'postgres') +
    ':' + (process.env.PGPASSWORD || 'postgres') +
    '@' + (process.env.PGHOST || 'localhost') +
    ':' + (process.env.PGPORT || '5432') +
    '/' + (process.env.PGDATABASE || 'expense_tracker'),
  // set DATABASE_SSL=true for hosted databases that require SSL
  databaseSsl: process.env.DATABASE_SSL === 'true'
}

export default config
