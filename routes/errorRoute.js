const express = require("express")
const router = new express.Router()
const errorController = require("../controllers/errorController")
const asyncHandler = require("../utilities/asyncHandler")

router.get("/cause", asyncHandler(errorController.cause500))

module.exports = router
