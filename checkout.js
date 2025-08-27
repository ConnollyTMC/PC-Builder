// --- Utility ---
const $ = id => document.getElementById(id);

// Get order info from localStorage/sessionStorage
function getOrderDetails() {
  return JSON.parse(sessionStorage.getItem("lastOrder") || "{}");
}

// Render confirmation
function renderConfirmation() {
  const details = getOrderDetails();
  const box = $("confirmationDetails");

  if (!details.id) {
    box.innerHTML = `<p>We couldn't find your order details.</p>`;
    return;
  }

  let html = `
    <h2>Order #${details.id}</h2>
    <p><strong>Status:</strong> ${details.status}</p>
    <p><strong>Payer:</strong> ${details.payerName} (${details.payerEmail})</p>
    <p><strong>Total:</strong> $${details.amount}</p>
    <h3>Items</h3>
    <ul>
  `;

  if (details.items && details.items.length) {
    details.items.forEach(it => {
      html += `<li>${it.name} — $${it.value}</li>`;
    });
  }

  html += "</ul>";

  box.innerHTML = html;
}

function wire() {
  $("backHomeBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

renderConfirmation();
wire();
