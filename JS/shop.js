/**
 * FreshCart - Shop & Catalog Discovery Engine (shop.js)
 * 
 * Provides multi-faceted filtering (categories, brands, price, sort, pagination),
 * URL parameter synchronization, debounced search, and FreshCart domain integration.
 */

(function () {
  'use strict';

  const API_URL = 'https://ecommerce.routemisr.com/api/v1/products';
  const CATEGORIES_API = 'https://ecommerce.routemisr.com/api/v1/categories';
  const BRANDS_API = 'https://ecommerce.routemisr.com/api/v1/brands';

  // Active filter state
  const state = {
    category: null,
    brand: null,
    sort: '',
    search: '',
    page: 1,
    limit: 12,
    totalPages: 1,
    products: []
  };

  let activeFetchController = null;

  // ============================================================================
  // 1. HELPERS & URL PARAMETERS
  // ============================================================================

  function debounce(fn, delayMs = 300) {
    let timer;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delayMs);
    };
  }

  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) state.category = params.get('category');
    if (params.get('brand')) state.brand = params.get('brand');
    if (params.get('search')) state.search = params.get('search');
    if (params.get('sort')) state.sort = params.get('sort');
    if (params.get('page')) state.page = parseInt(params.get('page'), 10) || 1;
  }

  function renderRatingStars(rating = 0) {
    const num = Math.max(0, Math.min(5, Number(rating) || 0));
    const rounded = Math.round(num * 2) / 2;
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rounded) {
        html += '<i class="fa-solid fa-star" aria-hidden="true"></i>';
      } else if (i - 0.5 === rounded) {
        html += '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>';
      } else {
        html += '<i class="fa-regular fa-star" aria-hidden="true"></i>';
      }
    }
    return html;
  }

  // ============================================================================
  // 2. DATA FETCHING
  // ============================================================================

  async function fetchSidebarFilters() {
    // 1. Load Categories
    try {
      const res = await fetch(CATEGORIES_API);
      if (res.ok) {
        const json = await res.json();
        renderCategoryFilters(json.data || []);
      }
    } catch (e) {
      console.warn('[FreshCart Shop] Failed loading categories filter:', e);
    }

    // 2. Load Brands
    try {
      const res = await fetch(`${BRANDS_API}?limit=15`);
      if (res.ok) {
        const json = await res.json();
        renderBrandFilters(json.data || []);
      }
    } catch (e) {
      console.warn('[FreshCart Shop] Failed loading brands filter:', e);
    }
  }

  function renderCategoryFilters(categories) {
    const list = document.getElementById('shop-category-filters');
    if (!list) return;

    let html = `
      <li class="filter-list-item">
        <label class="filter-check">
          <input type="radio" name="filter-category" value="" ${!state.category ? 'checked' : ''} />
          <span>All Categories</span>
        </label>
      </li>
    `;

    categories.forEach((cat) => {
      const isChecked = state.category === cat._id;
      html += `
        <li class="filter-list-item">
          <label class="filter-check">
            <input type="radio" name="filter-category" value="${FreshCart.escapeHtml(cat._id)}" ${isChecked ? 'checked' : ''} />
            <span>${FreshCart.escapeHtml(cat.name)}</span>
          </label>
        </li>
      `;
    });

    list.innerHTML = html;
  }

  function renderBrandFilters(brands) {
    const list = document.getElementById('shop-brand-filters');
    if (!list) return;

    let html = `
      <li class="filter-list-item">
        <label class="filter-check">
          <input type="radio" name="filter-brand" value="" ${!state.brand ? 'checked' : ''} />
          <span>All Brands</span>
        </label>
      </li>
    `;

    brands.forEach((brand) => {
      const isChecked = state.brand === brand._id;
      html += `
        <li class="filter-list-item">
          <label class="filter-check">
            <input type="radio" name="filter-brand" value="${FreshCart.escapeHtml(brand._id)}" ${isChecked ? 'checked' : ''} />
            <span>${FreshCart.escapeHtml(brand.name)}</span>
          </label>
        </li>
      `;
    });

    list.innerHTML = html;
  }

  async function fetchProducts() {
    const container = document.getElementById('shop-products-grid');
    if (!container) return;

    if (activeFetchController) {
      activeFetchController.abort();
    }
    activeFetchController = new AbortController();

    container.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading products...</span>
        </div>
      </div>
    `;

    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('limit', state.limit);

    if (state.category) params.set('category[in]', state.category);
    if (state.brand) params.set('brand', state.brand);
    if (state.sort) params.set('sort', state.sort);

    try {
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        signal: activeFetchController.signal
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      state.products = Array.isArray(result.data) ? result.data : [];
      state.totalPages = result.metadata?.numberOfPages || 1;

      // In-memory text filter if search term is active
      let displayList = state.products;
      if (state.search) {
        const query = state.search.toLowerCase();
        displayList = displayList.filter(
          (p) => p.title?.toLowerCase().includes(query) || p.category?.name?.toLowerCase().includes(query)
        );
      }

      renderProducts(displayList);
      renderPagination(result.metadata);
      updateActiveFilterPills();
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[FreshCart Shop] Error fetching catalog:', error);
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <p class="text-danger fs-5">Unable to load catalog. Please check your connection.</p>
          <button type="button" class="btn btn-outline-success btn-sm mt-2" id="retry-shop-btn">Try Again</button>
        </div>
      `;
      document.getElementById('retry-shop-btn')?.addEventListener('click', fetchProducts);
    } finally {
      activeFetchController = null;
    }
  }

  // ============================================================================
  // 3. RENDERING ENGINE
  // ============================================================================

  function renderProductCard(product) {
    const id = String(product._id || product.id || '');
    const title = FreshCart.escapeHtml(product.title || 'Product');
    const category = FreshCart.escapeHtml(product.category?.name || "General");
    const imageCover = FreshCart.sanitizeUrl(product.imageCover || product.image || '');
    const priceFormatted = FreshCart.formatCurrency(product.priceAfterDiscount || product.price || 0);
    const ratingAvg = (Number(product.ratingsAverage) || 4.5).toFixed(1);
    const ratingCount = parseInt(product.ratingsQuantity, 10) || 0;
    const isWishlisted = FreshCart.isInWishlist(id);
    const wishlistClass = isWishlisted ? 'fa-solid text-danger' : 'fa-regular';

    return `
      <div class="col-12 col-sm-6 col-md-4 col-xl-4">
        <article class="product-card" data-id="${FreshCart.escapeHtml(id)}">
          <div class="product-img-box">
            <a href="ProductDetails.html?id=${encodeURIComponent(id)}" class="d-block w-100 h-100 text-decoration-none">
              <img src="${imageCover}" alt="${title}" class="product-img" loading="lazy" />
            </a>
            <div class="product-actions">
              <button type="button" class="btn-product-action action-wishlist" data-action="wishlist" title="Wishlist" aria-label="Toggle wishlist for ${title}">
                <i class="${wishlistClass} fa-heart" aria-hidden="true"></i>
              </button>
              <a href="ProductDetails.html?id=${encodeURIComponent(id)}" class="btn-product-action action-view text-decoration-none" title="View details" aria-label="View ${title}">
                <i class="fa-regular fa-eye" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          <div class="product-info">
            <span class="product-category-label">${category}</span>
            <h3 class="product-name">
              <a href="ProductDetails.html?id=${encodeURIComponent(id)}" title="${title}">${title}</a>
            </h3>
            <div class="product-rating">
              <div class="rating-stars">${renderRatingStars(ratingAvg)}</div>
              <span class="rating-count">${ratingAvg} (${ratingCount})</span>
            </div>
            <div class="product-footer">
              <span class="product-price-val">${priceFormatted} EGP</span>
              <button type="button" class="btn-add-cart" data-action="add-cart" title="Add to Cart" aria-label="Add ${title} to Cart">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function renderProducts(products) {
    const container = document.getElementById('shop-products-grid');
    const countElem = document.getElementById('shop-results-count');
    if (!container) return;

    if (countElem) {
      countElem.textContent = `${products.length} Products found`;
    }

    if (!products.length) {
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <i class="fa-solid fa-filter-circle-xmark fa-3x text-muted mb-3" aria-hidden="true"></i>
          <h4 class="fw-bold">No products match your criteria</h4>
          <p class="text-secondary">Try adjusting your filters, keyword, or clear selections.</p>
          <button type="button" class="btn btn-outline-success mt-2" id="reset-filters-btn">Clear All Filters</button>
        </div>
      `;
      document.getElementById('reset-filters-btn')?.addEventListener('click', resetAllFilters);
      return;
    }

    container.innerHTML = products.map(renderProductCard).join('');

    container.querySelectorAll('.product-img').forEach((img) => {
      img.addEventListener('error', function () {
        this.src = 'https://placehold.co/300x300?text=FreshCart';
      });
    });
  }

  function renderPagination(metadata) {
    const paginationNav = document.getElementById('shop-pagination');
    if (!paginationNav || !metadata) return;

    const totalPages = metadata.numberOfPages || 1;
    const current = metadata.currentPage || state.page;

    if (totalPages <= 1) {
      paginationNav.innerHTML = '';
      return;
    }

    let html = '<ul class="pagination pagination-custom justify-content-center mt-4 gap-1">';
    // Prev
    html += `
      <li class="page-item ${current === 1 ? 'disabled' : ''}">
        <button type="button" class="page-link" data-page="${current - 1}" aria-label="Previous">&laquo;</button>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === current ? 'active' : ''}">
          <button type="button" class="page-link" data-page="${i}">${i}</button>
        </li>
      `;
    }

    // Next
    html += `
      <li class="page-item ${current === totalPages ? 'disabled' : ''}">
        <button type="button" class="page-link" data-page="${current + 1}" aria-label="Next">&raquo;</button>
      </li>
    `;
    html += '</ul>';

    paginationNav.innerHTML = html;
  }

  function updateActiveFilterPills() {
    const container = document.getElementById('active-filter-pills');
    if (!container) return;

    let pills = '';
    if (state.category) {
      pills += `
        <span class="badge bg-light text-dark border px-3 py-2 d-inline-flex align-items-center gap-2">
          Category Filter
          <i class="fa-solid fa-xmark cursor-pointer" data-clear="category"></i>
        </span>
      `;
    }
    if (state.brand) {
      pills += `
        <span class="badge bg-light text-dark border px-3 py-2 d-inline-flex align-items-center gap-2">
          Brand Filter
          <i class="fa-solid fa-xmark cursor-pointer" data-clear="brand"></i>
        </span>
      `;
    }
    if (state.search) {
      pills += `
        <span class="badge bg-light text-dark border px-3 py-2 d-inline-flex align-items-center gap-2">
          "${FreshCart.escapeHtml(state.search)}"
          <i class="fa-solid fa-xmark cursor-pointer" data-clear="search"></i>
        </span>
      `;
    }

    container.innerHTML = pills;
  }

  function resetAllFilters() {
    state.category = null;
    state.brand = null;
    state.search = '';
    state.sort = '';
    state.page = 1;

    const sortSelect = document.getElementById('shop-sort-select');
    if (sortSelect) sortSelect.value = '';

    const searchInput = document.getElementById('shop-search-input');
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('input[name="filter-category"]').forEach((r) => { r.checked = !r.value; });
    document.querySelectorAll('input[name="filter-brand"]').forEach((r) => { r.checked = !r.value; });

    fetchProducts();
  }

  // ============================================================================
  // 4. EVENT BINDINGS
  // ============================================================================

  function setupEventListeners() {
    // 1. Grid delegation (Add to Cart & Wishlist)
    const grid = document.getElementById('shop-products-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const addBtn = e.target.closest('button[data-action="add-cart"]');
        if (addBtn) {
          e.preventDefault();
          const card = addBtn.closest('.product-card');
          const id = card?.dataset.id;
          const product = state.products.find((p) => String(p._id || p.id) === String(id));
          if (product) {
            FreshCart.addToCart({
              id: String(product._id || product.id),
              title: product.title,
              price: product.priceAfterDiscount || product.price,
              imageCover: product.imageCover,
              category: product.category?.name || 'General'
            }, 1);

            const originalIcon = addBtn.innerHTML;
            addBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => { addBtn.innerHTML = originalIcon; }, 700);
          }
          return;
        }

        const wishBtn = e.target.closest('button[data-action="wishlist"]');
        if (wishBtn) {
          e.preventDefault();
          const card = wishBtn.closest('.product-card');
          const id = card?.dataset.id;
          if (!id) return;

          const isWish = FreshCart.toggleWishlist(id);
          const icon = wishBtn.querySelector('i');
          if (icon) {
            icon.classList.toggle('fa-solid', isWish);
            icon.classList.toggle('fa-regular', !isWish);
            icon.classList.toggle('text-danger', isWish);
          }
        }
      });
    }

    // 2. Category radio change
    const catList = document.getElementById('shop-category-filters');
    if (catList) {
      catList.addEventListener('change', (e) => {
        state.category = e.target.value || null;
        state.page = 1;
        fetchProducts();
      });
    }

    // 3. Brand radio change
    const brandList = document.getElementById('shop-brand-filters');
    if (brandList) {
      brandList.addEventListener('change', (e) => {
        state.brand = e.target.value || null;
        state.page = 1;
        fetchProducts();
      });
    }

    // 4. Sort selection
    const sortSelect = document.getElementById('shop-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.page = 1;
        fetchProducts();
      });
    }

    // 5. In-page search input
    const searchInput = document.getElementById('shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        state.search = e.target.value.trim();
        state.page = 1;
        fetchProducts();
      }, 300));
    }

    // 6. Pagination click delegation
    const paginationNav = document.getElementById('shop-pagination');
    if (paginationNav) {
      paginationNav.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-page]');
        if (btn) {
          e.preventDefault();
          const p = parseInt(btn.dataset.page, 10);
          if (p && p !== state.page) {
            state.page = p;
            fetchProducts();
            document.getElementById('shop-main-content')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }

    // 7. Active filter pills removal
    const pillsContainer = document.getElementById('active-filter-pills');
    if (pillsContainer) {
      pillsContainer.addEventListener('click', (e) => {
        const clearKey = e.target.dataset.clear;
        if (clearKey) {
          if (clearKey === 'category') state.category = null;
          if (clearKey === 'brand') state.brand = null;
          if (clearKey === 'search') {
            state.search = '';
            if (searchInput) searchInput.value = '';
          }
          fetchProducts();
        }
      });
    }
  }

  // ============================================================================
  // 5. INITIALIZATION
  // ============================================================================

  document.addEventListener('DOMContentLoaded', () => {
    readUrlParams();
    fetchSidebarFilters();
    fetchProducts();
    setupEventListeners();
  });
})();
