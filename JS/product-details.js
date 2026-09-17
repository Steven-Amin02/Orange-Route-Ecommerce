/**
 * FreshCart - Product Details Page JavaScript
 * 
 * Dynamically fetches product details from Route eCommerce API via URL search param ?id=...
 * Defaults to "Woman Shawl" if no ID is passed or offline.
 */

// Global state
let currentProduct = {
  id: '6428ebc6dc1175abc65ca0b9',
  title: 'Woman Shawl',
  category: "Women's Fashion",
  subcategory: "Women's Clothing",
  brand: 'DeFacto',
  price: 149,
  quantity: 220,
  ratingsAverage: 4,
  ratingsQuantity: 41,
  description: 'Material Polyester Blend Colour Name Multicolour Department Women',
  imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680403397402-cover.jpeg',
  images: [
    'https://ecommerce.routemisr.com/Route-Academy-products/1680403397482-1.jpeg',
    'https://ecommerce.routemisr.com/Route-Academy-products/1680403397482-2.jpeg',
    'https://ecommerce.routemisr.com/Route-Academy-products/1680403397483-3.jpeg',
    'https://ecommerce.routemisr.com/Route-Academy-products/1680403397485-4.jpeg'
  ]
};

let currentQuantity = 1;

/**
 * Initialize page on load
 */
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    await loadProductFromAPI(productId);
  } else {
    // Render default product from screenshot
    renderProductDetails(currentProduct);
  }
});

/**
 * Fetch product details from Route API
 * @param {string} id - Product ID
 */
async function loadProductFromAPI(id) {
  try {
    const response = await fetch(`https://ecommerce.routemisr.com/api/v1/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to load product: ${response.status}`);
    }
    const result = await response.json();
    const data = result.data;

    currentProduct = {
      id: data._id || data.id,
      title: data.title || 'Product',
      category: data.category?.name || "Women's Fashion",
      subcategory: data.subcategory?.[0]?.name || "Women's Clothing",
      brand: data.brand?.name || 'DeFacto',
      price: data.price || 0,
      quantity: data.quantity || 100,
      ratingsAverage: data.ratingsAverage || 4.0,
      ratingsQuantity: data.ratingsQuantity || 0,
      description: data.description ? data.description.replace(/\t/g, ' ').replace(/\n/g, ' ') : '',
      imageCover: data.imageCover,
      images: data.images && data.images.length > 0 ? data.images : [data.imageCover]
    };

    renderProductDetails(currentProduct);
  } catch (error) {
    console.error('Error fetching product from API, rendering fallback:', error);
    renderProductDetails(currentProduct);
  }
}

/**
 * Render product details to DOM
 * @param {Object} product - Product details object
 */
function renderProductDetails(product) {
  document.title = `${product.title} - FreshCart`;

  // Breadcrumbs
  const breadcrumbCat = document.getElementById('breadcrumb-cat');
  const breadcrumbSubcat = document.getElementById('breadcrumb-subcat');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  if (breadcrumbCat) breadcrumbCat.textContent = product.category;
  if (breadcrumbSubcat) breadcrumbSubcat.textContent = product.subcategory;
  if (breadcrumbTitle) breadcrumbTitle.textContent = product.title;

  // Gallery Main Image
  const mainImg = document.getElementById('main-product-image');
  if (mainImg) {
    mainImg.src = product.imageCover || product.images[0];
    mainImg.alt = product.title;
  }

  // Thumbnails
  const thumbContainer = document.getElementById('thumbnails-container');
  if (thumbContainer && product.images) {
    thumbContainer.innerHTML = product.images.map((imgUrl, index) => `
      <div class="thumb-box ${index === 0 ? 'active' : ''}" onclick="switchMainImage(this, '${imgUrl}')">
        <img src="${imgUrl}" alt="${product.title} ${index + 1}" />
      </div>
    `).join('');
  }

  // Badges
  const catBadge = document.getElementById('product-category-badge');
  const brandBadge = document.getElementById('product-brand-badge');
  if (catBadge) catBadge.textContent = product.category;
  if (brandBadge) brandBadge.textContent = product.brand;

  // Title
  const titleElem = document.getElementById('product-title');
  if (titleElem) titleElem.textContent = product.title;

  // Stars & Rating
  const starsElem = document.getElementById('product-stars');
  const ratingTextElem = document.getElementById('product-rating-text');
  if (starsElem) starsElem.innerHTML = renderRatingStarsDetailed(product.ratingsAverage);
  if (ratingTextElem) ratingTextElem.textContent = `${product.ratingsAverage} (${product.ratingsQuantity} reviews)`;

  // Price
  const priceElem = document.getElementById('product-price');
  if (priceElem) priceElem.textContent = `${product.price} EGP`;

  // Stock
  const stockStatus = document.getElementById('product-stock-status');
  const availableStock = document.getElementById('product-available-stock');
  if (stockStatus) stockStatus.textContent = product.quantity > 0 ? 'In Stock' : 'Out of Stock';
  if (availableStock) availableStock.textContent = `${product.quantity} available`;

  // Description
  const descElem = document.getElementById('product-desc');
  if (descElem) descElem.textContent = product.description;

  // Quantity & Total Price
  currentQuantity = 1;
  updateQuantityAndTotal();
}

/**
 * Generate 5-star rating HTML
 */
function renderRatingStarsDetailed(rating = 0) {
  let starsHtml = '';
  const rounded = Math.round(rating * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded % 1 !== 0;
  const empty = Math.max(0, 5 - full - (half ? 1 : 0));

  for (let i = 0; i < full; i++) starsHtml += '<i class="fa-solid fa-star"></i> ';
  if (half) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i> ';
  for (let i = 0; i < empty; i++) starsHtml += '<i class="fa-regular fa-star"></i> ';

  return starsHtml;
}

/**
 * Switch main gallery image when a thumbnail is clicked
 */
function switchMainImage(thumbElement, newSrc) {
  const mainImg = document.getElementById('main-product-image');
  if (mainImg) {
    mainImg.style.opacity = '0.5';
    mainImg.src = newSrc;
    setTimeout(() => {
      mainImg.style.opacity = '1';
    }, 150);
  }

  // Update active border
  document.querySelectorAll('.thumb-box').forEach(el => el.classList.remove('active'));
  thumbElement.classList.add('active');
}

/**
 * Increase quantity
 */
function incrementQuantity() {
  if (currentQuantity < currentProduct.quantity) {
    currentQuantity++;
    updateQuantityAndTotal();
  }
}

/**
 * Decrease quantity
 */
function decrementQuantity() {
  if (currentQuantity > 1) {
    currentQuantity--;
    updateQuantityAndTotal();
  }
}

/**
 * Update quantity input and Total Price Box
 */
function updateQuantityAndTotal() {
  const qtyInput = document.getElementById('product-qty-input');
  const totalPriceElem = document.getElementById('product-total-price');

  if (qtyInput) qtyInput.value = currentQuantity;
  if (totalPriceElem) {
    const total = currentQuantity * currentProduct.price;
    totalPriceElem.textContent = `${total.toFixed(2)} EGP`;
  }
}

/**
 * Add to Cart click feedback
 */
function addToCartDetailed() {
  const btn = document.getElementById('btn-add-cart');
  if (!btn) return;

  const originalContent = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Added to Cart!</span>';
  btn.style.backgroundColor = '#15803d';

  // Increment header badge
  const cartBadge = document.querySelector('.cart-badge');
  if (cartBadge) {
    const count = parseInt(cartBadge.textContent || '0') + currentQuantity;
    cartBadge.textContent = count;
  }

  setTimeout(() => {
    btn.innerHTML = originalContent;
    btn.style.backgroundColor = '';
  }, 1500);
}

/**
 * Toggle Wishlist button
 */
function toggleWishlistDetailed() {
  const btn = document.getElementById('btn-wishlist');
  if (!btn) return;

  const icon = btn.querySelector('i');
  if (icon.classList.contains('fa-regular')) {
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
    icon.style.color = '#ef4444';
    btn.style.borderColor = '#fca5a5';
  } else {
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
    icon.style.color = '';
    btn.style.borderColor = '';
  }
}
