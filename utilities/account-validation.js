// utilities/account-validation.js
const utilities = require("./index")
const { body, validationResult } = require("express-validator")
const accountModel = require("../models/account-model")

const validate = {}

/* ========== REGISTER ========== */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim().escape().notEmpty().isLength({ min: 1 })
      .withMessage("Please provide a first name."),
    body("account_lastname")
      .trim().escape().notEmpty().isLength({ min: 2 })
      .withMessage("Please provide a last name."),
    body("account_email")
      .trim().isEmail().withMessage("A valid email is required.")
      .normalizeEmail()
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists) {
          throw new Error("Email exists. Please log in or use different email")
        }
      }),
    body("account_password")
      .trim().notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ]
}

validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav()
    return res.status(400).render("account/register", {
      title: "Registration",
      nav,
      errors, 
      account_firstname,
      account_lastname,
      account_email,
    })
  }
  next()
}

/* ========== LOGIN ========== */
validate.loginRules = () => {
  return [
    body("account_email")
      .trim().isEmail().withMessage("Please enter a valid email.")
      .normalizeEmail(),
    body("account_password")
      .trim().notEmpty().withMessage("Please provide your password."),
  ]
}

validate.checkLoginData = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav()
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors, 
      account_email: req.body.account_email,
    })
  }
  next()
}

/* ========== UPDATE ACCOUNT (names/email) ========== */
validate.updateAccountRules = () => {
  return [
    body("account_firstname")
      .trim().notEmpty().isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters."),
    body("account_lastname")
      .trim().notEmpty().isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters."),
    body("account_email")
      .trim().isEmail().withMessage("A valid email is required.")
      .custom(async (value, { req }) => {
        const email = value.toLowerCase()
        const existing = await accountModel.getAccountByEmail(email)
        const currentId = parseInt(req.body.account_id, 10)
        if (existing && existing.account_id !== currentId) {
          throw new Error("Email already in use.")
        }
        return true
      }),
    body("account_id").toInt().isInt({ min: 1 }).withMessage("Invalid account id."),
  ]
}

validate.checkUpdateAccountData = async (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()

  const nav = await utilities.getNav()
  const account = {
    account_id: req.body.account_id,
    account_firstname: req.body.account_firstname,
    account_lastname: req.body.account_lastname,
    account_email: req.body.account_email,
  }
  return res.status(400).render("account/update", {
    title: "Update Account",
    nav,
    errors: errors.array(), 
    account,
  })
}

/* ========== UPDATE PASSWORD ========== */
validate.updatePasswordRules = () => {
  return [
    body("account_id").toInt().isInt({ min: 1 }).withMessage("Invalid account id."),
    body("account_password")
      .isString().withMessage("Password is required.")
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password must be 12+ chars and include upper, lower, number, and special character."),
  ]
}

validate.checkUpdatePasswordData = async (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()

  const nav = await utilities.getNav()
  const id = parseInt(req.body.account_id, 10)
  const current = await accountModel.getAccountById(id)

  return res.status(400).render("account/update", {
    title: "Update Account",
    nav,
    errors: errors.array(), 
    account: {
      account_id: current?.account_id || id,
      account_firstname: current?.account_firstname || "",
      account_lastname: current?.account_lastname || "",
      account_email: current?.account_email || "",
    },
  })
}

module.exports = validate
