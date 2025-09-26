// utilities/inv-validation.js
const { body, validationResult } = require("express-validator")
const Utilities = require(".")

const invValidate = {}

/* ===== Rules: Classification ===== */
invValidate.classificationRules = () => [
  body("classification_name")
    .trim()
    .notEmpty().withMessage("Classification name is required.")
    .matches(/^[A-Za-z0-9]+$/).withMessage("No spaces or special characters allowed.")
]

/* ===== Check classification ===== */
invValidate.checkClassificationData = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await Utilities.getNav()
    return res.status(400).render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors,
    })
  }
  next()
}

/* ===== Rules: Inventory ===== */
invValidate.inventoryRules = () => [
  body("inv_make").trim().notEmpty().withMessage("Make is required."),
  body("inv_model").trim().notEmpty().withMessage("Model is required."),
  body("inv_year").trim().isInt({ min: 1900, max: 2100 }).withMessage("Year must be valid."),
  body("inv_description").trim().notEmpty().withMessage("Description is required."),
  body("inv_image").trim().notEmpty().withMessage("Image path is required."),
  body("inv_thumbnail").trim().notEmpty().withMessage("Thumbnail path is required."),
  body("inv_price").trim().isFloat({ gt: 0 }).withMessage("Price must be positive."),
  body("inv_miles").trim().isInt({ min: 0 }).withMessage("Miles must be 0 or greater."),
  body("inv_color").trim().notEmpty().withMessage("Color is required."),
  body("classification_id").trim().isInt({ gt: 0 }).withMessage("Choose a classification."),
]

/* ===== Check inventory ===== */
invValidate.checkInventoryData = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await Utilities.getNav()
    const classificationSelect = await Utilities.buildClassificationList(req.body.classification_id)
    return res.status(400).render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      errors,
      classificationSelect,
      ...req.body, // sticky
    })
  }
  next()
}

module.exports = invValidate
