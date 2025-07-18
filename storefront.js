// =========================
// Element References
// =========================
const container = document.getElementById("storefront"); // Main container for product grid
const filterContainer = document.getElementById("tag-filters"); // Container for tag filter checkboxes
const featuredContainer = document.getElementById("featured-product");

// =========================
// Global State
// =========================
let allProducts = []; // List of all products loaded from files
let activeFilters = {}; // Object storing current active filters by group

// =========================
// Configuration: Filter Groups
// =========================
const filterGroups = {
  Size: ["Apartment", "FC Room", "Small", "Medium", "Large"],
  Style: ["Rustic", "Modern", "Traditional", "Minimalist", "Lofted", "Cozy", "Industrial"],
  Theme: ["Dark", "Bright", "Seasonal", "Fantasy", "Nature", "Elegant", "Mystical"],
  Colors: ["Warm Neutrals", "Cool Neutrals", "Earth Tones", "Bold Colors", "Monochrome", "Pastels"],
  Features: ["Loft", "Library", "Fireplace", "Aquarium", "Bar/Kitchen", "Garden", "Stage"],
  Mood: ["Romantic", "Tranquil", "Dramatic", "Whimsical", "Mysterious", "Inviting"],
  Purpose: ["Roleplay", "Screenshots", "Lounge", "Social Hub", "Reading Nook", "Personal Retreat"]
};

// =========================
// Initialization
// =========================
buildStorefront(); // Start everything

// =========================
// Core Functions
// =========================

// Main function to load products, parse filters, and render UI
function buildStorefront() {
  container.innerHTML = "Loading products...";

  fetchProductFiles().then(async (files) => {
    const products = [];

    for (const file of files) {
      const meta = await loadProductMeta(file);
      if (meta) products.push({ ...meta, file });
    }

    allProducts = products;

    parseURLFilters();
    renderFilterGroups();
    renderFeaturedProduct(allProducts[0]);
    applyFilters();
  });
}

// =========================
// Product & Metadata Handling
// =========================

// Fetch the list of product files from products.json
async function fetchProductFiles() {
  try {
    const res = await fetch("products.json");
    if (!res.ok) throw new Error("Failed to load products.json");
    return await res.json();
  } catch (e) {
    console.error("Error loading product list:", e);
    return [];
  }
}

// Load the metadata block from a product file
async function loadProductMeta(file) {
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`Failed to fetch ${file}`);
    const text = await res.text();
    return extractMeta(text);
  } catch (e) {
    console.warn(e);
    return null;
  }
}

// Extract JSON metadata from a product file comment block
function extractMeta(text) {
  const match = text.match(/<!--meta([\s\S]*?)-->/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    console.error("Meta parsing error:", e);
    return {};
  }
}

// =========================
// Filter Handling
// =========================

// Parse filters from the current URL query string into activeFilters
function parseURLFilters() {
  const params = new URLSearchParams(window.location.search);
  Object.entries(filterGroups).forEach(([group, tags]) => {
    const value = params.get(group.toLowerCase());
    if (value) {
      activeFilters[group] = value.split(",");
    }
  });
}

// Update the browser URL to reflect the current filter state
function updateURLFilters() {
  const params = new URLSearchParams();
  Object.entries(activeFilters).forEach(([group, values]) => {
    if (values.length > 0) {
      params.set(group.toLowerCase(), values.join(","));
    }
  });
  history.replaceState(null, "", `?${params.toString()}`);
}

// Handle user interaction when a filter checkbox is changed
function onFilterChange(event) {
  const tag = event.target.value;
  const group = event.target.dataset.group;
  if (!activeFilters[group]) activeFilters[group] = [];

  if (event.target.checked) {
    if (!activeFilters[group].includes(tag)) {
      activeFilters[group].push(tag);
    }
  } else {
    activeFilters[group] = activeFilters[group].filter(t => t !== tag);
  }
  console.log("Filters after change:", activeFilters);
  updateURLFilters();
  applyFilters();
}

// Clear all selected filters and reset UI
function clearAllFilters() {
  activeFilters = {};
  updateURLFilters();
  renderFilterGroups();
  renderProductGrid(allProducts);
}

// Apply filters to the product list and re-render the grid
function applyFilters() {
  let filtered = allProducts;
  Object.entries(activeFilters).forEach(([group, tags]) => {
    if (tags.length > 0) {
        filtered = filtered.filter(p => {
            const productTags = p.filters?.[group] || [];
            return tags.some(t => productTags.includes(t));
        });
    }
  });
  console.log("Filtered products count:", filtered.length);
  renderProductGrid(filtered);
}

// =========================
// Render Functions
// =========================

// Render all filter groups and their tags as collapsible sections
function renderFilterGroups() {
  filterContainer.innerHTML = `
    <button class="clear-all-btn" onclick="clearAllFilters()">Clear All</button>
    ${Object.entries(filterGroups).map(([group, tags]) => `
      <details open>
        <summary>${group}</summary>
        ${tags.map(tag => {
          const isChecked = activeFilters[group]?.includes(tag);
          return `
            <label>
              <input type="checkbox" value="${tag}" data-group="${group}" ${isChecked ? "checked" : ""} onchange="onFilterChange(event)">
              ${tag}
            </label>
          `;
        }).join("")}
      </details>
    `).join("")}
  `;
}

// Render the grid of product cards based on a product list
function renderProductGrid(products) {
  container.innerHTML = `
    <div class="storefront-grid">
      ${products.map(product => `
        <a href="product.html?file=${encodeURIComponent(product.file)}" class="product-card">
          <img src="${product.images?.[0] || 'placeholder.png'}" alt="${product.title}">
          <div class="product-card-content">
            <h3>${product.title}</h3>
            <p>${product.price}</p>
            <div class="tags">${(product.tags || []).join(", ")}</div>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

// Render featured product section (example: pick the first product)
function renderFeaturedProduct(product) {
  featuredContainer.innerHTML = `
    <div class="featured-product">
      <h2>Featured Design</h2>
      <a href="product.html?file=${encodeURIComponent(product.file)}" class="featured-card">
        <img src="${product.images?.[0] || 'placeholder.png'}" alt="${product.title}">
        <div class="featured-info">
          <h3>${product.title}</h3>
          <p>${product.description || ''}</p>
          <strong>${product.price}</strong>
        </div>
      </a>
    </div>
  `;
}

function toggleFilters(button) {
  const sidebar = document.getElementById("filter-sidebar");
  sidebar.classList.toggle("open");

  const arrow = button.querySelector(".arrow");
  arrow.textContent = sidebar.classList.contains("open") ? "▴" : "▾";
}
