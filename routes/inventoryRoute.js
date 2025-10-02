const express = require("express")
const router = express.Router()

const invController = require("../controllers/invController")
const invValidate = require("../utilities/inv-validation")
const asyncHandler = require("../utilities/asyncHandler")
const utilities = require("../utilities") 

// ===== Public (no auth): classification list & detail
router.get("/type/:classificationId", asyncHandler(invController.buildByClassificationId))
router.get("/detail/:invId", asyncHandler(invController.buildByInvId))

// ===== Admin-only (Employee/Admin): Management
router.get(
  "/",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.buildManagement)
)

// ===== Admin-only: Add Classification
router.get(
  "/add-classification",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.buildAddClassification)
)
router.post(
  "/add-classification",
  utilities.requireEmployeeOrAdmin,
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  asyncHandler(invController.createClassification)
)

// ===== Admin-only: Add Inventory
router.get(
  "/add-inventory",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.buildAddInventory)
)
router.post(
  "/add-inventory",
  utilities.requireEmployeeOrAdmin,
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  asyncHandler(invController.createInventory)
)

// ===== Admin-only: JSON for Management table
router.get(
  "/getInventory/:classification_id",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.getInventoryJSON)
)

// ===== Admin-only: Edit Inventory
router.get(
  "/edit/:inv_id",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.buildEditInventory)
)

// ===== Admin-only: Update Inventory
router.post(
  "/update",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.updateInventory)
)

// ===== Admin-only: Delete Inventory (confirm + execute)
router.get(
  "/delete/:inv_id",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.buildDeleteInventory)
)
router.post(
  "/delete",
  utilities.requireEmployeeOrAdmin,
  asyncHandler(invController.deleteInventory)
)

module.exports = router
