// controllers/accountController.js
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
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  })
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
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    )

    if (regResult) {
      req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`)
      return res.status(201).render("account/login", { title: "Login", nav, errors: null })
    } else {
      req.flash("notice", "Sorry, the registration failed.")
      return res.status(501).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
      })
    }
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

    const isValid = await bcrypt.compare(account_password, accountData.account_password)
    if (!isValid) {
      req.flash("notice", "Invalid email or password.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    delete accountData.account_password

    const isProd = process.env.NODE_ENV === "production"
    const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })

    res.cookie("jwt", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, 
    })

    // Optional: mirror to session if you also use sessions
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

    // Security: only self can edit, unless Admin
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

    // Re-sign JWT so header/greeting reflect changes immediately
    const current = res.locals.accountData || {}
    const fresh = {
      account_id: updated.account_id,
      account_firstname: updated.account_firstname,
      account_lastname: updated.account_lastname,
      account_email: updated.account_email,
      account_type: current.account_type || updated.account_type || "Client",
    }
    const isProd = process.env.NODE_ENV === "production"
    const token = jwt.sign(fresh, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    })

    req.flash("notice", "Account updated successfully.")
    return res.redirect("/account")
  } catch (e) {
    next(e)
  }
}

/* ****************************************
 *  Logout
 * *************************************** */
function logout(req, res) {
  res.clearCookie("jwt")
  if (req.session) {
    req.session.destroy(() => {})
  }
  req.flash("notice", "You have been logged out.")
  return res.redirect("/")
}


async function buildUpdateAccount(req, res, next) {
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
}

async function updateAccount(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const { account_id, account_firstname, account_lastname, account_email } = req.body

    const payload = {
      account_id: parseInt(account_id, 10),
      account_firstname: account_firstname.trim(),
      account_lastname: account_lastname.trim(),
      account_email: account_email.trim().toLowerCase(),
    }

    const updated = await accountModel.updateAccount(payload)
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
    const tokenPayload = {
      account_id: updated.account_id,
      account_firstname: updated.account_firstname,
      account_lastname: updated.account_lastname,
      account_email: updated.account_email,
      account_type: currentType,
    }
    const isProd = process.env.NODE_ENV === "production"
    const token = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    })

    req.flash("notice", "Account updated successfully.")
    return res.redirect("/account")
  } catch (e) {
    next(e)
  }
}

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

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  logout,
  buildUpdateAccount,
  updateAccount,
  updatePassword,
}


