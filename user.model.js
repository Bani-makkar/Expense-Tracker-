import crypto from 'crypto'
import pool from '../db/pool'

const EMAIL_REGEX = /.+\@.+\..+/
const MAX_INT = 2147483647

const validationError = (message) => {
  const err = new Error(message)
  err.name = 'ValidationError'
  return err
}

const isValidId = (id) => /^\d+$/.test(String(id)) && Number(id) <= MAX_INT

// Public representation of a user (never exposes hashed_password / salt)
const PUBLIC_COLUMNS = 'id AS _id, name, email, updated, created'

const makeSalt = () => Math.round((new Date().valueOf() * Math.random())) + ''

const encryptPassword = (password, salt) => {
  if (!password) return ''
  try {
    return crypto
      .createHmac('sha1', salt)
      .update(password)
      .digest('hex')
  } catch (err) {
    return ''
  }
}

const validate = ({ name, email, password, passwordRequired }) => {
  if (!name) throw validationError('Name is required')
  if (!email) throw validationError('Email is required')
  if (!EMAIL_REGEX.test(email)) throw validationError('Please fill a valid email address')
  if (passwordRequired && !password) throw validationError('Password is required')
  if (password && password.length < 6) throw validationError('Password must be at least 6 characters.')
}

/**
 * Creates a user. Returns the public user object.
 */
const create = async ({ name, email, password } = {}) => {
  name = typeof name === 'string' ? name.trim() : name
  email = typeof email === 'string' ? email.trim() : email
  password = typeof password === 'string' ? password : undefined
  validate({ name, email, password, passwordRequired: true })

  const salt = makeSalt()
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, hashed_password, salt)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, encryptPassword(password, salt), salt]
  )
  return rows[0]
}

/**
 * Finds a user by id. Returns the public user object or null.
 */
const findById = async (id) => {
  if (!isValidId(id)) return null
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id])
  return rows[0] || null
}

/**
 * Finds a user by email, including the password hash and salt (for sign in).
 */
const findByEmail = async (email) => {
  if (typeof email !== 'string') return null
  const { rows } = await pool.query(
    `SELECT id AS _id, name, email, hashed_password, salt FROM users WHERE email = $1`,
    [email])
  return rows[0] || null
}

const authenticate = (user, plainText) => {
  return encryptPassword(plainText, user.salt) === user.hashed_password
}

const list = async () => {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY id`)
  return rows
}

/**
 * Updates name, email and (optionally) password. Returns the public user.
 */
const update = async (id, body = {}) => {
  const current = await findById(id)
  if (!current) return null

  const name = typeof body.name === 'string' ? body.name.trim() : current.name
  const email = typeof body.email === 'string' ? body.email.trim() : current.email
  const password = typeof body.password === 'string' && body.password !== '' ? body.password : undefined
  validate({ name, email, password, passwordRequired: false })

  const values = [name, email, id]
  let passwordSql = ''
  if (password) {
    const salt = makeSalt()
    values.push(encryptPassword(password, salt), salt)
    passwordSql = ', hashed_password = $4, salt = $5'
  }
  const { rows } = await pool.query(
    `UPDATE users SET name = $1, email = $2, updated = now()${passwordSql}
     WHERE id = $3
     RETURNING ${PUBLIC_COLUMNS}`,
    values
  )
  return rows[0] || null
}

/**
 * Deletes a user (and, through ON DELETE CASCADE, their expenses).
 */
const remove = async (id) => {
  if (!isValidId(id)) return null
  const { rows } = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`, [id])
  return rows[0] || null
}

export default { create, findById, findByEmail, authenticate, list, update, remove }
