/* ******************************************
 * Primary server file: controls the project
 * CSE 340 — Inventory A4
 *******************************************/

require("dotenv").config()

/* ***********************
 * Require Statements
 *************************/
const path = require("path")
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const session = require("express-session")
const flash = require("connect-flash")
const pgSession = require("connect-pg-simple")(session)
const cookieParser = require("cookie-parser")

const pool = require("./database/") 
const utilities = require("./utilities/")

// Controllers & Routes
const asyncHandler = require("./utilities/asyncHandler")
const baseController = require("./controllers/baseController")
const staticRoutes = require("./routes/static")
const errorRoute = require("./routes/errorRoute")
const accountRoute = require("./routes/accountRoute")
const inventoryRoute = require("./routes/inventoryRoute")

/* ***********************
 * App
 *************************/
const app = express()

/* ***********************
 * Trust proxy (solo prod)
 *************************/
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1)
}

/* ***********************
 * Static files
 *************************/
app.use(express.static(path.join(__dirname, "public")))

/* ***********************
 * Body parsers
 *************************/
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

/* ***********************
 * Cookie Parser (antes de JWT/session)
 *************************/
app.use(cookieParser())

/* ***********************
 * View Engine and Layouts
 *************************/
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "layouts/layout")

/* ***********************
 * Session + Flash
 *************************/
app.use(
  session({
    store: new pgSession({
      pool,
      createTableIfMissing: true, 
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2, // 2 horas
      secure: process.env.NODE_ENV === "production", // solo secure en prod
    },
  })
)

app.use(flash())

/* ***********************
 * Flash → res.locals
 *************************/
app.use((req, res, next) => {
  const msgs = req.flash("notice") || []
  res.locals.messages = msgs
  res.locals.notice = msgs
  next()
})

/* ***********************
 * JWT Middleware
 *************************/
app.use(utilities.checkJWTToken)

/* ***********************
 * Routes
 *************************/
// Home
app.get("/", asyncHandler(baseController.buildHome))

// Auxiliares
app.use("/error", errorRoute)
app.use(staticRoutes)
app.use("/account", accountRoute)
app.use("/inv", inventoryRoute)

/* ***********************
 * 404 Not Found
 *************************/
app.use(async (req, res, next) => {
  const nav = await utilities.getNav()
  res.status(404).render("errors/404", {
    title: "404 Not Found",
    nav,
    message: "Sorry, we couldn't find that page.",
    layout: "layouts/layout",
  })
})

/* ***********************
 * 500 Error Handler (Global)
 *************************/
app.use(async (err, req, res, next) => {
  console.error("🔥 Unhandled error:", err.stack || err)
  let nav = ""
  try {
    nav = await utilities.getNav()
  } catch {
    nav = '<ul class="error-page"><li><a href="/" title="Home page">Home</a></li></ul>'
  }
  if (res.headersSent) return next(err)
  res.status(500).render("errors/500", {
    title: "Server Error",
    nav,
    message: "Something went wrong on our side.",
    layout: "layouts/layout",
  })
})

/* ***********************
 * Start Server
 *************************/
const port = process.env.PORT || 5500
const host = process.env.HOST || "localhost"

app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`)
})
