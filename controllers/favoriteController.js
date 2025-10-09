const favModel = require("../models/favorite-model")
const utilities = require("../utilities")

async function requireLogin(req, res) {
  const account = req.session?.account
  if (!account) {
    const nav = await utilities.getNav()
    res.status(401).render("account/login", {
      title: "Login required",
      nav,
      errors: [{ msg: "You must be logged in to use Favorites." }]
    })
    return null
  }
  return account
}

async function add(req, res, next) {
  try {
    const account = await requireLogin(req, res) 
    if (!account) return
    const inv_id = Number(req.params.inv_id)
    if (!Number.isInteger(inv_id) || inv_id <= 0) return res.status(400).send("Invalid inv_id")

    await favModel.addFavorite(account.account_id, inv_id)
    req.flash("notice", "Added to favorites ⭐")
    res.redirect(`/inv/detail/${inv_id}`)
  } catch (e) { next(e) }
}

async function remove(req, res, next) {
  try {
    const account = await requireLogin(req, res) 
    if (!account) return
    const inv_id = Number(req.params.inv_id)
    if (!Number.isInteger(inv_id) || inv_id <= 0) return res.status(400).send("Invalid inv_id")

    await favModel.removeFavorite(account.account_id, inv_id)
    req.flash("notice", "Removed from favorites ❌")
    res.redirect(`/inv/detail/${inv_id}`)
  } catch (e) { next(e) }
}

async function list(req, res, next) {
  try {
    const account = await requireLogin(req, res) 
    if (!account) return

    const items = await favModel.listFavorites(account.account_id)
    const nav = await utilities.getNav()
    res.render("account/favorites", {
      title: "My Favorites",
      nav,
      items,
      messages: req.flash("notice")
    })
  } catch (e) { next(e) }
}

module.exports = { add, remove, list }
