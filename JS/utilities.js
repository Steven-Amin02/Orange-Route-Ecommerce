/**
 * FreshCart - Unified Core Utilities & State Management Domain (utilities.js)
 * 
 * Provides production-grade centralized storage, sanitization, currency calculations,
 * cart & wishlist state synchronization, and authentication management across browser contexts.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FreshCart = factory();
    
    // Maintain global alias functions for backward compatibility
    root.escapeHtml = root.FreshCart.escapeHtml;
    root.sanitizeUrl = root.FreshCart.sanitizeUrl;
    root.formatCurrency = root.FreshCart.formatCurrency;
    root.getStorage = root.FreshCart.getStorage;
    root.setStorage = root.FreshCart.setStorage;
    root.removeStorage = root.FreshCart.removeStorage;
    root.clearStorage = root.FreshCart.clearStorage;
    root.getCart = root.FreshCart.getCart;
    root.saveCart = root.FreshCart.saveCart;
    root.getCartCount = root.FreshCart.getCartCount;
    root.getCartTotal = root.FreshCart.getCartTotal;
    root.updateCartBadge = root.FreshCart.updateCartBadge;
    root.addToCart = root.FreshCart.addToCart;
    root.updateCartQuantity = root.FreshCart.updateCartQuantity;
    root.removeFromCart = root.FreshCart.removeFromCart;
    root.clearCart = root.FreshCart.clearCart;
    root.getWishlist = root.FreshCart.getWishlist;
    root.saveWishlist = root.FreshCart.saveWishlist;
    root.isInWishlist = root.FreshCart.isInWishlist;
    root.toggleWishlist = root.FreshCart.toggleWishlist;
    root.updateWishlistBadge = root.FreshCart.updateWishlistBadge;
    root.getUser = root.FreshCart.getUser;
    root.getToken = root.FreshCart.getToken;
    root.setUser = root.FreshCart.setUser;
    root.logout = root.FreshCart.logout;
    root.isLoggedIn = root.FreshCart.isLoggedIn;
    root.updateAuthUI = root.FreshCart.updateAuthUI;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // Storage Keys Single Source of Truth
  const STORAGE_KEYS = Object.freeze({
    CART: 'freshcart_cart',
    WISHLIST: 'freshcart_wishlist',
    USER: 'freshcart_user',
    TOKEN: 'freshcart_token'
  });

  // ============================================================================
  // 1. SECURITY & SANITIZATION UTILITIES
  // ============================================================================

  /**
   * Escape HTML special characters to prevent Stored XSS injection.
   * @param {*} input - String or raw value to escape
   * @returns {string} Sanitized string
   */
  function escapeHtml(input) {
    if (input === null || input === undefined) return '';
    const str = String(input);
    const entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    };
    return str.replace(/[&<>"'`]/g, (char) => entityMap[char]);
  }

  /**
   * Sanitize an arbitrary URL to prevent javascript: or malicious protocol exploits.
   * @param {string} url - Target URL to sanitize
   * @param {string} fallback - Fallback URL if invalid
   * @returns {string} Safe URL
   */
  function sanitizeUrl(url, fallback = 'https://placehold.co/300x300?text=FreshCart') {
    if (!url || typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    if (/^(https?:|\/|\.\/|\.\.\/|data:image\/)/i.test(trimmed)) {
      return encodeURI(trimmed);
    }
    return fallback;
  }

  // ============================================================================
  // 2. MONETARY & FORMATTING UTILITIES
  // ============================================================================

  /**
   * Format numbers to fixed 2-decimal currency without IEEE 754 floating-point drift.
   * Uses scaled integer arithmetic (cents/piastres).
   * @param {number|string} amount - Monetary amount
   * @returns {string} Formatted decimal string (e.g., "149.50")
   */
  function formatCurrency(amount) {
    const numeric = Number(amount);
    if (isNaN(numeric) || !isFinite(numeric)) return '0.00';
    const cents = Math.round(numeric * 100);
    return (cents / 100).toFixed(2);
  }

  // ============================================================================
  // 3. DEFENSIVE LOCAL STORAGE MANAGEMENT
  // ============================================================================

  /**
   * Safely retrieve and parse a JSON entry from localStorage.
   * @param {string} key - Storage key
   * @param {*} fallback - Default fallback if not found or corrupted
   * @returns {*} Parsed value
   */
  function getStorage(key, fallback = null) {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item);
    } catch (error) {
      console.warn(`[FreshCart] Failed reading storage key "${key}":`, error);
      return fallback;
    }
  }

  /**
   * Safely serialize and save a value to localStorage.
   * Handles QuotaExceededError defensively.
   * @param {string} key - Storage key
   * @param {*} value - Value to serialize
   * @returns {boolean} True if write was successful
   */
  function setStorage(key, value) {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[FreshCart] Failed writing storage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Safely remove an item from localStorage.
   * @param {string} key - Storage key to remove
   */
  function removeStorage(key) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[FreshCart] Failed removing storage key "${key}":`, error);
    }
  }

  /**
   * Clear all items from localStorage.
   */
  function clearStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn('[FreshCart] Failed clearing storage:', error);
    }
  }

  // ============================================================================
  // 4. CART DOMAIN STATE & LOGIC
  // ============================================================================

  /**
   * Retrieve current cart items array. Returns empty array if missing.
   * @returns {Array<Object>} Normalized cart array
   */
  function getCart() {
    const items = getStorage(STORAGE_KEYS.CART, []);
    return Array.isArray(items) ? items : [];
  }

  /**
   * Save cart array and trigger badge updates across the document.
   * @param {Array<Object>} cart - Updated cart array
   */
  function saveCart(cart) {
    const valid = Array.isArray(cart) ? cart : [];
    setStorage(STORAGE_KEYS.CART, valid);
    updateCartBadge();
  }

  /**
   * Calculate total quantity of items in cart.
   * @returns {number} Total units
   */
  function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      return total + qty;
    }, 0);
  }

  /**
   * Calculate subtotal of items in cart formatted to 2 decimals.
   * @returns {string} Subtotal string formatted to 2 decimals
   */
  function getCartTotal() {
    const cart = getCart();
    const totalCents = cart.reduce((sum, item) => {
      const priceCents = Math.round((Number(item.price) || 0) * 100);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      return sum + (priceCents * qty);
    }, 0);
    return (totalCents / 100).toFixed(2);
  }

  /**
   * Synchronize all navbar cart counter badges in the DOM.
   */
  function updateCartBadge() {
    if (typeof document === 'undefined') return;
    const count = getCartCount();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach((badge) => {
      badge.textContent = String(count);
      badge.setAttribute('aria-label', `${count} items in cart`);
    });
  }

  /**
   * Add a product to the cart with schema normalization.
   * @param {Object} product - Product data object
   * @param {number} quantity - Quantity to add
   */
  function addToCart(product, quantity = 1) {
    if (!product) return;
    const id = String(product.id || product._id || '').trim();
    if (!id) return;

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const cart = getCart();
    const existing = cart.find((item) => String(item.id) === id);

    if (existing) {
      existing.quantity = Math.max(1, (parseInt(existing.quantity, 10) || 0) + qtyToAdd);
    } else {
      cart.push({
        id: id,
        title: String(product.title || 'Product Title'),
        price: Math.max(0, Number(product.price) || 0),
        imageCover: sanitizeUrl(product.imageCover || product.image || ''),
        category: String(product.category?.name || product.category || 'General'),
        quantity: qtyToAdd
      });
    }

    saveCart(cart);
  }

  /**
   * Update quantity for a specific product. If quantity <= 0, item is removed.
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   */
  function updateCartQuantity(productId, quantity) {
    const targetId = String(productId || '').trim();
    if (!targetId) return;

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty <= 0) {
      removeFromCart(targetId);
      return;
    }

    const cart = getCart();
    const item = cart.find((i) => String(i.id) === targetId);
    if (item) {
      item.quantity = numQty;
      saveCart(cart);
    }
  }

  /**
   * Remove a single product from the cart by its identifier.
   * @param {string} productId - Target product ID
   */
  function removeFromCart(productId) {
    const targetId = String(productId || '').trim();
    if (!targetId) return;

    const cart = getCart().filter((item) => String(item.id) !== targetId);
    saveCart(cart);
  }

  /**
   * Empty the cart completely.
   */
  function clearCart() {
    saveCart([]);
  }

  // ============================================================================
  // 5. WISHLIST DOMAIN STATE & LOGIC
  // ============================================================================

  /**
   * Retrieve normalized array of wishlisted product IDs.
   * @returns {Array<string>} Array of product ID strings
   */
  function getWishlist() {
    const items = getStorage(STORAGE_KEYS.WISHLIST, []);
    if (!Array.isArray(items)) return [];
    return items.map((item) => (typeof item === 'object' && item !== null ? String(item.id || item._id || '') : String(item))).filter(Boolean);
  }

  /**
   * Save wishlist ID array to storage and refresh UI counters.
   * @param {Array<string>} wishlist - Wishlist ID array
   */
  function saveWishlist(wishlist) {
    const valid = Array.isArray(wishlist) ? wishlist : [];
    const unique = Array.from(new Set(valid.map(String)));
    setStorage(STORAGE_KEYS.WISHLIST, unique);
    updateWishlistBadge();
  }

  /**
   * Check if a product is wishlisted.
   * @param {string} productId - Product ID to check
   * @returns {boolean} True if product is in wishlist
   */
  function isInWishlist(productId) {
    const targetId = String(productId || '').trim();
    if (!targetId) return false;
    const wishlist = getWishlist();
    return wishlist.includes(targetId);
  }

  /**
   * Toggle a product in/out of the wishlist.
   * @param {string|Object} product - Product ID string or product object
   * @returns {boolean} True if added, false if removed
   */
  function toggleWishlist(product) {
    const id = String(typeof product === 'object' && product !== null ? (product.id || product._id || '') : product).trim();
    if (!id) return false;

    let wishlist = getWishlist();
    const exists = wishlist.includes(id);

    if (exists) {
      wishlist = wishlist.filter((item) => item !== id);
      saveWishlist(wishlist);
      return false;
    } else {
      wishlist.push(id);
      saveWishlist(wishlist);
      return true;
    }
  }

  /**
   * Synchronize all navbar wishlist counter badges in the DOM.
   */
  function updateWishlistBadge() {
    if (typeof document === 'undefined') return;
    const count = getWishlist().length;
    const badges = document.querySelectorAll('.wishlist-badge');
    badges.forEach((badge) => {
      badge.textContent = String(count);
      badge.setAttribute('aria-label', `${count} items in wishlist`);
    });
  }

  // ============================================================================
  // 6. AUTHENTICATION & USER SESSION MANAGEMENT
  // ============================================================================

  /**
   * Get current authenticated user profile.
   * @returns {Object|null} User object or null
   */
  function getUser() {
    return getStorage(STORAGE_KEYS.USER, null);
  }

  /**
   * Get active JWT authorization token.
   * @returns {string|null} Token string or null
   */
  function getToken() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(STORAGE_KEYS.TOKEN) || null;
  }

  /**
   * Persist authenticated user session.
   * @param {Object} user - User profile ({ name, email, role })
   * @param {string} token - JWT token
   */
  function setUser(user, token) {
    if (user) setStorage(STORAGE_KEYS.USER, user);
    if (token && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
    updateAuthUI();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshcart:auth-updated', { detail: { user, token } }));
    }
  }

  /**
   * Terminate active user session and clear credentials.
   */
  function logout() {
    removeStorage(STORAGE_KEYS.USER);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    updateAuthUI();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freshcart:auth-updated', { detail: { user: null, token: null } }));
    }
  }

  /**
   * Check if active session is authenticated.
   * @returns {boolean} True if user is logged in
   */
  function isLoggedIn() {
    return Boolean(getToken());
  }

  /**
   * Synchronize navbar authentication status across document.
   */
  function updateAuthUI() {
    if (typeof document === 'undefined') return;
    const isSub = Boolean(typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.includes('/Pages/'));
    const loginPath = isSub ? 'Login.html' : './Pages/Login.html';
    const signupPath = isSub ? 'Signup.html' : './Pages/Signup.html';

    const user = getUser();
    const authenticated = isLoggedIn();

    // 1. Main Navbar Sign In button (.btn-nav-signin)
    const signinBtns = document.querySelectorAll('.btn-nav-signin');
    signinBtns.forEach((btn) => {
      if (authenticated && user) {
        const userName = escapeHtml(user.name?.split(' ')[0] || 'Account');
        btn.innerHTML = `
          <i class="fa-solid fa-user-check text-success me-1" aria-hidden="true"></i>
          <span>${userName}</span>
        `;
        btn.setAttribute('title', `Logged in as ${user.name || user.email}`);
        btn.setAttribute('href', '#');
        btn.onclick = (e) => {
          e.preventDefault();
          if (confirm(`Logged in as ${user.name || user.email}. Do you want to sign out?`)) {
            logout();
            window.location.reload();
          }
        };
      } else {
        btn.innerHTML = `
          <i class="fa-regular fa-user" style="font-size: 0.75rem;" aria-hidden="true"></i>
          <span>Sign In</span>
        `;
        btn.setAttribute('href', loginPath);
        btn.onclick = null;
      }
    });

    // 2. Top utility header auth links
    const topAuthContainer = document.getElementById('top-auth-links');
    if (topAuthContainer) {
      if (authenticated && user) {
        const userName = escapeHtml(user.name || user.email);
        topAuthContainer.innerHTML = `
          <span class="text-dark fw-medium d-flex align-items-center gap-1">
            <i class="fa-solid fa-circle-user text-success" aria-hidden="true"></i>
            <span>Hello, ${userName}</span>
          </span>
          <span class="top-divider"></span>
          <button type="button" class="btn btn-link top-link p-0 text-decoration-none" id="top-logout-btn">
            <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Sign Out
          </button>
        `;
        document.getElementById('top-logout-btn')?.addEventListener('click', () => {
          logout();
          window.location.reload();
        });
      } else {
        topAuthContainer.innerHTML = `
          <a href="${loginPath}" class="top-link d-flex align-items-center gap-1">
            <i class="fa-regular fa-user" style="font-size: 0.75rem;" aria-hidden="true"></i>
            <span>Sign In</span>
          </a>
          <span class="top-divider"></span>
          <a href="${signupPath}" class="top-link d-flex align-items-center gap-1">
            <i class="fa-solid fa-user-plus" style="font-size: 0.75rem;" aria-hidden="true"></i>
            <span>Sign Up</span>
          </a>
        `;
      }
    }
  }

  // ============================================================================
  // 7. CROSS-TAB REACTIVITY & AUTOMATIC INITIALIZATION
  // ============================================================================

  if (typeof window !== 'undefined') {
    // Cross-tab broadcast listener: responds immediately to modifications in other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.CART) {
        updateCartBadge();
        window.dispatchEvent(new CustomEvent('freshcart:cart-updated', { detail: { cart: getCart() } }));
      } else if (event.key === STORAGE_KEYS.WISHLIST) {
        updateWishlistBadge();
        window.dispatchEvent(new CustomEvent('freshcart:wishlist-updated', { detail: { wishlist: getWishlist() } }));
      } else if (event.key === STORAGE_KEYS.TOKEN || event.key === STORAGE_KEYS.USER) {
        updateAuthUI();
        window.dispatchEvent(new CustomEvent('freshcart:auth-updated', { detail: { user: getUser(), token: getToken() } }));
      }
    });

    // Auto-initialize badges, session UI and sticky navbar elevation when DOM is ready
    const initAppState = () => {
      updateCartBadge();
      updateWishlistBadge();
      updateAuthUI();

      // Dynamic sticky navbar elevation on scroll
      const header = document.querySelector('.main-header');
      if (header) {
        const handleScroll = () => {
          if (window.scrollY > 20) {
            header.classList.add('navbar-scrolled');
          } else {
            header.classList.remove('navbar-scrolled');
          }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAppState);
    } else {
      initAppState();
    }
  }

  return Object.freeze({
    STORAGE_KEYS,
    escapeHtml,
    sanitizeUrl,
    formatCurrency,
    getStorage,
    setStorage,
    removeStorage,
    clearStorage,
    getCart,
    saveCart,
    getCartCount,
    getCartTotal,
    updateCartBadge,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getWishlist,
    saveWishlist,
    isInWishlist,
    toggleWishlist,
    updateWishlistBadge,
    getUser,
    getToken,
    setUser,
    logout,
    isLoggedIn,
    updateAuthUI
  });
});
