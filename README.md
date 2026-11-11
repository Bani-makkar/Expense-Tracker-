# Expense Tracker (React + Node + Express + PostgreSQL)

A full-stack expense tracking app with user accounts and data visualisation. Users sign up, record expenses, and see where their money goes through monthly, category and yearly charts.

This project is a **PostgreSQL port of the open-source [MERN Expense Tracker](https://github.com/shamahoque/mern-expense-tracker) by Shama Hoque** (from the book *Full-Stack React Projects*, MIT licensed). The MongoDB/Mongoose layer was replaced with PostgreSQL and plain SQL; the React client and REST API contract are unchanged.

<!-- Add 2-3 screenshots here: ![Dashboard](docs/dashboard.png) -->

## Features

- Sign up, sign in and sign out with JWT authentication
- Add, edit and delete expenses (title, category, amount, date, notes)
- Overview of spending: this month, today and yesterday
- Category comparison: current month vs. your average monthly spend
- Reports with [Victory](https://formidable.com/open-source/victory/) charts: category pie, monthly scatter plot, yearly bar chart
- Profile editing and account deletion
- Server-side rendering of the React app

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 16, React Router, Material-UI, Victory |
| Backend | Node.js, Express |
| Database | PostgreSQL via [node-postgres (`pg`)](https://node-postgres.com/) |
| Auth | JSON Web Tokens (`jsonwebtoken`, `express-jwt`) |
| Build | Webpack 4, Babel |

## What changed from MongoDB to PostgreSQL

- Mongoose models replaced by data-access modules with parameterised SQL (no string-built queries)
- Relational schema with a foreign key from `expenses.recorded_by` to `users.id` (`ON DELETE CASCADE`), a `CHECK (amount >= 0)` constraint and an index on `(recorded_by, incurred_on)`
- MongoDB aggregation pipelines (`$facet`, `$group`, `$project`) rewritten as SQL using `GROUP BY`, CTEs and `FILTER`
- `NUMERIC` amounts parsed to JavaScript numbers so the client can do arithmetic on them
- Tables are created automatically on server start

## Getting started

### Prerequisites

- Node.js (13.12.0 per `package.json`; on Node 17+ set `NODE_OPTIONS=--openssl-legacy-provider` because of webpack 4)
- npm or yarn
- PostgreSQL 12 or newer

### Setup

```bash
# 1. Start PostgreSQL (Docker option) or create a database yourself
docker compose up -d          # or: createdb expense_tracker

# 2. Install dependencies
npm install                   # or: yarn

# 3. Run in development
npm run development           # or: yarn development
```

Open <http://localhost:3000>.

### Configuration

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/expense_tracker` | Full connection string |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | see above | Used when `DATABASE_URL` is not set |
| `DATABASE_SSL` | `false` | Set to `true` for hosted databases that require SSL |
| `JWT_SECRET` | `YOUR_secret_key` | **Change this in any real deployment** |
| `PORT` | `3000` | Server port |

### Production build

```bash
npm run build
npm start
```

(Before building for production, comment out the `devBundle` lines in `server/express.js`.)

## Database schema

```sql
users    (id, name, email UNIQUE, hashed_password, salt, updated, created)
expenses (id, title, category, amount NUMERIC(12,2) CHECK >= 0, incurred_on,
          notes, updated, created, recorded_by -> users.id)
```

The full DDL is in [`db/schema.sql`](db/schema.sql).

## REST API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users` | No | Create an account |
| GET | `/api/users` | No | List users |
| GET / PUT / DELETE | `/api/users/:userId` | JWT (owner for PUT/DELETE) | Read, update or delete a user |
| POST | `/auth/signin` | No | Sign in, returns a JWT |
| GET | `/auth/signout` | No | Sign out |
| POST | `/api/expenses` | JWT | Record an expense |
| GET | `/api/expenses?firstDay=&lastDay=` | JWT | List your expenses in a date range |
| PUT / DELETE | `/api/expenses/:expenseId` | JWT (owner) | Update or delete an expense |
| GET | `/api/expenses/current/preview` | JWT | Month / today / yesterday totals |
| GET | `/api/expenses/by/category` | JWT | Average vs. current-month spend per category |
| GET | `/api/expenses/category/averages?firstDay=&lastDay=` | JWT | Category totals for a range |
| GET | `/api/expenses/yearly?year=` | JWT | Monthly totals for a year |
| GET | `/api/expenses/plot?month=` | JWT | Daily expense points for a month |

Send the token as `Authorization: Bearer <token>`.

## Project structure

```text
client/    React app (auth, core, expense, report, user)
server/
  controllers/   request handling
  models/        SQL data access (user, expense)
  db/            connection pool, schema, init
  routes/        Express routers
config/    environment-based configuration
db/        standalone schema.sql
```

## Known limitations

- Passwords are hashed with salted HMAC-SHA1 (inherited from the original); use bcrypt/scrypt for real deployments
- No automated tests yet
- Existing MongoDB data is not migrated

## Credits and license

Original application by [Shama Hoque](https://github.com/shamahoque) (MIT). PostgreSQL port by [your name]. Released under the MIT License, see `LICENSE.md`.
