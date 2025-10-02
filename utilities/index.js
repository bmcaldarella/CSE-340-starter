// utilities/index.js
const invModel = require("../models/inventory-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const Util = {}

/* ************************
 * Build the nav UL
 ************************** */
Util.getNav = async function () {
  const data = await invModel.getClassifications() 
  const list = [
    "<ul>",
    '<li><a href="/" title="Home page">Home</a></li>',
    ...data.map(
      (row) =>
        `<li><a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">${row.classification_name}</a></li>`
    ),
    "</ul>",
  ].join("")
  return list
}

/* **************************************
 * Build classification grid HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  if (Array.isArray(data) && data.length > 0) {
    const items = data
      .map(
        (vehicle) => `
      <li>
        <a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
          <img src="${vehicle.inv_thumbnail}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model} on CSE Motors" />
        </a>
        <div class="namePrice">
          <hr />
          <h2>
            <a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
              ${vehicle.inv_make} ${vehicle.inv_model}
            </a>
          </h2>
          <span>$${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</span>
        </div>
      </li>`
      )
      .join("")
    return `<ul id="inv-display">${items}</ul>`
  }
  return '<p class="notice">Sorry, no matching vehicles could be found.</p>'
}

/* **************************************
 * Build single item detail HTML
 * ************************************ */
Util.buildItemDetail = async function (vehicle) {
  const fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
  const fmtInt = new Intl.NumberFormat("en-US")
  const price = fmtUSD.format(vehicle.inv_price || 0)
  const miles = fmtInt.format(vehicle.inv_miles || 0)

  return `
  <section id="inv-detail" class="inv-detail">
    <figure class="inv-media">
      <img class="inv-photo" src="${vehicle.inv_image}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}">
    </figure>
    <div class="inv-info">
      <h2 class="inv-title">${vehicle.inv_make} ${vehicle.inv_model} (${vehicle.inv_year})</h2>
      <div class="price-row">
        <span class="price-label">Price</span>
        <span class="price-value">${price}</span>
      </div>
      <p class="desc">${vehicle.inv_description || ""}</p>
      <div class="specs">
        <div class="spec"><span class="spec-label">Mileage</span><span class="spec-value">${miles} mi</span></div>
        <div class="spec"><span class="spec-label">Year</span><span class="spec-value">${vehicle.inv_year}</span></div>
        <div class="spec"><span class="spec-label">Color</span><span class="spec-value">${vehicle.inv_color}</span></div>
        <div class="spec"><span class="spec-label">Class</span><span class="spec-value">${vehicle.classification_name}</span></div>
      </div>
    </div>
  </section>`
}

/* **************************************
 * Build classification <select>
 * ************************************ */
Util.buildClassificationList = async function (classification_id = null) {
  const data = await invModel.getClassifications() 
  const options =
    `<option value=''>Choose a Classification</option>` +
    data
      .map((row) => {
        const selected = classification_id != null && row.classification_id == classification_id ? " selected" : ""
        return `<option value="${row.classification_id}"${selected}>${row.classification_name}</option>`
      })
      .join("")
  return `<select name="classification_id" id="classificationList" required>${options}</select>`
}

/* **************************************
 * Async error wrapper
 * ************************************ */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/* ****************************************
 * JWT check:
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  res.locals.loggedin = 0
  res.locals.accountData = null

  const token = req.cookies?.jwt
  if (!token) return next()

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, accountData) => {
    if (err) {
      const isProd = process.env.NODE_ENV === "production"
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
      })
      return next()
    }
    res.locals.accountData = accountData
    res.locals.loggedin = 1
    next()
  })
}

/* ****************************************
 *  Require login
 * ************************************ */
Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) return next()
  req.flash("notice", "Please log in.")
  return res.redirect("/account/login")
}

/* ****************************************
 *  Require Employee/Admin 
 * ************************************ */
Util.requireEmployeeOrAdmin = async (req, res, next) => {
  try {
    const u = res.locals.accountData
    const ok = res.locals.loggedin && u && (u.account_type === "Employee" || u.account_type === "Admin")
    if (ok) return next()

    req.flash("notice", "You must be logged in as Employee or Admin to access that area.")
    const nav = await Util.getNav()
    return res.status(403).render("account/login", {
      title: "Login",
      nav,
      errors: null,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = Util
