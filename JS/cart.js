/**
 * FreshCart - Cart Page Script (cart.js)
 */

const CART_KEY = 'freshcart_cart';

// Initial default items for demonstration
const DEFAULT_CART = [
  { id: '6428ebc6dc1175abc65ca0b9', title: 'Woman Shawl', category: "Women's Fashion", price: 149, quantity: 1, imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680403397402-cover.jpeg' },
  { id: '6428eb43dc1175abc65ca0b3', title: 'Woman Bordeaux Blouse', category: "Women's Fashion", price: 349, quantity: 1, imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680403266739-cover.jpeg' }
];

// 1. Get cart from localStorage
function getCart() {
  const saved = localStorage.getItem(CART_KEY);
  if (!saved) {
    localStorage.setItem(CART_KEY, JSON.stringify(DEFAULT_CART));
    return DEFAULT_CART;
  }
  try {
    return JSON.parse(saved) || [];
  } catch {
    return [];
  }
}

// 2. Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  displayCart();
}

// 3. Change item quantity (+1 or -1)
function changeQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity < 1) item.quantity = 1;
    saveCart(cart);
  }
}

// 4. Remove single item
function removeCartItem(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

// 5. Clear entire cart
function clearCart() {
  saveCart([]);
}

// 6. Display cart items and summary
function displayCart() {
  const cart = getCart();
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  const totalQty = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);

  // Update navbar badge and order summary elements
  document.querySelectorAll('.cart-badge').forEach(b => b.textContent = totalQty);
  const subtotalElem = document.getElementById('summary-subtotal-price');
  const totalElem = document.getElementById('summary-estimated-total');
  const countText = document.getElementById('cart-item-count-text');
  const summaryCount = document.getElementById('summary-items-count');

  if (subtotalElem) subtotalElem.textContent = `${totalPrice} EGP`;
  if (totalElem) totalElem.textContent = `${totalPrice} EGP`;
  if (countText) countText.textContent = `${totalQty} items`;
  if (summaryCount) summaryCount.textContent = `(${totalQty} items)`;

  const isSub = window.location.pathname.includes('/Pages/');
  const homeLink = isSub ? '../index.html' : 'index.html';
  const detailsPage = isSub ? 'ProductDetails.html' : 'product-details.html';

  // Empty cart view
  if (cart.length === 0) {
    document.getElementById('cart-bottom-actions-bar')?.classList.add('d-none');
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-solid fa-cart-shopping fa-3x text-muted mb-3"></i>
        <h4 class="fw-bold">Your cart is empty</h4>
        <p class="text-secondary">Looks like you haven't added anything yet.</p>
        <a href="${homeLink}" class="btn btn-success rounded-pill mt-2">Start Shopping</a>
      </div>`;
    return;
  }

  document.getElementById('cart-bottom-actions-bar')?.classList.remove('d-none');

  // Render items
  container.innerHTML = cart.map(item => `
    <div class="cart-item-card" id="cart-item-${item.id}">
      <div class="cart-item-left">
        <a href="${detailsPage}?id=${item.id}" class="cart-item-img-box text-decoration-none">
          <img src="${item.imageCover}" alt="${item.title}" class="cart-item-img" />
        </a>
        <div class="cart-item-info">
          <a href="${detailsPage}?id=${item.id}" class="cart-item-title">${item.title}</a>
          <span class="cart-item-category">${item.category || "Women's Fashion"}</span>
          <div class="cart-item-unit-price">${item.price} EGP</div>
          <div class="cart-stepper">
            <button type="button" class="cart-stepper-btn-minus" onclick="changeQuantity('${item.id}', -1)" aria-label="Decrease">
              <i class="fa-solid fa-minus"></i>
            </button>
            <input type="text" class="cart-stepper-val" value="${item.quantity}" readonly />
            <button type="button" class="cart-stepper-btn-plus" onclick="changeQuantity('${item.id}', 1)" aria-label="Increase">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-total-block">
          <div class="cart-item-total-label">Total</div>
          <div class="cart-item-total-price">${item.price * item.quantity} <span>EGP</span></div>
        </div>
        <button type="button" class="cart-item-delete-btn" onclick="removeCartItem('${item.id}')" title="Remove item">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Aliases
const renderCart = displayCart;

// Run on page load
document.addEventListener('DOMContentLoaded', displayCart);
