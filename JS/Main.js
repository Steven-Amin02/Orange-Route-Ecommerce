/**
 * FreshCart - Main JavaScript (Main.js)
 * 
 * Core Features:
 * - fetchData: Loads products from Route API
 * - getSpecificProduct: Fetches a single specific product from Route API by ID
 * - searchProducts: Real-time search by keyword or specific product ID
 * - filterProducts: Filters products by category using the Route API
 * - getProduct: Returns card HTML template
 * - display: Renders products into the container
 * - setupProductActions: Handles Add to Cart and Wishlist click interactions
 */

const API_URL = 'https://ecommerce.routemisr.com/api/v1/products';
const CART_KEY = 'freshcart_cart';

// Route API Category IDs
const CATEGORY_MAP = {
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
};

let allProducts = [];

// 1. Generate 5-star rating HTML icons
function renderRatingStars(rating = 0) {
  const rounded = Math.round(rating * 2) / 2;
  return Array.from({ length: 5 }, (_, i) => {
    if (i + 1 <= rounded) return '<i class="fa-solid fa-star"></i>';
    if (i + 0.5 === rounded) return '<i class="fa-solid fa-star-half-stroke"></i>';
    return '<i class="fa-regular fa-star"></i>';
  }).join('');
}

// 2. Returns HTML for an individual product card
function getProduct(product) {
  const id = product.id || product._id || '';
  const title = product.title || 'Product Title';
  const categoryName = product.category?.name || "Women's Fashion";
  const imageCover = product.imageCover || product.image || './images/image-1.png';
  const price = product.price || 0;
  const ratingAvg = product.ratingsAverage || 4.0;
  const ratingCount = product.ratingsQuantity || 0;

  return `
    <div class="product-card" data-id="${id}">
      <div class="product-img-box">
        <a href="product-details.html?id=${id}" class="d-block w-100 h-100 text-decoration-none">
          <img src="${imageCover}" alt="${title}" class="product-img" loading="lazy"
            onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=FreshCart';" />
        </a>
        <div class="product-actions">
          <button class="btn-product-action action-wishlist" title="Add to Wishlist" aria-label="Add to Wishlist">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="btn-product-action action-compare" title="Compare" aria-label="Compare">
            <i class="fa-solid fa-arrows-rotate"></i>
          </button>
          <a href="product-details.html?id=${id}" class="btn-product-action action-view text-decoration-none" title="Quick View" aria-label="Quick View">
            <i class="fa-regular fa-eye"></i>
          </a>
        </div>
      </div>

      <div class="product-info">
        <span class="product-category-label">${categoryName}</span>
        <h3 class="product-name">
          <a href="product-details.html?id=${id}" title="${title}">${title}</a>
        </h3>
        <div class="product-rating">
          <div class="rating-stars">${renderRatingStars(ratingAvg)}</div>
          <span class="rating-count">${ratingAvg} (${ratingCount})</span>
        </div>
        <div class="product-footer">
          <span class="product-price-val">${price} EGP</span>
          <button class="btn-add-cart" title="Add to Cart" aria-label="Add to Cart">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// 3. Display products in the grid container
function display(products) {
  const container = document.getElementById('products-container');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="text-muted text-center col-12 py-5">No products found.</p>';
    return;
  }

  container.innerHTML = products.map(getProduct).join('');
}

// 4. Fetch all products from Route API
async function fetchData() {
  const container = document.getElementById('products-container');
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}?limit=40`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    allProducts = result.data || [];
    display(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    if (!container.children.length) {
      container.innerHTML = '<p class="text-danger text-center col-12 py-5">Unable to load products. Please check your connection.</p>';
    }
  }
}

// 5. Get a specific product from API by ID
async function getSpecificProduct(id) {
  const container = document.getElementById('products-container');
  if (!container || !id) return;

  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    if (result.data) {
      display([result.data]);
      document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error(`Error fetching specific product (${id}):`, error);
  }
}

// 6. Search products (by title keyword, or specific ID from API)
function searchProducts(query) {
  const term = (query || '').trim().toLowerCase();
  if (!term) {
    display(allProducts);
    return;
  }

  // If query is an exact 24-character hex ID, fetch specific product from API
  if (/^[a-f\d]{24}$/i.test(term)) {
    getSpecificProduct(term);
    return;
  }

  // Filter loaded products by title or category
  const filtered = allProducts.filter(p =>
    p.title?.toLowerCase().includes(term) ||
    p.category?.name?.toLowerCase().includes(term)
  );

  display(filtered);
}

// 7. Filter products by category using the Route API
async function filterProducts(category) {
  if (!category || category === 'all') {
    display(allProducts);
    return;
  }

  const catKey = category.toLowerCase().trim();
  const categoryId = CATEGORY_MAP[catKey] || category;

  try {
    const response = await fetch(`${API_URL}?category[in]=${categoryId}&limit=40`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();

    if (Array.isArray(result.data) && result.data.length > 0) {
      display(result.data);
      return;
    }
  } catch (e) {
    console.warn('API category filter failed, falling back to local filter:', e);
  }

  // Fallback: filter locally from allProducts
  const filtered = allProducts.filter(p =>
    p.category?.name?.toLowerCase() === catKey ||
    p.category?._id === categoryId
  );
  display(filtered);
}

// 8. Update Cart Badge across navbar
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  document.querySelectorAll('.cart-badge').forEach(badge => badge.textContent = count);
}

// 9. Card event delegation (Add to Cart & Wishlist toggle)
function setupProductActions() {
  const container = document.getElementById('products-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    // Add to Cart
    const addBtn = e.target.closest('.btn-add-cart');
    if (addBtn) {
      e.preventDefault();
      const card = addBtn.closest('.product-card');
      const id = card?.dataset.id;
      const product = allProducts.find(p => (p._id || p.id) === id);

      if (product) {
        const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        const existing = cart.find(i => i.id === id);
        if (existing) {
          existing.quantity = (Number(existing.quantity) || 1) + 1;
        } else {
          cart.push({
            id: id,
            title: product.title,
            price: product.price,
            imageCover: product.imageCover,
            category: product.category?.name || "Fashion",
            quantity: 1
          });
        }
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
      }

      // Visual feedback animation
      addBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => { addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>'; }, 800);
      return;
    }

    // Wishlist toggle
    const wishBtn = e.target.closest('.action-wishlist');
    if (wishBtn) {
      e.preventDefault();
      const icon = wishBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-solid');
        icon.classList.toggle('fa-regular');
        icon.classList.toggle('text-danger');
      }
    }
  });
}

// 10. Bind search and category filter event listeners
function setupSearchAndFilter() {
  // Search inputs
  ['header-search-input', 'mobile-search-input'].forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', (e) => searchProducts(e.target.value));
      input.closest('form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        searchProducts(input.value);
        document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  });

  // Category cards click filter
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const catName = card.querySelector('.category-card-name')?.textContent?.trim();
      if (catName) {
        filterProducts(catName);
        document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // View All Categories reset button
  const viewAllBtn = document.querySelector('.category-view-all');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      display(allProducts);
      document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// Aliases for compatibility
const fetchProducts = fetchData;
const displayProducts = display;
const createProductCardHTML = getProduct;

// Run on page ready
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  fetchData();
  setupProductActions();
  setupSearchAndFilter();
});
