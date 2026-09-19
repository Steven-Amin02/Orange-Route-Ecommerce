/**
 * FreshCart - Cart Experience Engine (cart.js)
 * 
 * Production-ready cart page script:
 * - Deterministic state handling via FreshCart domain
 * - Zero mock injection: empty cart remains empty
 * - Targeted DOM updates for quantity steppers (eliminating layout thrashing)
 * - XSS-safe event delegation with strict CSP compliance (no inline handlers)
 * - Multi-tab synchronization via storage events
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. HELPERS & ROUTE DETERMINATION
  // ============================================================================

  /**
   * Determine relative pathing for navigation links based on current location.
   * @returns {{ homeLink: string, detailsPage: string }} Relative route paths
   */
  function getRoutePaths() {
    const isSub = typeof window !== 'undefined' && window.location.pathname.includes('/Pages/');
    return {
      homeLink: isSub ? '../index.html' : 'index.html',
      shopLink: isSub ? 'Shop.html' : './Pages/Shop.html',
      detailsPage: isSub ? 'ProductDetails.html' : './Pages/ProductDetails.html'
    };
  }

  /**
   * Update summary cards and counters with accurate currency formatting.
   * @param {Array<Object>} cart - Current cart items array
   */
  function updateCartSummary(cart) {
    const items = Array.isArray(cart) ? cart : [];
    const totalQty = items.reduce((sum, item) => sum + (Math.max(1, parseInt(item.quantity, 10) || 1)), 0);
    const totalPrice = FreshCart.getCartTotal();

    // Navbar badges
    FreshCart.updateCartBadge();

    // Summary elements
    const subtotalElem = document.getElementById('summary-subtotal-price');
    const totalElem = document.getElementById('summary-estimated-total');
    const countText = document.getElementById('cart-item-count-text');
    const summaryCount = document.getElementById('summary-items-count');

    const qtyLabel = `${totalQty} item${totalQty === 1 ? '' : 's'}`;

    if (subtotalElem) subtotalElem.textContent = `${totalPrice} EGP`;
    if (totalElem) totalElem.textContent = `${totalPrice} EGP`;
    if (countText) countText.textContent = qtyLabel;
    if (summaryCount) summaryCount.textContent = `(${qtyLabel})`;
  }

  // ============================================================================
  // 2. DOM RENDERING & TARGETED MUTATIONS
  // ============================================================================

  /**
   * Generate safe HTML markup for a single cart row.
   * @param {Object} item - Cart item record
   * @param {string} detailsPage - Target details page route
   * @returns {string} Sanitized item HTML
   */
  function renderCartItemRow(item, detailsPage) {
    const id = String(item.id || '');
    const title = FreshCart.escapeHtml(item.title || 'Product');
    const category = FreshCart.escapeHtml(item.category || "Women's Fashion");
    const imageCover = FreshCart.sanitizeUrl(item.imageCover || '');
    const unitPrice = FreshCart.formatCurrency(item.price || 0);
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const lineTotal = FreshCart.formatCurrency((Number(item.price) || 0) * qty);

    return `
      <div class="cart-item-card" id="cart-item-${FreshCart.escapeHtml(id)}" data-id="${FreshCart.escapeHtml(id)}">
        <div class="cart-item-left">
          <a href="${detailsPage}?id=${encodeURIComponent(id)}" class="cart-item-img-box text-decoration-none" tabindex="-1">
            <img src="${imageCover}" alt="${title}" class="cart-item-img" loading="lazy" />
          </a>
          <div class="cart-item-info">
            <a href="${detailsPage}?id=${encodeURIComponent(id)}" class="cart-item-title">${title}</a>
            <span class="cart-item-category">${category}</span>
            <div class="cart-item-unit-price">${unitPrice} EGP</div>
            <div class="cart-stepper">
              <button type="button" class="cart-stepper-btn-minus" data-action="decrement" data-id="${FreshCart.escapeHtml(id)}" aria-label="Decrease quantity of ${title}">
                <i class="fa-solid fa-minus" aria-hidden="true"></i>
              </button>
              <input type="text" class="cart-stepper-val" value="${qty}" readonly aria-label="Quantity for ${title}" />
              <button type="button" class="cart-stepper-btn-plus" data-action="increment" data-id="${FreshCart.escapeHtml(id)}" aria-label="Increase quantity of ${title}">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-total-block">
            <div class="cart-item-total-label">Total</div>
            <div class="cart-item-total-price">${lineTotal} <span>EGP</span></div>
          </div>
          <button type="button" class="cart-item-delete-btn" data-action="remove" data-id="${FreshCart.escapeHtml(id)}" title="Remove ${title} from cart" aria-label="Remove ${title} from cart">
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render the empty cart placeholder UI.
   * @param {HTMLElement} container - Target cart items container
   * @param {string} homeLink - Fallback shopping route
   */
  function renderEmptyCart(container, homeLink) {
    document.getElementById('cart-bottom-actions-bar')?.classList.add('d-none');
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-solid fa-cart-shopping fa-3x text-muted mb-3" aria-hidden="true"></i>
        <h2 class="fw-bold fs-4">Your cart is empty</h2>
        <p class="text-secondary">Looks like you haven't added anything yet.</p>
        <a href="${homeLink}" class="btn btn-success rounded-pill mt-3 px-4 py-2">
          <i class="fa-solid fa-arrow-left me-2" aria-hidden="true"></i>Start Shopping
        </a>
      </div>
    `;
  }

  /**
   * Full render of cart items and summary state.
   */
  function displayCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    const cart = FreshCart.getCart();
    const { homeLink, detailsPage } = getRoutePaths();

    updateCartSummary(cart);

    if (cart.length === 0) {
      renderEmptyCart(container, homeLink);
      return;
    }

    document.getElementById('cart-bottom-actions-bar')?.classList.remove('d-none');
    container.innerHTML = cart.map((item) => renderCartItemRow(item, detailsPage)).join('');

    // Attach image fallback handler cleanly
    container.querySelectorAll('.cart-item-img').forEach((img) => {
      img.addEventListener('error', function onImgError() {
        this.removeEventListener('error', onImgError);
        this.src = 'https://placehold.co/300x300?text=FreshCart';
      });
    });
  }

  // ============================================================================
  // 3. TARGETED MUTATION ACTIONS (NO FULL RE-RENDER)
  // ============================================================================

  /**
   * Change quantity by delta (+1 or -1) with in-place DOM updates.
   * @param {string} id - Target product ID
   * @param {number} delta - Step difference
   */
  function changeQuantity(id, delta) {
    const cart = FreshCart.getCart();
    const item = cart.find((i) => String(i.id) === String(id));
    if (!item) return;

    const currentQty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      removeCartItem(id);
      return;
    }

    item.quantity = nextQty;
    FreshCart.saveCart(cart);

    // Targeted DOM update: update input and row total only
    const row = document.getElementById(`cart-item-${id}`);
    if (row) {
      const valInput = row.querySelector('.cart-stepper-val');
      const itemTotal = row.querySelector('.cart-item-total-price');
      if (valInput) valInput.value = String(nextQty);
      if (itemTotal) {
        itemTotal.innerHTML = `${FreshCart.formatCurrency((Number(item.price) || 0) * nextQty)} <span>EGP</span>`;
      }
    }

    updateCartSummary(cart);
  }

  /**
   * Remove a single product from cart and animate row removal.
   * @param {string} id - Product ID
   */
  function removeCartItem(id) {
    FreshCart.removeFromCart(id);

    const row = document.getElementById(`cart-item-${id}`);
    if (row) {
      row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      row.style.opacity = '0';
      row.style.transform = 'translateX(-10px)';
      setTimeout(() => {
        row.remove();
        const updatedCart = FreshCart.getCart();
        updateCartSummary(updatedCart);

        const container = document.getElementById('cart-items-container');
        if (updatedCart.length === 0 && container) {
          const { homeLink } = getRoutePaths();
          renderEmptyCart(container, homeLink);
        }
      }, 200);
    } else {
      displayCart();
    }
  }

  /**
   * Empty entire cart with instant DOM reset.
   */
  function clearCart() {
    FreshCart.clearCart();
    const container = document.getElementById('cart-items-container');
    if (container) {
      const { homeLink } = getRoutePaths();
      renderEmptyCart(container, homeLink);
    }
    updateCartSummary([]);
  }

  // ============================================================================
  // 4. EVENT DELEGATION
  // ============================================================================

  function setupCartEventListeners() {
    const container = document.getElementById('cart-items-container');
    if (container) {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        e.preventDefault();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (!id) return;

        if (action === 'increment') {
          changeQuantity(id, 1);
        } else if (action === 'decrement') {
          changeQuantity(id, -1);
        } else if (action === 'remove') {
          removeCartItem(id);
        }
      });
    }

    // Bottom clear-all button
    const clearBtn = document.querySelector('.cart-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearCart();
      });
    }
  }

  // ============================================================================
  // 5. INITIALIZATION & CROSS-TAB REACTIVITY
  // ============================================================================

  document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    setupCartEventListeners();
  });

  // Re-sync cart view if updated from another tab
  window.addEventListener('freshcart:cart-updated', () => {
    displayCart();
  });

  // Backward compatibility globals
  window.changeQuantity = changeQuantity;
  window.removeCartItem = removeCartItem;
  window.clearCart = clearCart;
  window.displayCart = displayCart;
  window.renderCart = displayCart;
})();
