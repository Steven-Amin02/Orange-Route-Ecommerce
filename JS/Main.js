/**
 * FreshCart - Main Catalog & Discovery Engine (Main.js)
 * 
 * Production-ready catalog management:
 * - Reactive search with debouncing & AbortController cancellation
 * - Secure XSS-safe DOM templating with HTML entity encoding
 * - Integrated FreshCart domain operations (cart & persistent wishlist)
 * - Optimized event delegation with WCAG 2.1 AA accessibility announcements
 */

(function () {
  'use strict';

  const API_URL = 'https://ecommerce.routemisr.com/api/v1/products';

  // Category mapping for Route API
  const CATEGORY_MAP = Object.freeze({
    'music': '6439d61c0049ad0b52b90051',
    "men's fashion": '6439d5b90049ad0b52b90048',
    "women's fashion": '6439d58a0049ad0b52b9003f',
    'supermarket': '6439d41c67d9aa4ca97064d5',
    'baby & toys': '6439d40367d9aa4ca97064cc',
    'home': '6439d3e067d9aa4ca97064c3',
    'books': '6439d3c867d9aa4ca97064ba',
    'beauty & health': '6439d30b67d9aa4ca97064b1',
    'mobiles': '6439d2f467d9aa4ca97064a8',
    'electronics': '6439d2d167d9aa4ca970649f'
  });

  let allProducts = [];
  let currentFilterCategory = 'all';
  let activeSearchController = null;
  let activeFilterController = null;

  // ============================================================================
  // 1. UTILITY HELPERS
  // ============================================================================

  /**
   * Debounce helper to throttle rapid user inputs.
   * @param {Function} fn - Target callback
   * @param {number} delayMs - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(fn, delayMs = 300) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delayMs);
    };
  }

  /**
   * Announce dynamic feedback messages to assistive technology.
   * @param {string} message - Announcement text
   */
  function announceLiveRegion(message) {
    let announcer = document.getElementById('a11y-live-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-live-announcer';
      announcer.className = 'visually-hidden';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
  }

  /**
   * Generate 5-star rating icon markup safely.
   * @param {number} rating - Average rating (0-5)
   * @returns {string} Rating stars HTML
   */
  function renderRatingStars(rating = 0) {
    const numericRating = Math.max(0, Math.min(5, Number(rating) || 0));
    const rounded = Math.round(numericRating * 2) / 2;
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
  // 2. TEMPLATING & RENDERING
  // ============================================================================

  /**
   * Build safe, accessible product card HTML with entity sanitization.
   * @param {Object} product - Product data object
   * @returns {string} Sanitized product card HTML
   */
  function getProduct(product) {
    if (!product) return '';

    const id = String(product.id || product._id || '');
    const title = FreshCart.escapeHtml(product.title || 'Product Title');
    const categoryName = FreshCart.escapeHtml(product.category?.name || "Women's Fashion");
    const imageCover = FreshCart.sanitizeUrl(product.imageCover || product.image || '');
    const priceFormatted = FreshCart.formatCurrency(product.price || 0);
    const ratingAvg = (Number(product.ratingsAverage) || 4.0).toFixed(1);
    const ratingCount = parseInt(product.ratingsQuantity, 10) || 0;
    const isWishlisted = FreshCart.isInWishlist(id);
    const wishlistClass = isWishlisted ? 'fa-solid text-danger' : 'fa-regular';
    const wishlistAria = isWishlisted ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`;

    return `
      <article class="product-card" data-id="${FreshCart.escapeHtml(id)}">
        <div class="product-img-box">
          <a href="./Pages/ProductDetails.html?id=${encodeURIComponent(id)}" class="d-block w-100 h-100 text-decoration-none" tabindex="-1">
            <img src="${imageCover}" alt="${title}" class="product-img" loading="lazy" />
          </a>
          <div class="product-actions">
            <button type="button" class="btn-product-action action-wishlist" data-action="wishlist" title="${FreshCart.escapeHtml(wishlistAria)}" aria-label="${FreshCart.escapeHtml(wishlistAria)}">
              <i class="${wishlistClass} fa-heart" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn-product-action action-compare" data-action="compare" title="Compare ${title}" aria-label="Compare ${title}">
              <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
            </button>
            <a href="./Pages/ProductDetails.html?id=${encodeURIComponent(id)}" class="btn-product-action action-view text-decoration-none" title="Quick view of ${title}" aria-label="Quick view of ${title}">
              <i class="fa-regular fa-eye" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        <div class="product-info">
          <span class="product-category-label">${categoryName}</span>
          <h3 class="product-name">
            <a href="./Pages/ProductDetails.html?id=${encodeURIComponent(id)}" title="${title}">${title}</a>
          </h3>
          <div class="product-rating">
            <div class="rating-stars" aria-label="Rated ${ratingAvg} out of 5 stars">${renderRatingStars(ratingAvg)}</div>
            <span class="rating-count" aria-hidden="true">${ratingAvg} (${ratingCount})</span>
          </div>
          <div class="product-footer">
            <span class="product-price-val">${priceFormatted} EGP</span>
            <button type="button" class="btn-add-cart" data-action="add-cart" title="Add ${title} to Cart" aria-label="Add ${title} to Cart">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Display products in the grid container.
   * @param {Array<Object>} products - Products array
   */
  function display(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <i class="fa-solid fa-box-open fa-3x text-muted mb-3" aria-hidden="true"></i>
          <p class="text-muted fs-5">No products found matching your selection.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(getProduct).join('');

    // Attach fallback image handler cleanly without inline attribute execution
    container.querySelectorAll('.product-img').forEach((img) => {
      img.addEventListener('error', function onImgError() {
        this.removeEventListener('error', onImgError);
        this.src = 'https://placehold.co/300x300?text=FreshCart';
      });
    });
  }

  // ============================================================================
  // 3. ASYNC DATA FETCHING & FILTERING
  // ============================================================================

  /**
   * Fetch all products from Route API with error boundary.
   */
  async function fetchData() {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = `
      <div class="col-12 py-5 text-center">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading products...</span>
        </div>
      </div>
    `;

    try {
      const response = await fetch(`${API_URL}?limit=40`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();
      allProducts = Array.isArray(result.data) ? result.data : [];
      display(allProducts);
    } catch (error) {
      console.error('[FreshCart] Error fetching products:', error);
      container.innerHTML = `
        <div class="col-12 py-5 text-center">
          <i class="fa-solid fa-circle-exclamation fa-3x text-danger mb-3" aria-hidden="true"></i>
          <p class="text-danger fs-5">Unable to load products at this time. Please check your connection.</p>
          <button type="button" class="btn btn-outline-success mt-2" id="retry-fetch-btn">Try Again</button>
        </div>
      `;
      document.getElementById('retry-fetch-btn')?.addEventListener('click', fetchData);
    }
  }

  /**
   * Fetch a specific single product from API by its MongoDB ID.
   * @param {string} id - 24-character hex ID
   */
  async function getSpecificProduct(id) {
    const container = document.getElementById('products-container');
    if (!container || !id) return;

    if (activeSearchController) {
      activeSearchController.abort();
    }
    activeSearchController = new AbortController();

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
        signal: activeSearchController.signal
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();
      if (result.data) {
        display([result.data]);
        document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        display([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.warn(`[FreshCart] Error fetching product ID (${id}):`, error);
      display([]);
    } finally {
      activeSearchController = null;
    }
  }

  /**
   * Real-time search handler by query keyword or ID.
   * @param {string} query - Search term
   */
  function searchProducts(query) {
    const term = (query || '').trim().toLowerCase();

    if (!term) {
      if (currentFilterCategory && currentFilterCategory !== 'all') {
        filterProducts(currentFilterCategory);
      } else {
        display(allProducts);
      }
      return;
    }

    // Exact 24-character hex product ID
    if (/^[a-f\d]{24}$/i.test(term)) {
      getSpecificProduct(term);
      return;
    }

    // In-memory filter on loaded products
    const filtered = allProducts.filter((p) => {
      const titleMatch = p.title?.toLowerCase().includes(term);
      const catMatch = p.category?.name?.toLowerCase().includes(term);
      return titleMatch || catMatch;
    });

    display(filtered);
  }

  /**
   * Filter products by category using Route API with client-side fallback.
   * @param {string} category - Category name or identifier
   */
  async function filterProducts(category) {
    currentFilterCategory = category || 'all';

    if (!category || category === 'all') {
      display(allProducts);
      return;
    }

    const catKey = category.toLowerCase().trim();
    const categoryId = CATEGORY_MAP[catKey] || category;

    if (activeFilterController) {
      activeFilterController.abort();
    }
    activeFilterController = new AbortController();

    try {
      const response = await fetch(`${API_URL}?category[in]=${encodeURIComponent(categoryId)}&limit=40`, {
        signal: activeFilterController.signal
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();

      if (Array.isArray(result.data) && result.data.length > 0) {
        display(result.data);
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.warn('[FreshCart] Category API filter failed, falling back to cache:', e);
    } finally {
      activeFilterController = null;
    }

    // Local fallback filter
    const filtered = allProducts.filter((p) => {
      return p.category?.name?.toLowerCase() === catKey || p.category?._id === categoryId;
    });
    display(filtered);
  }

  // ============================================================================
  // 4. EVENT DELEGATION & ACTION HANDLERS
  // ============================================================================

  /**
   * Bind event delegation on product card actions (Add to Cart, Wishlist).
   */
  function setupProductActions() {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      // 1. Add to Cart button
      const addBtn = e.target.closest('button[data-action="add-cart"]');
      if (addBtn) {
        e.preventDefault();
        const card = addBtn.closest('.product-card');
        const id = card?.dataset.id;
        const product = allProducts.find((p) => String(p._id || p.id) === String(id));

        if (product) {
          FreshCart.addToCart({
            id: String(product._id || product.id),
            title: product.title,
            price: product.price,
            imageCover: product.imageCover,
            category: product.category?.name || 'General'
          }, 1);

          announceLiveRegion(`Added ${product.title} to shopping cart.`);

          // Visual feedback micro-animation
          const originalIcon = addBtn.innerHTML;
          addBtn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
          addBtn.classList.add('btn-success-feedback');
          setTimeout(() => {
            addBtn.innerHTML = originalIcon;
            addBtn.classList.remove('btn-success-feedback');
          }, 800);
        }
        return;
      }

      // 2. Wishlist toggle button
      const wishBtn = e.target.closest('button[data-action="wishlist"]');
      if (wishBtn) {
        e.preventDefault();
        const card = wishBtn.closest('.product-card');
        const id = card?.dataset.id;
        if (!id) return;

        const isAdded = FreshCart.toggleWishlist(id);
        const icon = wishBtn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-solid', isAdded);
          icon.classList.toggle('fa-regular', !isAdded);
          icon.classList.toggle('text-danger', isAdded);
        }

        const product = allProducts.find((p) => String(p._id || p.id) === String(id));
        const productName = product?.title || 'Product';
        const msg = isAdded ? `Added ${productName} to wishlist.` : `Removed ${productName} from wishlist.`;
        announceLiveRegion(msg);
        wishBtn.setAttribute('title', msg);
        wishBtn.setAttribute('aria-label', msg);
        return;
      }
    });
  }

  /**
   * Bind debounced search inputs and category buttons.
   */
  function setupSearchAndFilter() {
    const debouncedSearch = debounce((query) => searchProducts(query), 300);

    ['header-search-input', 'mobile-search-input'].forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', (e) => debouncedSearch(e.target.value));
        input.closest('form')?.addEventListener('submit', (e) => {
          e.preventDefault();
          searchProducts(input.value);
          document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    });

    // Category cards click filter
    document.querySelectorAll('.category-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const catName = card.querySelector('.category-card-name')?.textContent?.trim();
        if (catName) {
          filterProducts(catName);
          document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Reset button
    const viewAllBtn = document.querySelector('.category-view-all');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentFilterCategory = 'all';
        display(allProducts);
        document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // ============================================================================
  // 5. INITIALIZATION
  // ============================================================================

  document.addEventListener('DOMContentLoaded', () => {
    FreshCart.updateCartBadge();
    FreshCart.updateWishlistBadge();
    fetchData();
    setupProductActions();
    setupSearchAndFilter();
  });

  // Re-sync wishlist icons if wishlist changes across tabs
  window.addEventListener('freshcart:wishlist-updated', () => {
    document.querySelectorAll('.product-card').forEach((card) => {
      const id = card.dataset.id;
      const isWish = FreshCart.isInWishlist(id);
      const icon = card.querySelector('.action-wishlist i');
      if (icon) {
        icon.classList.toggle('fa-solid', isWish);
        icon.classList.toggle('fa-regular', !isWish);
        icon.classList.toggle('text-danger', isWish);
      }
    });
  });

  // Expose methods for testing/debugging
  window.FreshCartCatalog = {
    fetchData,
    display,
    searchProducts,
    filterProducts
  };
})();
