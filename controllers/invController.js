const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* =========================
 * Management view (Task 1)
 * ========================= */
invCont.buildManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    res.render("inventory/management", {
      title: "Inventory Management",
      nav,
      messages: req.flash("notice"),
    })
  } catch (err) {
    next(err)
  }
}

/* =========================
 * Add Classification - GET (Task 2)
 * ========================= */
invCont.buildAddClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: null,
    })
  } catch (err) {
    next(err)
  }
}

/* =========================
 * Add Classification - POST (Task 2)
 * ========================= */
invCont.createClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const { classification_name } = req.body

    const ok = await invModel.addClassification(classification_name)
    if (ok) {
      req.flash("notice", "Classification created successfully.")
      const nav2 = await utilities.getNav() 
      return res.status(201).render("inventory/management", {
        title: "Inventory Management",
        nav: nav2,
        messages: req.flash("notice"),
      })
    }

    req.flash("notice", "Failed to create classification.")
    return res.status(500).render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: null,
    })
  } catch (err) {
    next(err)
  }
}

/* =========================
 * Add Inventory - GET (Task 3)
 * ========================= */
invCont.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const classificationSelect = await utilities.buildClassificationList()
    res.render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      errors: null,
      classificationSelect,
      inv_make: "",
      inv_model: "",
      inv_year: "",
      inv_description: "",
      inv_image: "/images/vehicles/no-image.png",
      inv_thumbnail: "/images/vehicles/no-image-tn.png",
      inv_price: "",
      inv_miles: "",
      inv_color: "",
      classification_id: "",
    })
  } catch (err) {
    next(err)
  }
}

/* =========================
 * Add Inventory - POST (Task 3)
 * ========================= */
invCont.createInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const payload = { ...req.body }

    const ok = await invModel.addInventory(payload)
    if (ok) {
      req.flash("notice", "Inventory item created successfully.")
      const nav2 = await utilities.getNav()
      return res.status(201).render("inventory/management", {
        title: "Inventory Management",
        nav: nav2,
        messages: req.flash("notice"),
      })
    }

    req.flash("notice", "Failed to create inventory item.")
    const classificationSelect = await utilities.buildClassificationList(payload.classification_id)
    return res.status(500).render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      errors: null,
      classificationSelect,
      ...payload, // sticky
    })
  } catch (err) {
    next(err)
  }
}

/* =======================================================
 * Build inventory by classification view 
 *  
 * ======================================================= */
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId
    const result = await invModel.getInventoryByClassificationId(classification_id)
    // soporta invModel que devuelva { rows } o un array
    const rows = Array.isArray(result) ? result : result?.rows || []
    const nav = await utilities.getNav()

    if (!rows.length) {
      return res.render("inventory/classification", {
        title: "No vehicles found",
        nav,
        grid: '<p class="notice">No vehicles in this classification.</p>',
      })
    }

    const grid = await utilities.buildClassificationGrid(rows)
    const className = rows[0].classification_name
    res.render("inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    })
  } catch (err) {
    next(err)
  }
}

/* ==============================================
 * Build single inventory item view (mejorado)
 * ============================================== */
invCont.buildByInvId = async function (req, res, next) {
  try {
    const invId = parseInt(req.params.invId, 10)
    if (Number.isNaN(invId)) return res.status(400).send("Invalid vehicle id")

    const vehicle = await invModel.getVehicleByInvId(invId)
    const nav = await utilities.getNav()

    if (!vehicle) {
      return res.status(404).render("inventory/detail", {
        title: "Vehicle not found",
        nav,
        itemDetail: '<p class="notice">Sorry, that vehicle was not found.</p>',
      })
    }

    const itemDetail = await utilities.buildItemDetail(vehicle)
    const title = `${vehicle.inv_make} ${vehicle.inv_model}`
    res.render("inventory/detail", { title, nav, itemDetail })
  } catch (err) {
    next(err)
  }
}

module.exports = invCont
