(function () {
  const cfg = window.WEBSITE_CONFIG || {};
  const portalLink = document.getElementById("portalLink");
  const brandName = document.getElementById("brandName");
  const statusEl = document.getElementById("status");
  const gridEl = document.getElementById("productsGrid");
  const searchInput = document.getElementById("searchInput");

  if (portalLink && cfg.portalUrl) {
    portalLink.href = cfg.portalUrl;
  }

  const kesFormatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  });

  let allProducts = [];

  function render(products) {
    gridEl.innerHTML = "";
    if (!products.length) {
      statusEl.textContent = "No products found.";
      return;
    }
    statusEl.textContent = `Showing ${products.length} product(s).`;

    products.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.imageUrl || "https://placehold.co/600x400/e2e8f0/64748b?text=Product"}" alt="${escapeHtml(p.name || "Product")}" />
        <div class="card-body">
          <div class="category">${escapeHtml(p.category || "General")}</div>
          <h4>${escapeHtml(p.name || "Unnamed Product")}</h4>
          <p>${escapeHtml(p.description || "No description available.")}</p>
          <div class="price">${kesFormatter.format(Number(p.price || 0))}</div>
        </div>
      `;
      gridEl.appendChild(card);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function loadFromSupabase() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      throw new Error("Missing Supabase config");
    }
    const base = cfg.supabaseUrl.replace(/\/$/, "");
    const url =
      base +
      "/rest/v1/app_state?id=eq.default&select=data&limit=1";
    const res = await fetch(url, {
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: "Bearer " + cfg.supabaseAnonKey,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to load product catalog");
    }
    const rows = await res.json();
    const data = rows && rows[0] && rows[0].data ? rows[0].data : null;
    const products = data && Array.isArray(data.products) ? data.products : [];
    const appName =
      data &&
      data.branding &&
      typeof data.branding.appName === "string" &&
      data.branding.appName.trim()
        ? data.branding.appName.trim()
        : "Acumen Products";
    brandName.textContent = appName;
    document.title = appName;
    return products;
  }

  async function init() {
    try {
      statusEl.textContent = "Loading products...";
      allProducts = await loadFromSupabase();
      render(allProducts);
    } catch (err) {
      statusEl.textContent = "Unable to load products right now.";
      gridEl.innerHTML = "";
    }
  }

  searchInput.addEventListener("input", function () {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      render(allProducts);
      return;
    }
    render(
      allProducts.filter((p) => {
        const name = String(p.name || "").toLowerCase();
        const category = String(p.category || "").toLowerCase();
        const description = String(p.description || "").toLowerCase();
        return name.includes(q) || category.includes(q) || description.includes(q);
      })
    );
  });

  init();
})();

