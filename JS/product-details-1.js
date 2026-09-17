/**
 * FreshCart - Product Details (product-details.js)
 * 
 * Simple, efficient script to fetch product details from Route API and display them.
 */

const API_URL = 'https://ecommerce.routemisr.com/api/v1/products';
const CART_KEY = 'freshcart_cart';
const DEFAULT_ID = '6428dfa0dc1175abc65ca067';

let currentProduct = null;

// 1. Get Product ID from URL
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || DEFAULT_ID;
}

// 2. Fetch product details from Route API
async function fetchProductDetails(id = getProductId()) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const result = await res.json();
    currentProduct = result.data;
    displayProductDetails(currentProduct);
  } catch (error) {
    console.error('Error fetching product details:', error);
  }
}

// 3. Display product details in the DOM
function displayProductDetails(product) {
  if (!product) return;

  document.title = `${product.title} - FreshCart`;

  // Gallery: main image and thumbnails
  const mainImg = document.getElementById('main-product-image');
  if (mainImg) mainImg.src = product.imageCover;

  const thumbContainer = document.getElementById('thumbnails-container');
  const images = product.images?.length ? product.images : [product.imageCover];
  if (thumbContainer) {
    thumbContainer.innerHTML = images.map((img, i) => `
      <div class="thumb-box ${i === 0 ? 'active' : ''}" onclick="switchMainImage(this, '${img}')">
        <img src="${img}" alt="${product.title}" />
      </div>
    `).join('');
  }

  // Text, badges, and pricing
  const titleElem = document.getElementById('product-title');
  const catBadge = document.getElementById('product-category-badge');
  const brandBadge = document.getElementById('product-brand-badge');
  const priceElem = document.getElementById('product-price');
  const descElem = document.getElementById('product-desc');
  const ratingElem = document.getElementById('product-rating-text');
  const totalElem = document.getElementById('product-total-price');

  if (titleElem) titleElem.textContent = product.title;
  if (catBadge) catBadge.textContent = product.category?.name || "Fashion";
  if (brandBadge) brandBadge.textContent = product.brand?.name || "FreshCart";
  if (priceElem) priceElem.textContent = `${product.price} EGP`;
  if (descElem) descElem.textContent = product.description || '';
  if (ratingElem) ratingElem.textContent = `${product.ratingsAverage || 4.5} (${product.ratingsQuantity || 0} reviews)`;
  if (totalElem) totalElem.textContent = `${product.price.toFixed(2)} EGP`;

  updateCartBadge();
}

// 4. Switch main image on thumbnail click
function switchMainImage(thumb, src) {
  const mainImg = document.getElementById('main-product-image');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.thumb-box').forEach(b => b.classList.remove('active'));
  if (thumb) thumb.classList.add('active');
}

// 5. Quantity Stepper and Total Price Calculation
function updatePrice() {
  const qty = Number(document.getElementById('product-qty-input')?.value) || 1;
  const totalElem = document.getElementById('product-total-price');
  if (totalElem && currentProduct) {
    totalElem.textContent = `${(currentProduct.price * qty).toFixed(2)} EGP`;
  }
}

function incrementQuantity() {
  const input = document.getElementById('product-qty-input');
  if (input) {
    input.value = Number(input.value || 1) + 1;
    updatePrice();
  }
}

function decrementQuantity() {
  const input = document.getElementById('product-qty-input');
  if (input && Number(input.value) > 1) {
    input.value = Number(input.value) - 1;
    updatePrice();
  }
}

// 6. Update navbar cart badge from localStorage
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  document.querySelectorAll('.cart-badge').forEach(b => b.textContent = count);
}

// 7. Add to Cart with localStorage persistence
function addToCartDetailed() {
  if (currentProduct) {
    const qty = Number(document.getElementById('product-qty-input')?.value) || 1;
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const id = currentProduct._id || currentProduct.id;
    const existing = cart.find(i => i.id === id);

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: id,
        title: currentProduct.title,
        price: currentProduct.price,
        imageCover: currentProduct.imageCover,
        category: currentProduct.category?.name || "Fashion",
        quantity: qty
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  const btn = document.getElementById('btn-add-cart');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Add to Cart';
    }, 1000);
  }
}

// 8. Buy Now: Add to Cart and redirect
function buyNowDetailed() {
  addToCartDetailed();
  const isSub = window.location.pathname.includes('/Pages/');
  setTimeout(() => {
    window.location.href = isSub ? 'Cart.html' : './Pages/Cart.html';
  }, 200);
}

// 9. Interactive UI helpers
function toggleWishlistDetailed() {
  const icon = document.querySelector('#btn-wishlist i');
  if (icon) icon.classList.toggle('text-danger');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-btn-${tabId}`)?.classList.add('active');
  document.getElementById(`tab-pane-${tabId}`)?.classList.add('active');
}

function shareProductDetailed() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    alert('Product link copied to clipboard!');
  }
}

// Aliases for compatibility
const fetchProduct = fetchProductDetails;
const displayProduct = displayProductDetails;

// Run on page ready
document.addEventListener('DOMContentLoaded', () => {
  fetchProductDetails();
});
