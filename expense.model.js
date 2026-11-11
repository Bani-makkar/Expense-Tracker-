import pool from '../db/pool'

const MAX_INT = 2147483647

const validationError = (message) => {
  const err = new Error(message)
  err.name = 'ValidationError'
  return err
}

const isValidId = (id) => /^\d+$/.test(String(id)) && Number(id) <= MAX_INT

// Expense joined with its owner, shaped like the old populated Mongoose document
const SELECT_EXPENSE = `
  SELECT e.id AS _id, e.title, e.category, e.amount, e.incurred_on, COALESCE(e.notes, '') AS notes,
         e.updated, e.created,
         json_build_object('_id', u.id, 'name', u.name) AS recorded_by
  FROM expenses e
  JOIN users u ON u.id = e.recorded_by`

const clean = (value) => typeof value === 'string' ? value.trim() : value

const validate = ({ title, category, amount }) => {
  if (!title) throw validationError('Title is required')
  if (!category) throw validationError('Category is required')
  if (amount === undefined || amount === null || amount === '') throw validationError('Amount is required')
  if (typeof amount !== 'number' || isNaN(amount)) throw validationError('Amount must be a number')
  if (amount < 0) throw validationError('Amount must be at least 0')
}

const toAmount = (amount) =>
  (amount === undefined || amount === null || amount === '') ? amount : Number(amount)

const create = async (userId, body = {}) => {
  const expense = {
    title: clean(body.title),
    category: clean(body.category),
    amount: toAmount(body.amount),
    incurred_on: body.incurred_on || null,
    notes: clean(body.notes) || null
  }
  validate(expense)
  const { rows } = await pool.query(
    `INSERT INTO expenses (title, category, amount, incurred_on, notes, recorded_by)
     VALUES ($1, $2, $3, COALESCE($4, now()), $5, $6)
     RETURNING id AS _id`,
    [expense.title, expense.category, expense.amount, expense.incurred_on, expense.notes, userId]
  )
  return rows[0]
}

const findById = async (id) => {
  if (!isValidId(id)) return null
  const { rows } = await pool.query(`${SELECT_EXPENSE} WHERE e.id = $1`, [id])
  return rows[0] || null
}

const listByUser = async (userId, firstDay, lastDay) => {
  const { rows } = await pool.query(
    `${SELECT_EXPENSE}
     WHERE e.recorded_by = $1 AND e.incurred_on >= $2 AND e.incurred_on <= $3
     ORDER BY e.incurred_on, e.id`,
    [userId, firstDay, lastDay]
  )
  return rows
}

/**
 * Updates title, category, amount, incurred_on and notes of an expense.
 */
const update = async (id, body = {}) => {
  const current = await findById(id)
  if (!current) return null

  const expense = {
    title: body.title !== undefined ? clean(body.title) : current.title,
    category: body.category !== undefined ? clean(body.category) : current.category,
    amount: body.amount !== undefined ? toAmount(body.amount) : current.amount,
    incurred_on: body.incurred_on || current.incurred_on,
    notes: body.notes !== undefined ? (clean(body.notes) || null) : current.notes
  }
  validate(expense)
  await pool.query(
    `UPDATE expenses
     SET title = $1, category = $2, amount = $3, incurred_on = $4, notes = $5, updated = now()
     WHERE id = $6`,
    [expense.title, expense.category, expense.amount, expense.incurred_on, expense.notes, id]
  )
  return findById(id)
}

const remove = async (id) => {
  await pool.query('DELETE FROM expenses WHERE id = $1', [id])
}

/**
 * Totals for the current month, today and yesterday.
 * A bucket with no expenses is left undefined (as the client expects).
 */
const currentPreview = async (userId, { monthStart, monthEnd, yesterday, today, tomorrow }) => {
  const { rows } = await pool.query(
    `SELECT
       SUM(amount) FILTER (WHERE incurred_on >= $2 AND incurred_on < $3) AS month,
       SUM(amount) FILTER (WHERE incurred_on >= $4 AND incurred_on < $5) AS today,
       SUM(amount) FILTER (WHERE incurred_on >= $6 AND incurred_on < $4) AS yesterday
     FROM expenses
     WHERE recorded_by = $1`,
    [userId, monthStart, monthEnd, today, tomorrow, yesterday]
  )
  const bucket = (id, total) => total === null ? undefined : { _id: id, totalSpent: total }
  const r = rows[0]
  return {
    month: bucket('currentMonth', r.month),
    today: bucket('today', r.today),
    yesterday: bucket('yesterday', r.yesterday)
  }
}

/**
 * Per category: the average monthly spend (over all recorded months) and
 * the total spent in the given month.
 */
const categoryOverview = async (userId, monthStart, monthEnd) => {
  const { rows } = await pool.query(
    `WITH monthly AS (
       SELECT category, date_trunc('month', incurred_on AT TIME ZONE 'UTC') AS month, SUM(amount) AS spent
       FROM expenses
       WHERE recorded_by = $1
       GROUP BY category, month
     ),
     average AS (
       SELECT category, ROUND(AVG(spent), 2) AS average
       FROM monthly
       GROUP BY category
     ),
     total AS (
       SELECT category, SUM(amount) AS total
       FROM expenses
       WHERE recorded_by = $1 AND incurred_on >= $2 AND incurred_on < $3
       GROUP BY category
     )
     SELECT a.category, a.average, t.total
     FROM average a
     LEFT JOIN total t ON t.category = a.category
     ORDER BY a.category`,
    [userId, monthStart, monthEnd]
  )
  return rows.map(r => {
    const mergedValues = { average: r.average }
    if (r.total !== null) mergedValues.total = r.total
    return { _id: r.category, mergedValues }
  })
}

/**
 * Total spent per category in a date range (inclusive).
 */
const categoryTotals = async (userId, firstDay, lastDay) => {
  const { rows } = await pool.query(
    `SELECT category, SUM(amount) AS total
     FROM expenses
     WHERE recorded_by = $1 AND incurred_on >= $2 AND incurred_on <= $3
     GROUP BY category
     ORDER BY category`,
    [userId, firstDay, lastDay]
  )
  return rows.map(r => ({ _id: r.category, x: r.category, y: r.total }))
}

/**
 * Total spent per month in a year.
 */
const monthlyTotals = async (userId, yearStart, yearEnd) => {
  const { rows } = await pool.query(
    `SELECT EXTRACT(MONTH FROM incurred_on AT TIME ZONE 'UTC')::int AS month, SUM(amount) AS total
     FROM expenses
     WHERE recorded_by = $1 AND incurred_on >= $2 AND incurred_on < $3
     GROUP BY month
     ORDER BY month`,
    [userId, yearStart, yearEnd]
  )
  return rows.map(r => ({ _id: r.month, x: r.month, y: r.total }))
}

/**
 * Every expense of a month as (day of month, amount) points.
 */
const dailyPoints = async (userId, monthStart, monthEnd) => {
  const { rows } = await pool.query(
    `SELECT id AS _id, EXTRACT(DAY FROM incurred_on AT TIME ZONE 'UTC')::int AS x, amount AS y
     FROM expenses
     WHERE recorded_by = $1 AND incurred_on >= $2 AND incurred_on < $3
     ORDER BY incurred_on, id`,
    [userId, monthStart, monthEnd]
  )
  return rows
}

export default {
  create, findById, listByUser, update, remove,
  currentPreview, categoryOverview, categoryTotals, monthlyTotals, dailyPoints
}
