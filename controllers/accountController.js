const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res) {
  const nav = await utilities.getNav()
  res.render("account/login", { title: "Login", nav, errors: null })
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res) {
  const nav = await utilities.getNav()
  res.render("account/register", { title: "Register", nav, errors: null })
}

/* ****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res) {
  const nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  let hashedPassword
  try {
    hashedPassword = bcrypt.hashSync(account_password, 10)
  } catch (error) {
    req.flash("notice", "Sorry, there was an error processing the registration.")
    return res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    })
  }

  try {
    const ok = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    )
    if (ok) {
      req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`)
      return res.status(201).render("account/login", { title: "Login", nav, errors: null })
    }
    req.flash("notice", "Sorry, the registration failed.")
    return res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    })
  } catch (err) {
    req.flash("notice", "Unexpected error. Please try again.")
    return res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
    })
  }
}

/* ****************************************
 *  Process Login
 * *************************************** */
async function accountLogin(req, res, next) {
  const nav = await utilities.getNav()
  const { account_email, account_password } = req.body

  try {
    const accountData = await accountModel.getAccountByEmail(account_email)
    if (!accountData) {
      req.flash("notice", "Invalid email or password.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    const ok = await bcrypt.compare(account_password, accountData.account_password)
    if (!ok) {
      req.flash("notice", "Invalid email or password.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    // no password in the token
    delete accountData.account_password

    const isProd = process.env.NODE_ENV === "production"
    const token = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })

    // set cookie (path=/ para poder limpiarla luego)
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1h
      path: "/",
    })

    req.session.account = {
      account_id: accountData.account_id,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_type: accountData.account_type,
    }

    req.flash("notice", `Welcome back, ${accountData.account_firstname}!`)
    return res.redirect("/account/")
  } catch (err) {
    return next(err)
  }
}

/* ****************************************
 *  Account Management View
 * *************************************** */
async function buildAccountManagement(req, res) {
  const nav = await utilities.getNav()
  return res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
    messages: req.flash("notice"),
    account: res.locals.accountData || null,
  })
}

/* ****************************************
 *  Deliver Update Account view (prefilled)
 * *************************************** */
async function buildUpdateAccount(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const paramId = parseInt(req.params.accountId, 10)
    const me = res.locals.accountData
    const isAdmin = me?.account_type === "Admin"

    if (!isAdmin && me?.account_id !== paramId) {
      req.flash("notice", "You can only update your own account.")
      return res.redirect("/account")
    }

    const acct = await accountModel.getAccountById(paramId)
    if (!acct) {
      req.flash("notice", "Account not found.")
      return res.redirect("/account")
    }

    return res.render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account: {
        account_id: acct.account_id,
        account_firstname: acct.account_firstname,
        account_lastname: acct.account_lastname,
        account_email: acct.account_email,
      },
    })
  } catch (e) {
    next(e)
  }
}

/* ****************************************
 *  Process Update Account (names/email)
 * *************************************** */
async function updateAccount(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const { account_id, account_firstname, account_lastname, account_email } = req.body

    const payload = {
      account_id: parseInt(account_id, 10),
      account_firstname: (account_firstname || "").trim(),
      account_lastname: (account_lastname || "").trim(),
      account_email: (account_email || "").trim().toLowerCase(),
    }

    let updated
    try {
      updated = await accountModel.updateAccount(payload)
    } catch (err) {
      // unique_violation (Postgres)
      if (err && err.code === "23505") {
        req.flash("notice", "That email is already in use.")
        return res.status(400).render("account/update", {
          title: "Update Account",
          nav,
          errors: null,
          account: payload,
        })
      }
      throw err
    }

    if (!updated) {
      req.flash("notice", "Update failed. Please try again.")
      return res.status(400).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account: payload,
      })
    }

    const currentType = res.locals.accountData?.account_type || updated.account_type || "Client"
    const newPayload = {
      account_id: updated.account_id,
      account_firstname: updated.account_firstname,
      account_lastname: updated.account_lastname,
      account_email: updated.account_email,
      account_type: currentType,
    }
    const isProd = process.env.NODE_ENV === "production"
    const token = jwt.sign(newPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    })

    req.flash("notice", "Account updated successfully.")
    return res.redirect("/account")
  } catch (e) {
    next(e)
  }
}

/* ****************************************
 *  Process Password Change
 * *************************************** */
async function updatePassword(req, res, next) {
  try {
    const { account_id, account_password } = req.body
    const id = parseInt(account_id, 10)

    const hash = bcrypt.hashSync(account_password, 10)
    const ok = await accountModel.updatePassword(id, hash)

    if (!ok) {
      req.flash("notice", "Password update failed. Please try again.")
      return res.redirect(`/account/update/${id}`)
    }

    req.flash("notice", "Password updated successfully.")
    return res.redirect("/account")
  } catch (e) {
    next(e)
  }
}

/* ****************************************
 *  Logout 
 * *************************************** */
function logout(req, res) {
  const isProd = process.env.NODE_ENV === "production"

  
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/", 
  })

  if (req.session) {
    delete req.session.account
  }

  req.flash("notice", "You have been logged out.")
  return res.redirect("/")
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  buildUpdateAccount,
  updateAccount,
  updatePassword,
  logout,
}
