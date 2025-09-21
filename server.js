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
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute");

const app = express()
const staticRoutes = require("./routes/static")

const errorRoute = require("./routes/errorRoute")
app.use("/error", errorRoute) // -> /error/cause



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

app.get("/", baseController.buildHome) // route for the home page
app.use("/inv", inventoryRoute)
const asyncHandler = require("./utilities/asyncHandler")
app.get("/", asyncHandler(baseController.buildHome))


const utilities = require("./utilities/")

// 404 Not Found
app.use(async (req, res, next) => {
  const nav = await utilities.getNav()
  res.status(404).render("errors/404", {
    title: "404 Not Found",
    nav,
    message: "Sorry, we couldn't find that page.",
     layout: "layouts/layout"
  })
})

// 500 Error Handler (centralizado)
app.use(async (err, req, res, next) => {
  console.error("🔥 Unhandled error:", err.stack || err)

  let nav = ""
  try {
    nav = await utilities.getNav() 
  } catch (e) {
    nav = '<ul class="error-page"><li><a href="/" title="Home.  page">Home</a></li></ul>'
  }

  if (res.headersSent) {
    return next(err)
  }

  res.status(500).render("errors/500", {
    title: "Server Error",
    nav,
    message: "Something went wrong on our side.",
    layout: "layouts/layout" 
  })
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


