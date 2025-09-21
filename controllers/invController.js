const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

/* ***************************
 *  Build single inventory item view
 * ************************** */
invCont.buildByInvId = async function (req, res, next) {
  try {
    const invId = parseInt(req.params.invId, 10)
    if (Number.isNaN(invId)) return res.status(400).send("Invalid vehicle id")

    // Trae el vehículo específico
    const vehicle = await invModel.getVehicleByInvId(invId)
    const nav = await utilities.getNav()

    if (!vehicle) {
      return res.status(404).render("./inventory/detail", {
        title: "Vehicle not found",
        nav,
        itemDetail: '<p class="notice">Sorry, that vehicle was not found.</p>',
      })
    }

    const itemDetail = await utilities.buildItemDetail(vehicle)
    const title = `${vehicle.inv_make} ${vehicle.inv_model}`

    res.render("./inventory/detail", { title, nav, itemDetail })
  } catch (err) {
    next(err)
  }
}

module.exports = invCont