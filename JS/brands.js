/**
 * FreshCart - Brands Showcase Engine (brands.js)
 * 
 * Fetches brands from Route API, renders brand logo cards,
 * and provides live search filtering.
 */

(function () {
  'use strict';

  const BRANDS_API = 'https://ecommerce.routemisr.com/api/v1/brands?limit=50';
  let allBrands = [];

  async function fetchBrands() {
    const container = document.getElementById('brands-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading brands...</span>
        </div>
      </div>
    `;

    try {
      const response = await fetch(BRANDS_API);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      allBrands = Array.isArray(result.data) ? result.data : [];
      renderBrands(allBrands);
    } catch (error) {
      console.error('[FreshCart Brands] Error fetching brands:', error);
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <p class="text-danger fs-5">Unable to load brands at this time.</p>
          <button type="button" class="btn btn-outline-success btn-sm mt-2" id="retry-brands-btn">Try Again</button>
        </div>
      `;
      document.getElementById('retry-brands-btn')?.addEventListener('click', fetchBrands);
    }
  }

  function renderBrandCard(brand) {
    const id = String(brand._id || '');
    const name = FreshCart.escapeHtml(brand.name || 'Brand');
    const image = FreshCart.sanitizeUrl(brand.image || '');

    return `
      <div class="col-6 col-sm-4 col-md-3 col-lg-2">
        <a href="Shop.html?brand=${encodeURIComponent(id)}" class="text-decoration-none">
          <article class="brand-showcase-card">
            <img src="${image}" alt="${name} logo" class="brand-logo-img" loading="lazy" />
            <h2 class="brand-name">${name}</h2>
          </article>
        </a>
      </div>
    `;
  }

  function renderBrands(brands) {
    const container = document.getElementById('brands-grid');
    const countElem = document.getElementById('brands-count-badge');
    if (!container) return;

    if (countElem) {
      countElem.textContent = `${brands.length} Brands Available`;
    }

    if (!brands.length) {
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <p class="text-secondary fs-5">No brands found matching your search.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = brands.map(renderBrandCard).join('');

    container.querySelectorAll('.brand-logo-img').forEach((img) => {
      img.addEventListener('error', function () {
        this.src = 'https://placehold.co/150x80?text=Brand';
      });
    });
  }

  function setupBrandSearch() {
    const input = document.getElementById('brands-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        const query = (e.target.value || '').trim().toLowerCase();
        const filtered = allBrands.filter((b) => b.name?.toLowerCase().includes(query));
        renderBrands(filtered);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetchBrands();
    setupBrandSearch();
  });
})();
