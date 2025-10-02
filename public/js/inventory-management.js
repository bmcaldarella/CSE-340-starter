(function () {
  function $(sel, root = document) { return root.querySelector(sel) }

  document.addEventListener("DOMContentLoaded", () => {
    const select = $("#classification_id") || $("select[name='classification_id']")
    const table  = $("#inventoryDisplay")

    if (!select || !table) return

    if (select.value) loadInventory(select.value)

    select.addEventListener("change", (e) => {
      const id = e.target.value
      if (!id) {
        table.innerHTML = ""
        return
      }
      loadInventory(id)
    })

    async function loadInventory(classificationId) {
      try {
        const res = await fetch(`/inv/getInventory/${classificationId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const items = await res.json()

        table.innerHTML = buildTable(items)
      } catch (err) {
        console.error("Error loading inventory:", err)
        table.innerHTML = `<caption class="notice">Unable to load inventory.</caption>`
      }
    }

    function buildTable(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return `<caption class="notice">No vehicles found for this classification.</caption>`
      }

      const thead = `
        <thead>
          <tr>
            <th scope="col">Make</th>
            <th scope="col">Model</th>
            <th scope="col">Year</th>
            <th scope="col">Price</th>
            <th scope="col">Color</th>
            <th scope="col">Miles</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
      `

      const rows = items.map(v => `
        <tr>
          <td>${escapeHtml(v.inv_make)}</td>
          <td>${escapeHtml(v.inv_model)}</td>
          <td>${escapeHtml(v.inv_year)}</td>
          <td>${formatCurrency(v.inv_price)}</td>
          <td>${escapeHtml(v.inv_color)}</td>
          <td>${Number(v.inv_miles || 0).toLocaleString()}</td>
          <td>
            <a href="/inv/edit/${v.inv_id}">Edit</a> |
            <a href="/inv/delete/${v.inv_id}">Delete</a>
          </td>
        </tr>
      `).join("")

      const tbody = `<tbody>${rows}</tbody>`
      return thead + tbody
    }

    function escapeHtml(str) {
      if (str === null || str === undefined) return ""
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
    }

    function formatCurrency(value) {
      const num = Number(value || 0)
      return num.toLocaleString(undefined, { style: "currency", currency: "USD" })
    }
  })
})()
