/**
 * FreshCart - Main JavaScript
 * 
 * Featured Products Component & API Integration
 * Data is currently statically rendered in index.html matching the exact design.
 * When you are ready to fetch dynamically from your API, call fetchProducts().
 */

// API Configuration
const API_CONFIG = {
  baseUrl: 'https://ecommerce.routemisr.com/api/v1',
  productsEndpoint: '/products'
};

/**
 * Generate rating stars HTML based on numeric rating (e.g. 4.6)
 * @param {number} rating - Average rating score
 * @returns {string} HTML string of 5 star icons
 */
function renderRatingStars(rating = 0) {
  let starsHtml = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = (rating - fullStars) >= 0.4 && (rating - fullStars) < 0.8;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

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
      <!-- Top Image Box with Floating Actions -->
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
 * Render a list of products into the #products-container
 * @param {Array} products - Array of product objects
 */
function renderProducts(products) {
  const container = document.getElementById('products-container');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="text-muted text-center col-12 py-5">No products found.</p>';
    return;
  }

  container.innerHTML = products.map(createProductCardHTML).join('');
  attachProductEvents();
}

/**
 * Fetch products from Route eCommerce API (or custom backend)
 * Ready to be invoked whenever you want to load live API data!
 */
async function fetchProducts() {
  const container = document.getElementById('products-container');
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.productsEndpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const products = result.data || result;
    
    // Render the fetched products
    renderProducts(products);
  } catch (error) {
    console.error('Failed to fetch products from API:', error);
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

// Initialize card interactions on page load
document.addEventListener('DOMContentLoaded', () => {
  attachProductEvents();
  
  // UNCOMMENT THIS LINE WHEN YOU ARE READY TO FETCH DATA FROM THE API:
  // fetchProducts();
});
