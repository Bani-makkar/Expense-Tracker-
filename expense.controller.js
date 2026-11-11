import Expense from '../models/expense.model'
import errorHandler from './../helpers/dbErrorHandler'

// All date boundaries are computed in UTC so they line up with the
// UTC-based month/day grouping done in the SQL queries.
const utcMonthRange = (date) => {
  const y = date.getUTCFullYear(), m = date.getUTCMonth()
  return [new Date(Date.UTC(y, m, 1)), new Date(Date.UTC(y, m + 1, 1))]
}

const parseDate = (value) => {
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    const err = new Error('Invalid date')
    err.name = 'ValidationError'
    throw err
  }
  return date
}

const create = async (req, res) => {
  try {
    await Expense.create(req.auth._id, req.body)
    return res.status(200).json({
      message: "Expense recorded!"
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const expenseByID = async (req, res, next, id) => {
    try {
      let expense = await Expense.findById(id)
      if (!expense)
        return res.status('400').json({
          error: "Expense record not found"
        })
      req.expense = expense
      next()
    } catch (err){
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
}

const read = (req, res) => {
    return res.json(req.expense)
}

const listByUser = async (req, res) => {
  try {
    const firstDay = parseDate(req.query.firstDay)
    const lastDay = parseDate(req.query.lastDay)
    let expenses = await Expense.listByUser(req.auth._id, firstDay, lastDay)
    res.json(expenses)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}
//1.
const currentMonthPreview = async (req, res) => {
  const [monthStart, monthEnd] = utcMonthRange(new Date())

  const today = new Date()
  today.setUTCHours(0,0,0,0)

  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate()+1)

  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate()-1)

  try {
    let expensePreview = await Expense.currentPreview(req.auth._id, {monthStart, monthEnd, yesterday, today, tomorrow})
    res.json(expensePreview)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

// 2.
const expenseByCategory = async (req, res) => {
  const [monthStart, monthEnd] = utcMonthRange(new Date())

  try {
    let categoryMonthlyAvg = await Expense.categoryOverview(req.auth._id, monthStart, monthEnd)
    res.json(categoryMonthlyAvg)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

// 3.a
const averageCategories = async (req, res) => {
  try {
    const firstDay = parseDate(req.query.firstDay)
    const lastDay = parseDate(req.query.lastDay)
    let categoryTotals = await Expense.categoryTotals(req.auth._id, firstDay, lastDay)
    res.json({monthAVG:categoryTotals})
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

// 3.b
const yearlyExpenses = async (req, res) => {
  try {
    const y = parseInt(req.query.year, 10)
    if (isNaN(y)) throw parseDate(NaN)
    const yearStart = new Date(Date.UTC(y, 0, 1))
    const yearEnd = new Date(Date.UTC(y + 1, 0, 1))
    let totalMonthly = await Expense.monthlyTotals(req.auth._id, yearStart, yearEnd)
    res.json({monthTot:totalMonthly})
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

//3.c
const plotExpenses = async (req, res) => {
  try {
    const [monthStart, monthEnd] = utcMonthRange(parseDate(req.query.month))
    let points = await Expense.dailyPoints(req.auth._id, monthStart, monthEnd)
    res.json(points)
  } catch (err){
    console.log(err)
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let expense = await Expense.update(req.expense._id, req.body)
    res.json(expense)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const remove = async (req, res) => {
  try {
    let expense = req.expense
    await Expense.remove(expense._id)
    res.json(expense)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const hasAuthorization = (req, res, next) => {
  const authorized = req.expense && req.auth && req.expense.recorded_by._id == req.auth._id
  if (!(authorized)) {
    return res.status('403').json({
      error: "User is not authorized"
    })
  }
  next()
}

export default {
    create,
    expenseByID,
    read,
    currentMonthPreview,
    expenseByCategory,
    averageCategories,
    yearlyExpenses,
    plotExpenses,
    listByUser,
    remove,
    update,
    hasAuthorization
}
