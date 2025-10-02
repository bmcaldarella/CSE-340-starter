// controllers/invController.js
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")

const invCont = {}

/* =========================
 * Management view (Task 1)
 * ========================= */
invCont.buildManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const classificationSelect = await utilities.buildClassificationList()
    res.render("inventory/management", {
      title: "Inventory Management",
      nav,
      messages: req.flash("notice"),
      classificationSelect,
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
 * ======================================================= */
invCont.buildByClassificationId = async function (req, res, next) {
  try {
    const classification_id = req.params.classificationId
    const result = await invModel.getInventoryByClassificationId(classification_id)
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
 * Build single inventory item view
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

/* =========================
 * JSON: inventory por classificationId
 * ========================= */
invCont.getInventoryJSON = async function (req, res, next) {
  try {
    const classification_id = parseInt(req.params.classification_id, 10)
    if (Number.isNaN(classification_id)) {
      return res.status(400).json({ error: "Invalid classification id" })
    }
    const result = await invModel.getInventoryByClassificationId(classification_id)
    const rows = Array.isArray(result) ? result : result?.rows || []
    return res.json(rows)
  } catch (err) {
    next(err)
  }
}

/* =========================
 * Edit Inventory - GET (present edit view)
 * ========================= */
invCont.buildEditInventory = async function (req, res, next) {
  try {
    const { inv_id } = req.params
    const nav = await utilities.getNav()

    const vehicle = await invModel.getVehicleByInvId(Number(inv_id))
    if (!vehicle) {
      req.flash("notice", "Vehicle not found.")
      return res.redirect("/inv/")
    }

    const classificationSelect = await utilities.buildClassificationList(vehicle.classification_id)

    return res.render("inventory/edit-inventory", {
      title: `Edit ${vehicle.inv_make} ${vehicle.inv_model}`,
      nav,
      messages: req.flash("notice"),
      errors: null,
      classificationSelect,
      // Sticky
      inv_id: vehicle.inv_id,
      inv_make: vehicle.inv_make,
      inv_model: vehicle.inv_model,
      inv_year: vehicle.inv_year,
      inv_description: vehicle.inv_description,
      inv_image: vehicle.inv_image,
      inv_thumbnail: vehicle.inv_thumbnail,
      inv_price: vehicle.inv_price,
      inv_miles: vehicle.inv_miles,
      inv_color: vehicle.inv_color,
      classification_id: vehicle.classification_id,
    })
  } catch (err) {
    next(err)
  }
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const {
      inv_id,
      inv_make,
      inv_model,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_year,
      inv_miles,
      inv_color,
      classification_id,
    } = req.body

    const payload = {
      inv_id: parseInt(inv_id, 10),
      inv_make: inv_make?.trim(),
      inv_model: inv_model?.trim(),
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price: Number(inv_price),
      inv_year: parseInt(inv_year, 10),
      inv_miles: Number(inv_miles),
      inv_color: inv_color?.trim(),
      classification_id: parseInt(classification_id, 10),
    }

    let updateResult
    if (invModel.updateInventory.length >= 11) {
      updateResult = await invModel.updateInventory(
        payload.inv_id,
        payload.inv_make,
        payload.inv_model,
        payload.inv_description,
        payload.inv_image,
        payload.inv_thumbnail,
        payload.inv_price,
        payload.inv_year,
        payload.inv_miles,
        payload.inv_color,
        payload.classification_id
      )
    } else {
      updateResult = await invModel.updateInventory(payload)
    }

    const updatedRow = Array.isArray(updateResult)
      ? updateResult[0]
      : updateResult?.rows?.[0] ?? updateResult

    if (updatedRow || updateResult === true) {
      const itemName = `${updatedRow?.inv_make ?? inv_make} ${updatedRow?.inv_model ?? inv_model}`.trim()
      req.flash("notice", `The ${itemName} was successfully updated.`)
      return res.redirect("/inv/")
    }

    req.flash("notice", "Sorry, the update failed.")
    const classificationSelect = await utilities.buildClassificationList(payload.classification_id)
    const itemName = `${payload.inv_make ?? ""} ${payload.inv_model ?? ""}`.trim()
    return res.status(501).render("inventory/edit-inventory", {
      title: `Edit ${itemName}`,
      nav,
      classificationSelect,
      errors: null,
      ...payload,
    })
  } catch (err) {
    next(err)
  }
}

/* =========================
 * Delete Inventory - GET (confirm view)
 * ========================= */
invCont.buildDeleteInventory = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.params.inv_id, 10)
    if (Number.isNaN(inv_id)) {
      req.flash("notice", "Invalid vehicle id.")
      return res.redirect("/inv")
    }

    const nav = await utilities.getNav()
    const vehicle = await invModel.getVehicleByInvId(inv_id)
    if (!vehicle) {
      req.flash("notice", "Vehicle not found.")
      return res.redirect("/inv")
    }

    const itemName = `${vehicle.inv_make} ${vehicle.inv_model}`
    return res.render("inventory/delete-confirm", {
      title: `Delete ${itemName}`,
      nav,
      errors: null,
      inv_id: vehicle.inv_id,
      inv_make: vehicle.inv_make,
      inv_model: vehicle.inv_model,
      inv_year: vehicle.inv_year,
      inv_price: vehicle.inv_price,
    })
  } catch (err) {
    next(err)
  }
}

/* =========================
 * Delete Inventory - POST (execute)
 * ========================= */
invCont.deleteInventory = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.body.inv_id, 10)
    if (Number.isNaN(inv_id)) {
      req.flash("notice", "Invalid vehicle id.")
      return res.redirect("/inv")
    }

    const result = await invModel.deleteInventoryItem(inv_id)
    const ok =
      typeof result === "number"
        ? result === 1
        : result?.rowCount === 1 || result === true

    if (ok) {
      req.flash("notice", "The inventory item was deleted successfully.")
      return res.redirect("/inv")
    }

    req.flash("notice", "Delete failed. Please try again.")
    return res.redirect(`/inv/delete/${inv_id}`)
  } catch (err) {
    next(err)
  }
}

module.exports = invCont
