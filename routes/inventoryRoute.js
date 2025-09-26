// routes/inventoryRoute.js
// Needed Resources
const express = require("express")
const router = express.Router()

const invController = require("../controllers/invController")
const invValidate = require("../utilities/inv-validation")
const asyncHandler = require("../utilities/asyncHandler")

// ===== Management (Task 1)
router.get("/", asyncHandler(invController.buildManagement))

// ===== Add Classification (Task 2)
router.get("/add-classification", asyncHandler(invController.buildAddClassification))
router.post(
  "/add-classification",
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  asyncHandler(invController.createClassification)
)

// ===== Add Inventory (Task 3)
router.get("/add-inventory", asyncHandler(invController.buildAddInventory))
router.post(
  "/add-inventory",
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  asyncHandler(invController.createInventory)
)

// ===== Existing views by classification / detail
router.get("/type/:classificationId", asyncHandler(invController.buildByClassificationId))
router.get("/detail/:invId", asyncHandler(invController.buildByInvId))

module.exports = router
