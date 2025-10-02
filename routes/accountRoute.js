// routes/accountRoute.js
const express = require("express")
const router = new express.Router()

const utilities = require("../utilities")
const accountController = require("../controllers/accountController")
const regValidate = require("../utilities/account-validation")

// --- Auth views
router.get("/login",    utilities.handleErrors(accountController.buildLogin))
router.get("/register", utilities.handleErrors(accountController.buildRegister))

// --- Account management (protected)
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
)

// --- Registration
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

// --- Login
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// --- Update Account (Task 4–5)
// Form view
router.get(
  "/update/:accountId",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildUpdateAccount)
)

// Update names/email (with server-side validation)
router.post(
  "/update",
  utilities.checkLogin,
  regValidate.updateAccountRules(),     
  regValidate.checkUpdateAccountData,   
  utilities.handleErrors(accountController.updateAccount)
)

// Update password (separate form, with validation)
router.post(
  "/update-password",
  utilities.checkLogin,
  regValidate.updatePasswordRules(),    
  regValidate.checkUpdatePasswordData,  
  utilities.handleErrors(accountController.updatePassword)
)

router.get(
  "/login",
  (req, res, next) => {
    if (res.locals.loggedin) return res.redirect("/account")
    next()
  },
  utilities.handleErrors(accountController.buildLogin)
)

router.get("/logout", utilities.handleErrors(accountController.logout))
module.exports = router
