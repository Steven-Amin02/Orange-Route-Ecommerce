/**
 * FreshCart - Main JavaScript
 * 
 * Fetches 40 products from the Route eCommerce API
 * and renders them in the home page grid (5 cards per row).
 */

// API Configuration
const API_CONFIG = {
  baseUrl: 'https://ecommerce.routemisr.com/api/v1',
  productsEndpoint: '/products',
  limit: 40
};

/**
 * Generate accurate 5-star rating HTML based on numeric rating (e.g. 4.6)
 * @param {number} rating - Average rating score
 * @returns {string} HTML string of 5 star icons
 */
function renderRatingStars(rating = 0) {
  let starsHtml = '';
  const roundedRating = Math.round(rating * 2) / 2; // rounds to nearest 0.5
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fa-solid fa-star"></i>';
  }
  // Half star
  if (hasHalfStar) {
    starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
  }
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="fa-regular fa-star"></i>';
  }

  return starsHtml;
}

/**
 * Creates the exact HTML for a single Product Card
 * Matches the FreshCart card design component
 * @param {Object} product - Product object from API
 * @returns {string} Product Card HTML
 */
function createProductCardHTML(product) {
  const id = product.id || product._id || '';
  const title = product.title || 'Product Title';
  const categoryName = product.category?.name || "Women's Fashion";
  const imageCover = product.imageCover || product.image || './images/image-1.png';
  const price = product.price || 0;
  const ratingAvg = product.ratingsAverage || 4.0;
  const ratingCount = product.ratingsQuantity || 0;

  return `
    <div class="product-card" data-id="${id}">
      <!-- Top Image Box with Floating Action Buttons -->
      <div class="product-img-box">
        <img 
          src="${imageCover}" 
          alt="${title}" 
          class="product-img" 
          loading="lazy"
          onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=FreshCart';"
        />
        <div class="product-actions">
          <button class="btn-product-action action-wishlist" title="Add to Wishlist" aria-label="Add to Wishlist" data-id="${id}">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="btn-product-action action-compare" title="Compare" aria-label="Compare" data-id="${id}">
            <i class="fa-solid fa-arrows-rotate"></i>
          </button>
          <button class="btn-product-action action-view" title="Quick View" aria-label="Quick View" data-id="${id}">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
      </div>

      <!-- Bottom Product Details -->
      <div class="product-info">
        <span class="product-category-label">${categoryName}</span>
        <h3 class="product-name">
          <a href="#product-${id}" title="${title}">${title}</a>
        </h3>
        <div class="product-rating">
          <div class="rating-stars">
            ${renderRatingStars(ratingAvg)}
          </div>
          <span class="rating-count">${ratingAvg} (${ratingCount})</span>
        </div>
        <div class="product-footer">
          <span class="product-price-val">${price} EGP</span>
          <button class="btn-add-cart" title="Add to Cart" aria-label="Add to Cart" data-id="${id}">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render products into the grid container
 * @param {Array} products - Array of product objects
 */
function renderProducts(products) {
  const container = document.getElementById('products-container');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="text-muted text-center col-12 py-5">No products found.</p>';
    return;
  }

  // Render all cards
  container.innerHTML = products.map(createProductCardHTML).join('');
  
  // Re-attach interactive button events
  attachProductEvents();
}

/**
 * Fetch 40 products from Route eCommerce API and display them in the home page
 */
async function fetchProducts() {
  const container = document.getElementById('products-container');
  if (!container) return;

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.productsEndpoint}?limit=${API_CONFIG.limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const products = (result.data || result).slice(0, API_CONFIG.limit);
    
    // Render the 40 products
    renderProducts(products);
  } catch (error) {
    console.error('Error fetching products from API:', error);
  }
}

/**
 * Attach interactive events to product action buttons
 */
function attachProductEvents() {
  // Wishlist buttons toggle active state
  document.querySelectorAll('.action-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const icon = btn.querySelector('i');
      if (icon.classList.contains('fa-regular')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.style.color = '#ef4444';
      } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        icon.style.color = '';
      }
    });
  });

  // Add to Cart button interaction
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const icon = btn.querySelector('i');
      icon.className = 'fa-solid fa-check';
      btn.style.backgroundColor = '#059669';
      setTimeout(() => {
        icon.className = 'fa-solid fa-plus';
        btn.style.backgroundColor = '';
      }, 1000);
    });
  });
}

// Automatically fetch and display 40 products on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fetchProducts);
} else {
  fetchProducts();
}
