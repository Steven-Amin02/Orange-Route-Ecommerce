/**
 * FreshCart - Product Details Engine (product-details.js)
 * 
 * Production-ready product details script:
 * - Safe async data loading with AbortController cancellation
 * - DOM sanitization and accessible interaction patterns
 * - Full FreshCart domain integration (persistent cart & wishlist)
 * - Deterministic navigation and quantity boundaries
 */

(function () {
  'use strict';

  const API_URL = 'https://ecommerce.routemisr.com/api/v1/products';
  const DEFAULT_ID = '6428dfa0dc1175abc65ca067';

  let currentProduct = null;
  let activeDetailsController = null;

  // ============================================================================
  // 1. ROUTE & URL HELPERS
  // ============================================================================

  /**
   * Retrieve Product ID from URL parameters with defensive fallback.
   * @returns {string} Product ID
   */
  function getProductId() {
    if (typeof window === 'undefined') return DEFAULT_ID;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id && id.trim() ? id.trim() : DEFAULT_ID;
  }

  // ============================================================================
  // 2. DATA FETCHING WITH ABORT CONTROLLER
  // ============================================================================

  /**
   * Fetch product details by ID from Route API with cancellation.
   * @param {string} id - Product ID
   */
  async function fetchProductDetails(id = getProductId()) {
    if (activeDetailsController) {
      activeDetailsController.abort();
    }
    activeDetailsController = new AbortController();

    const titleElem = document.getElementById('product-title');
    if (titleElem) {
      titleElem.setAttribute('aria-busy', 'true');
    }

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
        signal: activeDetailsController.signal
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();

      if (!result.data) throw new Error('Product not found in response');

      currentProduct = result.data;
      displayProductDetails(currentProduct);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[FreshCart] Error fetching product details:', error);
      renderProductLoadError(error.message);
    } finally {
      if (titleElem) {
        titleElem.removeAttribute('aria-busy');
      }
      activeDetailsController = null;
    }
  }

  /**
   * Render friendly error state if product fetch fails.
   * @param {string} msg - Error detail
   */
  function renderProductLoadError(msg) {
    const titleElem = document.getElementById('product-title');
    const descElem = document.getElementById('product-desc');
    const priceElem = document.getElementById('product-price');
    const btnAdd = document.getElementById('btn-add-cart');
    const btnBuy = document.getElementById('btn-buy-now');

    if (titleElem) titleElem.textContent = 'Product Unavailable';
    if (descElem) descElem.textContent = 'We were unable to load the product information. Please check your connection or return to the catalog.';
    if (priceElem) priceElem.textContent = '--';
    if (btnAdd) btnAdd.disabled = true;
    if (btnBuy) btnBuy.disabled = true;
  }

  // ============================================================================
  // 3. RENDERING & UI BINDINGS
  // ============================================================================

  /**
   * Render rating stars safely.
   * @param {number} rating - Average score
   * @returns {string} Safe rating stars HTML
   */
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

  /**
   * Display product details in the page DOM safely.
   * @param {Object} product - Product record
   */
  function displayProductDetails(product) {
    if (!product) return;

    const title = product.title || 'Product Details';
    document.title = `${title} - FreshCart`;

    // Breadcrumbs
    const breadcrumbTitle = document.getElementById('breadcrumb-title');
    if (breadcrumbTitle) breadcrumbTitle.textContent = title;

    // Gallery Main Image
    const mainImg = document.getElementById('main-product-image');
    if (mainImg) {
      mainImg.src = FreshCart.sanitizeUrl(product.imageCover);
      mainImg.alt = title;
    }

    // Thumbnails strip
    const thumbContainer = document.getElementById('thumbnails-container');
    const images = Array.isArray(product.images) && product.images.length > 0 
      ? product.images 
      : [product.imageCover];

    if (thumbContainer) {
      thumbContainer.innerHTML = images.map((img, i) => {
        const safeUrl = FreshCart.sanitizeUrl(img);
        return `
          <div class="thumb-box ${i === 0 ? 'active' : ''}" data-img-src="${safeUrl}" tabindex="0" role="button" aria-label="View thumbnail ${i + 1}">
            <img src="${safeUrl}" alt="${FreshCart.escapeHtml(title)} thumbnail ${i + 1}" loading="lazy" />
          </div>
        `;
      }).join('');
    }

    // Text details, badges & categories
    const titleElem = document.getElementById('product-title');
    const catBadge = document.getElementById('product-category-badge');
    const brandBadge = document.getElementById('product-brand-badge');
    const priceElem = document.getElementById('product-price');
    const oldPriceElem = document.getElementById('product-old-price');
    const discountBadge = document.getElementById('product-discount-badge');
    const descElem = document.getElementById('product-desc');
    const starsElem = document.getElementById('product-stars');
    const ratingElem = document.getElementById('product-rating-text');
    const stockElem = document.getElementById('product-available-stock');

    const unitPrice = Number(product.priceAfterDiscount || product.price) || 0;
    const originalPrice = Number(product.price) || 0;

    if (titleElem) titleElem.textContent = title;
    if (catBadge) catBadge.textContent = product.category?.name || 'General';
    if (brandBadge) brandBadge.textContent = product.brand?.name || 'FreshCart';
    if (priceElem) priceElem.textContent = `${FreshCart.formatCurrency(unitPrice)} EGP`;

    if (oldPriceElem && discountBadge) {
      if (product.priceAfterDiscount && product.priceAfterDiscount < originalPrice) {
        const discountPct = Math.round(((originalPrice - product.priceAfterDiscount) / originalPrice) * 100);
        oldPriceElem.textContent = `${FreshCart.formatCurrency(originalPrice)} EGP`;
        oldPriceElem.classList.remove('d-none');
        discountBadge.textContent = `Save ${discountPct}%`;
        discountBadge.classList.remove('d-none');
      } else {
        oldPriceElem.classList.add('d-none');
        discountBadge.classList.add('d-none');
      }
    }

    if (descElem) descElem.textContent = product.description || '';
    if (starsElem) starsElem.innerHTML = renderRatingStars(product.ratingsAverage || 4.5);
    if (ratingElem) {
      ratingElem.textContent = `${(Number(product.ratingsAverage) || 4.5).toFixed(1)} (${product.ratingsQuantity || 0} reviews)`;
    }

    if (stockElem && product.quantity !== undefined) {
      stockElem.textContent = `${product.quantity} available`;
    }

    // Sync Wishlist Button State
    syncWishlistButtonState(product._id || product.id);

    // Initial total calculation based on stepper value
    updatePrice();
    FreshCart.updateCartBadge();
    FreshCart.updateWishlistBadge();
  }

  /**
   * Switch the active hero image in the gallery.
   * @param {HTMLElement} thumbBox - Target thumbnail container element
   * @param {string} src - New image URL
   */
  function switchMainImage(thumbBox, src) {
    const mainImg = document.getElementById('main-product-image');
    if (mainImg && src) {
      mainImg.src = FreshCart.sanitizeUrl(src);
    }
    document.querySelectorAll('.thumb-box').forEach((box) => box.classList.remove('active'));
    if (thumbBox) {
      thumbBox.classList.add('active');
    }
  }

  // ============================================================================
  // 4. STEPPER & CALCULATION ENGINE
  // ============================================================================

  /**
   * Recalculate and update the live total price display based on current stepper.
   */
  function updatePrice() {
    const qtyInput = document.getElementById('product-qty-input');
    const totalElem = document.getElementById('product-total-price');
    if (!qtyInput || !totalElem || !currentProduct) return;

    const qty = Math.max(1, Math.min(99, parseInt(qtyInput.value, 10) || 1));
    qtyInput.value = String(qty);

    const unitPrice = Number(currentProduct.priceAfterDiscount || currentProduct.price) || 0;
    totalElem.textContent = `${FreshCart.formatCurrency(unitPrice * qty)} EGP`;
  }

  /**
   * Increment quantity with upper bound limit of 99.
   */
  function incrementQuantity() {
    const input = document.getElementById('product-qty-input');
    if (input) {
      const current = parseInt(input.value, 10) || 1;
      if (current < 99) {
        input.value = String(current + 1);
        updatePrice();
      }
    }
  }

  /**
   * Decrement quantity with lower bound limit of 1.
   */
  function decrementQuantity() {
    const input = document.getElementById('product-qty-input');
    if (input) {
      const current = parseInt(input.value, 10) || 1;
      if (current > 1) {
        input.value = String(current - 1);
        updatePrice();
      }
    }
  }

  // ============================================================================
  // 5. CART & WISHLIST INTERACTIONS
  // ============================================================================

  /**
   * Add active product to cart using FreshCart state domain with visual feedback.
   */
  function addToCartDetailed() {
    if (!currentProduct) return;

    const qtyInput = document.getElementById('product-qty-input');
    const qty = Math.max(1, parseInt(qtyInput?.value, 10) || 1);
    const unitPrice = Number(currentProduct.priceAfterDiscount || currentProduct.price) || 0;

    FreshCart.addToCart({
      id: String(currentProduct._id || currentProduct.id),
      title: currentProduct.title,
      price: unitPrice,
      imageCover: currentProduct.imageCover,
      category: currentProduct.category?.name || 'General'
    }, qty);

    const btn = document.getElementById('btn-add-cart');
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> <span>Added!</span>';
      btn.classList.add('btn-success-feedback');
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove('btn-success-feedback');
      }, 1000);
    }
  }

  /**
   * Immediate checkout: persist to cart synchronously and redirect instantly.
   */
  function buyNowDetailed() {
    addToCartDetailed();
    const isSub = Boolean(window.location.pathname && window.location.pathname.includes('/Pages/'));
    window.location.href = isSub ? 'Cart.html' : './Pages/Cart.html';
  }

  /**
   * Sync the visual state of the wishlist button based on stored state.
   * @param {string} productId - Product ID
   */
  function syncWishlistButtonState(productId) {
    const btn = document.getElementById('btn-wishlist');
    if (!btn || !productId) return;

    const isWishlisted = FreshCart.isInWishlist(productId);
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');

    if (icon) {
      icon.classList.toggle('fa-solid', isWishlisted);
      icon.classList.toggle('fa-regular', !isWishlisted);
      icon.classList.toggle('text-danger', isWishlisted);
    }

    if (span) {
      span.textContent = isWishlisted ? 'In Wishlist' : 'Add to Wishlist';
    }
  }

  /**
   * Toggle persistent wishlist state and update UI.
   */
  function toggleWishlistDetailed() {
    if (!currentProduct) return;
    const id = String(currentProduct._id || currentProduct.id);
    FreshCart.toggleWishlist(id);
    syncWishlistButtonState(id);
  }

  /**
   * Copy product URL to user's clipboard.
   */
  async function shareProductDetailed() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        // Fallback for non-https or restricted contexts
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      alert('Product link copied to clipboard!');
    } catch (err) {
      console.warn('[FreshCart] Clipboard copy failed:', err);
    }
  }

  /**
   * Switch active informational tabs on the details page.
   * @param {string} tabId - Target tab identifier
   */
  function switchTab(tabId) {
    document.querySelectorAll('.tab-nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
    document.getElementById(`tab-btn-${tabId}`)?.classList.add('active');
    document.getElementById(`tab-pane-${tabId}`)?.classList.add('active');
  }

  // ============================================================================
  // 6. EVENT BINDINGS & DELEGATION
  // ============================================================================

  function setupDetailsEventListeners() {
    // Thumbnail strip delegation
    const thumbContainer = document.getElementById('thumbnails-container');
    if (thumbContainer) {
      thumbContainer.addEventListener('click', (e) => {
        const box = e.target.closest('.thumb-box');
        if (box && box.dataset.imgSrc) {
          switchMainImage(box, box.dataset.imgSrc);
        }
      });
      thumbContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const box = e.target.closest('.thumb-box');
          if (box && box.dataset.imgSrc) {
            e.preventDefault();
            switchMainImage(box, box.dataset.imgSrc);
          }
        }
      });
    }

    // Direct input on stepper
    const qtyInput = document.getElementById('product-qty-input');
    if (qtyInput) {
      qtyInput.addEventListener('change', updatePrice);
    }
  }

  // ============================================================================
  // 7. INITIALIZATION
  // ============================================================================

  document.addEventListener('DOMContentLoaded', () => {
    fetchProductDetails();
    setupDetailsEventListeners();
  });

  // Cross-tab synchronization
  window.addEventListener('freshcart:wishlist-updated', () => {
    if (currentProduct) {
      syncWishlistButtonState(currentProduct._id || currentProduct.id);
    }
  });

  // Global compatibility functions
  window.fetchProductDetails = fetchProductDetails;
  window.fetchProduct = fetchProductDetails;
  window.displayProductDetails = displayProductDetails;
  window.displayProduct = displayProductDetails;
  window.switchMainImage = switchMainImage;
  window.updatePrice = updatePrice;
  window.incrementQuantity = incrementQuantity;
  window.decrementQuantity = decrementQuantity;
  window.addToCartDetailed = addToCartDetailed;
  window.buyNowDetailed = buyNowDetailed;
  window.toggleWishlistDetailed = toggleWishlistDetailed;
  window.shareProductDetailed = shareProductDetailed;
  window.switchTab = switchTab;
})();
