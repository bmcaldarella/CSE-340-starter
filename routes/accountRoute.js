// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const utilities = require("../utilities");
const accountController = require("../controllers/accountController");
const regValidate = require("../utilities/account-validation");

// GET /account/login
router.get(
  "/login",
  utilities.handleErrors(accountController.buildLogin)
);

// GET /account/register
router.get(
  "/register",
  utilities.handleErrors(accountController.buildRegister)
);

// POST /account/register  -> reglas -> check -> controlador
router.post(
  "/register",
  regValidate.registrationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

router.post(
  "/login",
  utilities.handleErrors(accountController.processLogin)
);


module.exports = router;
