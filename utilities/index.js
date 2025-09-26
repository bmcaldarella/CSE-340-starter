const invModel = require("../models/inventory-model")
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()
  console.log(data)
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}


/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
  let grid
  if(data.length > 0){
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => { 
      grid += '<li>'
      grid +=  '<a href="../../inv/detail/'+ vehicle.inv_id 
      + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
      + 'details"><img src="' + vehicle.inv_thumbnail 
      +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
      +' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += '<h2>'
      grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
      grid += '</h2>'
      grid += '<span>$' 
      + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else { 
    grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}



/* **************************************
 * Build the single vehicle detail HTML
 * ************************************ */
Util.buildItemDetail = async function (vehicle) {
  const fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
  const fmtInt = new Intl.NumberFormat("en-US")

  const price = fmtUSD.format(vehicle.inv_price || 0)
  const miles = fmtInt.format(vehicle.inv_miles || 0)

  let html  = '<section id="inv-detail" class="inv-detail">'

  // Media
  html     +=   `<figure class="inv-media">
                   <img class="inv-photo"
                        src="${vehicle.inv_image}"
                        alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}">
                 </figure>`

  // Info
  html     +=   '<div class="inv-info">'

  html     +=     `<h2 class="inv-title">${vehicle.inv_make} ${vehicle.inv_model} (${vehicle.inv_year})</h2>`

  html     +=     `<div class="price-row">
                     <span class="price-label">Price</span>
                     <span class="price-value">${price}</span>
                   </div>`

  html     +=     `<p class="desc">${vehicle.inv_description || ""}</p>`

  html     +=     '<div class="specs">'

  html     +=       `<div class="spec">
                       <span class="spec-label">Mileage</span>
                       <span class="spec-value">${miles} mi</span>
                     </div>`

  html     +=       `<div class="spec">
                       <span class="spec-label">Year</span>
                       <span class="spec-value">${vehicle.inv_year}</span>
                     </div>`

  html     +=       `<div class="spec">
                       <span class="spec-label">Color</span>
                       <span class="spec-value">${vehicle.inv_color}</span>
                     </div>`

  html     +=       `<div class="spec">
                       <span class="spec-label">Class</span>
                       <span class="spec-value">${vehicle.classification_name}</span>
                     </div>`

  html     +=     '</div>' 
  html     +=   '</div>'   
  html     += '</section>'

  return html
}


Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
module.exports = Util