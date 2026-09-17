/**
 * FreshCart - Storage Utilities (utilities.js)
 * 
 * Centralized localStorage management:
 * - Generic localStorage helpers (getStorage, setStorage, removeStorage, clearStorage)
 * - Cart state management (getCart, saveCart, addToCart, removeFromCart, updateCartQuantity, clearCart)
 * - Cart calculations & DOM sync (getCartCount, getCartTotal, updateCartBadge)
 * - Wishlist state management (getWishlist, saveWishlist, toggleWishlist, isInWishlist, updateWishlistBadge)
 */

// Storage Keys
const STORAGE_KEYS = {
  CART: 'freshcart_cart',
  WISHLIST: 'freshcart_wishlist'
};

// ============================================================================
// 1. GENERIC LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Safely retrieve and parse a value from localStorage
 * @param {string} key - Storage key
 * @param {*} fallback - Default value if key is not found or parsing fails
 * @returns {*} Parsed value or fallback
 */
function getStorage(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`[utilities] Error reading key "${key}" from localStorage:`, error);
    return fallback;
  }
}

/**
 * Safely serialize and save a value to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to serialize and store
 * @returns {boolean} True if successful, false otherwise
 */
function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[utilities] Error saving key "${key}" to localStorage:`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - Storage key to remove
 */
function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[utilities] Error removing key "${key}" from localStorage:`, error);
  }
}

/**
 * Clear all items from localStorage
 */
function clearStorage() {
  try {
    localStorage.clear();
  } catch (error) {
    console.warn('[utilities] Error clearing localStorage:', error);
  }
}

// ============================================================================
// 2. CART LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Retrieve current cart array from localStorage
 * @returns {Array} Cart items array
 */
function getCart() {
  const cart = getStorage(STORAGE_KEYS.CART, []);
  return Array.isArray(cart) ? cart : [];
}

/**
 * Save cart array to localStorage and refresh badge counts
 * @param {Array} cart - Updated cart items array
 */
function saveCart(cart) {
  setStorage(STORAGE_KEYS.CART, cart);
  updateCartBadge();
}

/**
 * Calculate total quantity of items in cart
 * @returns {number} Total item count
 */
function getCartCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
}

/**
 * Calculate total price of items in cart
 * @returns {number} Subtotal price in EGP
 */
function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
}

/**
 * Updates all navbar cart badge counters across the page
 */
function updateCartBadge() {
  if (typeof document === 'undefined') return;
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
  });
}

/**
 * Add a product to the cart or increment its quantity
 * @param {Object} product - Product object ({ id, title, price, imageCover, category })
 * @param {number} quantity - Quantity to add (default: 1)
 */
function addToCart(product, quantity = 1) {
  if (!product || !product.id) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 0) + Number(quantity);
  } else {
    cart.push({
      id: product.id,
      title: product.title || 'Product',
      price: Number(product.price) || 0,
      imageCover: product.imageCover || product.image || '',
      category: product.category || 'General',
      quantity: Number(quantity) || 1
    });
  }

  saveCart(cart);
}

/**
 * Update quantity for a specific product in the cart
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity (removes if <= 0)
 */
function updateCartQuantity(productId, quantity) {
  let cart = getCart();
  const numQty = Number(quantity);

  if (numQty <= 0) {
    removeFromCart(productId);
    return;
  }

  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity = numQty;
    saveCart(cart);
  }
}

/**
 * Remove an item from the cart by its ID
 * @param {string} productId - Product ID to remove
 */
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
}

/**
 * Clear all items from the cart
 */
function clearCart() {
  saveCart([]);
}

// ============================================================================
// 3. WISHLIST LOCAL STORAGE HELPERS
// ============================================================================

/**
 * Retrieve wishlist array from localStorage
 * @returns {Array} Wishlist item IDs or objects
 */
function getWishlist() {
  const wishlist = getStorage(STORAGE_KEYS.WISHLIST, []);
  return Array.isArray(wishlist) ? wishlist : [];
}

/**
 * Save wishlist array to localStorage and update badge
 * @param {Array} wishlist - Array of wishlist items
 */
function saveWishlist(wishlist) {
  setStorage(STORAGE_KEYS.WISHLIST, wishlist);
  updateWishlistBadge();
}

/**
 * Check if a product is in the wishlist
 * @param {string} productId - Product ID
 * @returns {boolean} True if wishlisted
 */
function isInWishlist(productId) {
  const wishlist = getWishlist();
  return wishlist.some(item => (typeof item === 'string' ? item === productId : item.id === productId));
}

/**
 * Toggle a product in/out of the wishlist
 * @param {Object|string} product - Product object or productId string
 * @returns {boolean} True if added, false if removed
 */
function toggleWishlist(product) {
  const productId = typeof product === 'string' ? product : product.id;
  let wishlist = getWishlist();
  const exists = wishlist.some(item => (typeof item === 'string' ? item === productId : item.id === productId));

  if (exists) {
    wishlist = wishlist.filter(item => (typeof item === 'string' ? item !== productId : item.id !== productId));
    saveWishlist(wishlist);
    return false;
  } else {
    wishlist.push(product);
    saveWishlist(wishlist);
    return true;
  }
}

/**
 * Update wishlist badges across the page
 */
function updateWishlistBadge() {
  if (typeof document === 'undefined') return;
  const wishlist = getWishlist();
  document.querySelectorAll('.wishlist-badge').forEach(badge => {
    badge.textContent = wishlist.length;
  });
}

// ============================================================================
// 4. AUTO-INITIALIZE ON PAGE LOAD
// ============================================================================

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateCartBadge();
      updateWishlistBadge();
    });
  } else {
    updateCartBadge();
    updateWishlistBadge();
  }
}
