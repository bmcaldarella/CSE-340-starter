const express = require("express")
const router = express.Router()
const favCtrl = require("../controllers/favoriteController")

router.get("/", favCtrl.list) 
router.post("/:inv_id", favCtrl.add) 
router.post("/:inv_id/remove", favCtrl.remove) 

module.exports = router
