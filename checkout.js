const $ = id => document.getElementById(id);

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

// Render cart as a table summary
function renderCartSummary() {
  const cart = getCart();
  const tbody = document.querySelector("#cartSummary tbody");
  tbody.innerHTML = "";
  let total = 0;

  if (!cart.length) {
    tbody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
    $("cartTotal").textContent = "$0";
    return "0.00";
  }

  cart.forEach((c, i) => {
    const configName = `Configuration ${i + 1}`;
    let configSubtotal = parseFloat((c.estTotal || "0").replace(/[^\d.]/g, "")) || 0;

    let firstPart = true;
    for (const [part, selection] of Object.entries(c)) {
      if (part === "estTotal") continue;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${configName}</td>
        <td>${part}</td>
        <td>${selection || "—"}</td>
        <td>${firstPart ? `$${configSubtotal.toFixed(2)}` : ""}</td>
      `;
      firstPart = false;
      tbody.appendChild(row);
    }

    total += configSubtotal;
  });

  $("cartTotal").textContent = "$" + total.toFixed(2);
  return total.toFixed(2);
}

// Generate fallback order ID
function generateFallbackOrderId() {
  return "ORDER-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  renderCartSummary();

  // Back to cart button
  $("backCartBtn")?.addEventListener("click", () => {
    window.location.href = "cart.html";
  });

  // Initialize PayPal button
  paypal.Buttons({
    createOrder: function (data, actions) {
      const fullName = $("#fullName")?.value.trim();
      const email = $("#email")?.value.trim();
      const phone = $("#phone")?.value.trim();
      const address = $("#address")?.value.trim();

      // Validate form
      if (!fullName || !email || !phone || !address) {
        alert("Please fill out all required fields before payment.");
        return actions.reject(new Error("Missing required fields"));
      }

      const cart = getCart();
      if (!cart.length) {
        alert("Your cart is empty.");
        return actions.reject(new Error("Cart is empty"));
      }

      let items = [];
      let total = 0;

      cart.forEach((c, i) => {
        for (const [k, v] of Object.entries(c)) {
          if (k === "estTotal" || !v) continue;
          items.push({
            name: `${k}: ${v}`,
            unit_amount: { currency_code: "USD", value: "0.00" },
            quantity: "1"
          });
        }
        const val = parseFloat((c.estTotal || "0").replace(/[^\d.]/g, "")) || 0;
        total += val;
        items.push({
          name: `Configuration ${i + 1} Subtotal`,
          unit_amount: { currency_code: "USD", value: val.toFixed(2) },
          quantity: "1"
        });
      });

      // ✅ Always return a Promise with an order ID
      return actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: total.toFixed(2) }
            }
          },
          items: items
        }]
      });
    },

    onApprove: function (data, actions) {
      return actions.order.capture().then(details => {
        const orderId = details.id || generateFallbackOrderId();

        const orderInfo = {
          id: orderId,
          status: details.status,
          payerName: $("#fullName")?.value || "",
          payerEmail: $("#email")?.value || "",
          payerPhone: $("#phone")?.value || "",
          payerAddress: $("#address")?.value || "",
          amount: details.purchase_units[0].amount.value,
          items: details.purchase_units[0].items.map(i => ({
            name: i.name,
            value: i.unit_amount.value
          })) || []
        };

        // Save to sessionStorage
        sessionStorage.setItem("lastOrder", JSON.stringify(orderInfo));

        // Clear cart
        localStorage.removeItem("cart");

        // Redirect to confirmation page
        window.location.href = "order-confirmation.html";
      });
    },

    onError: function (err) {
      console.error("PayPal error:", err);
      alert("Payment failed. Check console for details.");
    }
  }).render("#paypal-button-container");
});
