/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const path = require("path")
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
require("dotenv").config()

const app = express()
const staticRoutes = require("./routes/static")

/* ***********************
 * Middleware
 *************************/
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")))

/* ***********************
 * View Engine and Layouts
 *************************/
app.set("views", path.join(__dirname, "views")) // root of all views
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "layouts/layout") // relative to /views

/* ***********************
 * Routes
 *************************/
app.use(staticRoutes)

app.get("/", (req, res) => {
  res.render("index", { title: "Home" })
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 3000
const host = process.env.HOST || "localhost"

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`)
})
