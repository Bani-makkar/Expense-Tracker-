# MERN Expense Tracker

An expense tracking application with data visualization - developed using React, Node, Express, PostgreSQL and Victory.

> This is a PostgreSQL port of the original MERN expense tracker: Mongoose/MongoDB has been replaced by [node-postgres (`pg`)](https://node-postgres.com/) with plain SQL.

![MERN Expense Tracker](https://mernbook.s3.amazonaws.com/git+/expensetracker.png "MERN Expense Tracker")

![MERN Expense Tracker Graphs](https://mernbook.s3.amazonaws.com/git+/graphs.png "MERN Expense Tracker Graphs")
<!-- ### [Live Demo](http://skeleton.mernbook.com/ "MERN Skeleton") -->

#### What you need to run this code
1. Node (13.12.0)
2. NPM (6.14.4)
3. PostgreSQL (12 or newer; developed and tested against 16)

> Node 17+ users: webpack 4 needs `NODE_OPTIONS=--openssl-legacy-provider` (e.g. `NODE_OPTIONS=--openssl-legacy-provider npm run development`).

####  How to run this code
1. Make sure PostgreSQL is running and a database exists. Either use your own, or start one with Docker:
   ```
   docker compose up -d
   ```
   (or `createdb expense_tracker` on a local install)
2. Configure the connection (optional if you use the defaults below). Either set `DATABASE_URL`:
   ```
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expense_tracker
   ```
   or the standard `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` variables. Set `DATABASE_SSL=true` for hosted databases that require SSL.
3. Clone this repository
4. Open command line in the cloned folder,
   - To install dependencies, run ```  npm install  ``` or ``` yarn ```
   - To run the application for development, run ```  npm run development  ``` or ``` yarn development ```
5. Open [localhost:3000](http://localhost:3000/) in the browser

The `users` and `expenses` tables are created automatically on server start. The same schema is available in [`db/schema.sql`](db/schema.sql) if you prefer to apply it yourself.

#### Database layout
- `users` (`id`, `name`, `email` unique, `hashed_password`, `salt`, `updated`, `created`)
- `expenses` (`id`, `title`, `category`, `amount`, `incurred_on`, `notes`, `updated`, `created`, `recorded_by` -> `users.id`, deleting a user also deletes their expenses)

The REST API and its JSON responses are unchanged (ids are still returned as `_id`), so the React client works as before. Existing MongoDB data is not migrated.

### More applications built using this stack

* [MERN Skeleton](https://github.com/shamahoque/mern-social/tree/second-edition)
* [MERN Social](https://github.com/shamahoque/mern-social/tree/second-edition)
* [MERN Classroom](https://github.com/shamahoque/mern-classroom)
* [MERN Marketplace](https://github.com/shamahoque/mern-marketplace/tree/second-edition)
* [MERN Mediastream](https://github.com/shamahoque/mern-mediastream/tree/second-edition)
* [MERN VR Game](https://github.com/shamahoque/mern-vrgame/tree/second-edition)

Learn more at [mernbook.com](http://www.mernbook.com/)

----
## Get the book
#### [Full-Stack React Projects - Second Edition](https://www.packtpub.com/web-development/full-stack-react-projects-second-edition)
*Learn MERN stack development by building modern web apps using MongoDB, Express, React, and Node.js*

<a href="https://www.packtpub.com/web-development/full-stack-react-projects-second-edition"><img src="https://mernbook.s3.amazonaws.com/git+/Book_2Ed.jpg" align="center" width="400" alt="Full-Stack React Projects"></a>

React combined with industry-tested, server-side technologies, such as Node, Express, and MongoDB, enables you to develop and deploy robust real-world full-stack web apps. This updated second edition focuses on the latest versions and conventions of the technologies in this stack, along with their new features such as Hooks in React and async/await in JavaScript. The book also explores advanced topics such as implementing real-time bidding, a web-based classroom app, and data visualization in an expense tracking app.

Full-Stack React Projects will take you through the process of preparing the development environment for MERN stack-based web development, creating a basic skeleton app, and extending it to build six different web apps. You'll build apps for social media, classrooms, media streaming, online marketplaces with real-time bidding, and web-based games with virtual reality features. Throughout the book, you'll learn how MERN stack web development works, extend its capabilities for complex features, and gain actionable insights into creating MERN-based apps, along with exploring industry best practices to meet the ever-increasing demands of the real world.

Things you'll learn in this book:

- Extend a MERN-based application to build a variety of applications
- Add real-time communication capabilities with Socket.IO
- Implement data visualization features for React applications using Victory
- Develop media streaming applications using MongoDB GridFS
- Improve SEO for your MERN apps by implementing server-side rendering with data
- Implement user authentication and authorization using JSON web tokens
- Set up and use React 360 to develop user interfaces with VR capabilities
- Make your MERN stack applications reliable and scalable with industry best practices

If you feel this book is for you, get your [copy](https://www.amazon.com/dp/1839215410) today!

---
