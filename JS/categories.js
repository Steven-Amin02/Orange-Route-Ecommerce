/**
 * FreshCart - Categories Showcase Engine (categories.js)
 * 
 * Fetches categories from Route API, renders dynamic category showcase cards,
 * and provides instant keyword filtering.
 */

(function () {
  'use strict';

  const CATEGORIES_API = 'https://ecommerce.routemisr.com/api/v1/categories';
  let allCategories = [];

  async function fetchCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading categories...</span>
        </div>
      </div>
    `;

    try {
      const response = await fetch(CATEGORIES_API);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      allCategories = Array.isArray(result.data) ? result.data : [];
      renderCategories(allCategories);
    } catch (error) {
      console.error('[FreshCart Categories] Error fetching categories:', error);
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <p class="text-danger fs-5">Unable to load categories at this time.</p>
          <button type="button" class="btn btn-outline-success btn-sm mt-2" id="retry-cats-btn">Try Again</button>
        </div>
      `;
      document.getElementById('retry-cats-btn')?.addEventListener('click', fetchCategories);
    }
  }

  function renderCategoryCard(cat) {
    const id = String(cat._id || '');
    const name = FreshCart.escapeHtml(cat.name || 'Category');
    const image = FreshCart.sanitizeUrl(cat.image || '');

    return `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <article class="category-showcase-card">
          <div class="category-showcase-img-box">
            <a href="Shop.html?category=${encodeURIComponent(id)}" class="d-block w-100 h-100">
              <img src="${image}" alt="${name}" class="category-showcase-img" loading="lazy" />
            </a>
          </div>
          <div class="category-showcase-body">
            <div>
              <h2 class="category-showcase-title">
                <a href="Shop.html?category=${encodeURIComponent(id)}" class="text-decoration-none text-dark">
                  ${name}
                </a>
              </h2>
              <span class="badge bg-success-subtle text-success small mb-3">Featured Department</span>
            </div>
            <a href="Shop.html?category=${encodeURIComponent(id)}" class="btn btn-outline-success btn-sm w-100 rounded-pill">
              Explore Products <i class="fa-solid fa-arrow-right ms-1" aria-hidden="true"></i>
            </a>
          </div>
        </article>
      </div>
    `;
  }

  function renderCategories(categories) {
    const container = document.getElementById('categories-grid');
    const countElem = document.getElementById('categories-count-badge');
    if (!container) return;

    if (countElem) {
      countElem.textContent = `${categories.length} Departments`;
    }

    if (!categories.length) {
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <p class="text-secondary fs-5">No categories found matching your search.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = categories.map(renderCategoryCard).join('');

    container.querySelectorAll('.category-showcase-img').forEach((img) => {
      img.addEventListener('error', function () {
        this.src = 'https://placehold.co/400x300?text=FreshCart';
      });
    });
  }

  function setupCategorySearch() {
    const input = document.getElementById('categories-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        const query = (e.target.value || '').trim().toLowerCase();
        const filtered = allCategories.filter((cat) => cat.name?.toLowerCase().includes(query));
        renderCategories(filtered);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    setupCategorySearch();
  });
})();
