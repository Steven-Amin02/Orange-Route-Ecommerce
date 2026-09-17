/**
 * FreshCart - Product Details Page JavaScript
 * 
 * Matches the design and features shown in the reference screenshot:
 * - Dynamic product loading from Route eCommerce API (?id=...)
 * - Default product: "Logo T-Shirt Green" (Jack & Jones)
 * - Image gallery with thumbnail switching
 * - Quantity stepper and dynamic total price calculation
 * - Product Details, Reviews, and Shipping & Returns tabs
 * - "You May Also Like" related products slider/grid
 */

// Default product matching the screenshot
let currentProduct = {
  id: '6428dfa0dc1175abc65ca067',
  title: 'Logo T-Shirt Green',
  category: "Men's Fashion",
  categoryId: '6439d5b90049ad0b52b90048',
  subcategory: "Men's Clothing",
  brand: 'Jack & Jones',
  price: 379,
  oldPrice: 744,
  discount: 49,
  quantity: 11,
  sold: '279+ sold',
  ratingsAverage: 4.7,
  ratingsQuantity: 124,
  description: 'Soft and comfortable cotton fabric Crew neck and short sleeves Comfortable, regular fit Wash according to care label instructions',
  imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680400287654-cover.jpeg',
  images: [
    'https://ecommerce.routemisr.com/Route-Academy-products/1680400287765-1.jpeg',
    'https://ecommerce.routemisr.com/Route-Academy-products/1680400287767-4.jpeg',
    'https://ecommerce.routemisr.com/Route-Academy-products/1680400287767-3.jpeg',
    'https://ecommerce.routemisr.com/Route-Academy-products/1680400287765-2.jpeg'
  ],
  reviews: [
    {
      user: { name: 'David Samir' },
      rating: 5,
      review: 'The fabric quality is amazing and very comfortable to wear. The size fits perfectly and the color is exactly like the pictures.',
      date: 'April 2026'
    },
    {
      user: { name: 'Moustafa Ragab' },
      rating: 5,
      review: 'Great material, genuine Jack & Jones quality, fast delivery!',
      date: 'May 2026'
    },
    {
      user: { name: 'Abdulrahman Fikry' },
      rating: 4,
      review: 'Very nice t-shirt, fits true to size and feels premium.',
      date: 'July 2026'
    }
  ]
};

// Fallback related products matching screenshot
const defaultRelatedProducts = [
  {
    id: '6428def9dc1175abc65ca061',
    title: 'Drus Leather Boots Anthracite',
    category: "Men's Fashion",
    brand: 'Jack & Jones',
    price: 3064,
    oldPrice: 4829,
    discount: 37,
    ratingsAverage: 4.8,
    ratingsQuantity: 19,
    imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680400120400-cover.jpeg'
  },
  {
    id: '6428de2adc1175abc65ca05b',
    title: 'Softride Enzo NXT CASTLEROCK-High Risk R',
    category: "Men's Fashion",
    brand: 'Puma',
    price: 2599,
    ratingsAverage: 4.5,
    ratingsQuantity: 2,
    imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680399913757-cover.jpeg'
  },
  {
    id: '6428dd2edc1175abc65ca055',
    title: 'ESS Big Logo Hoodie TR Puma Black',
    category: "Men's Fashion",
    brand: 'Puma',
    price: 2599,
    oldPrice: 3299,
    discount: 21,
    ratingsAverage: 4.3,
    ratingsQuantity: 8,
    imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680399661234-cover.jpeg'
  },
  {
    id: '6428d132dc1175abc65ca04f',
    title: 'Sportswear Club Graphic Hoodie Blue',
    category: "Men's Fashion",
    brand: 'Nike',
    price: 1474,
    oldPrice: 2849,
    discount: 48,
    ratingsAverage: 4.5,
    ratingsQuantity: 6,
    imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680396593789-cover.jpeg'
  },
  {
    id: '6428cf07dc1175abc65ca049',
    title: 'NSW Everyday Essentials No-Show Socks (Pack of 3)...',
    category: "Men's Fashion",
    brand: 'Nike',
    price: 634,
    oldPrice: 1059,
    discount: 40,
    ratingsAverage: 4.1,
    ratingsQuantity: 7,
    imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/1680396038304-cover.jpeg'
  }
];

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
    renderProductDetails(currentProduct);
    renderRelatedProducts(defaultRelatedProducts);
  }
});

/**
 * Fetch product details from Route API
 * @param {string} id - Product ID
 */
async function loadProductFromAPI(id) {
  try {
    const response = await fetch(`https://ecommerce.routemisr.com/api/v1/products/${id}`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const result = await response.json();
    const data = result.data;

    let finalPrice = data.price || 0;
    let oldPrice = null;
    let discount = 0;

    if (data.priceAfterDiscount && data.priceAfterDiscount < data.price) {
      finalPrice = data.priceAfterDiscount;
      oldPrice = data.price;
      discount = Math.round(((data.price - data.priceAfterDiscount) / data.price) * 100);
    }

    currentProduct = {
      id: data._id || data.id,
      title: data.title || 'Product',
      category: data.category?.name || "Men's Fashion",
      categoryId: data.category?._id,
      subcategory: data.subcategory?.[0]?.name || "Clothing",
      brand: data.brand?.name || 'FreshCart',
      price: finalPrice,
      oldPrice: oldPrice,
      discount: discount,
      quantity: data.quantity || 11,
      sold: `${data.sold || 279}+ sold`,
      ratingsAverage: data.ratingsAverage || 4.7,
      ratingsQuantity: data.ratingsQuantity || 12,
      description: data.description ? data.description.replace(/\t/g, ' ').replace(/\n/g, ' ') : '',
      imageCover: data.imageCover,
      images: data.images && data.images.length > 0 ? data.images : [data.imageCover],
      reviews: data.reviews && data.reviews.length > 0 ? data.reviews : currentProduct.reviews
    };

    renderProductDetails(currentProduct);
    loadRelatedProducts(currentProduct.categoryId);
  } catch (error) {
    console.error('Failed to load product from API:', error);
    renderProductDetails(currentProduct);
    renderRelatedProducts(defaultRelatedProducts);
  }
}

/**
 * Load related products from Route API
 */
async function loadRelatedProducts(categoryId) {
  if (!categoryId) {
    renderRelatedProducts(defaultRelatedProducts);
    return;
  }

  try {
    const res = await fetch(`https://ecommerce.routemisr.com/api/v1/products?category[in]=${categoryId}&limit=6`);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    const items = json.data
      .filter(p => (p._id || p.id) !== currentProduct.id)
      .slice(0, 5)
      .map(p => {
        let finalPrice = p.price;
        let oldPrice = null;
        let discount = 0;
        if (p.priceAfterDiscount && p.priceAfterDiscount < p.price) {
          finalPrice = p.priceAfterDiscount;
          oldPrice = p.price;
          discount = Math.round(((p.price - p.priceAfterDiscount) / p.price) * 100);
        }
        return {
          id: p._id || p.id,
          title: p.title,
          category: p.category?.name || "Men's Fashion",
          brand: p.brand?.name || '',
          price: finalPrice,
          oldPrice: oldPrice,
          discount: discount,
          ratingsAverage: p.ratingsAverage || 4.5,
          ratingsQuantity: p.ratingsQuantity || 10,
          imageCover: p.imageCover
        };
      });

    if (items.length > 0) {
      renderRelatedProducts(items);
    } else {
      renderRelatedProducts(defaultRelatedProducts);
    }
  } catch (err) {
    renderRelatedProducts(defaultRelatedProducts);
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

  // Gallery Thumbnails
  const thumbContainer = document.getElementById('thumbnails-container');
  if (thumbContainer && product.images) {
    thumbContainer.innerHTML = product.images.map((imgUrl, index) => `
      <div class="thumb-box ${index === 0 ? 'active' : ''}" onclick="switchMainImage(this, '${imgUrl}')">
        <img src="${imgUrl}" alt="${product.title} view ${index + 1}" />
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

  // Price Block
  const priceElem = document.getElementById('product-price');
  const oldPriceElem = document.getElementById('product-old-price');
  const discountBadge = document.getElementById('product-discount-badge');

  if (priceElem) priceElem.textContent = `${product.price} EGP`;
  if (oldPriceElem) {
    if (product.oldPrice) {
      oldPriceElem.textContent = `${product.oldPrice} EGP`;
      oldPriceElem.style.display = 'inline';
    } else {
      oldPriceElem.style.display = 'none';
    }
  }
  if (discountBadge) {
    if (product.discount) {
      discountBadge.textContent = `Save ${product.discount}%`;
      discountBadge.style.display = 'inline-block';
    } else {
      discountBadge.style.display = 'none';
    }
  }

  // Stock Status & Count
  const stockStatus = document.getElementById('product-stock-status');
  const availableStock = document.getElementById('product-available-stock');
  if (stockStatus) stockStatus.textContent = product.quantity > 0 ? 'In Stock' : 'Out of Stock';
  if (availableStock) availableStock.textContent = `${product.quantity} available`;

  // Description
  const descElem = document.getElementById('product-desc');
  const tabDescElem = document.getElementById('tab-product-desc');
  if (descElem) descElem.textContent = product.description;
  if (tabDescElem) tabDescElem.textContent = product.description;

  // Tab Specs Table
  const specCategory = document.getElementById('spec-category');
  const specSubcat = document.getElementById('spec-subcategory');
  const specBrand = document.getElementById('spec-brand');
  const specSold = document.getElementById('spec-sold');
  if (specCategory) specCategory.textContent = product.category;
  if (specSubcat) specSubcat.textContent = product.subcategory;
  if (specBrand) specBrand.textContent = product.brand;
  if (specSold) specSold.textContent = product.sold || '279+ sold';

  // Reviews Tab Badge
  const reviewsTabBadge = document.getElementById('tab-reviews-count');
  if (reviewsTabBadge) {
    reviewsTabBadge.textContent = `Reviews (${product.ratingsQuantity || 12})`;
  }

  // Render Reviews List
  renderReviewsList(product.reviews || []);

  // Quantity & Total Price
  currentQuantity = 1;
  updateQuantityAndTotal();
}

/**
 * Render related products
 */
function renderRelatedProducts(products) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  const isSubfolder = window.location.pathname.includes('/Pages/');
  const detailsHref = isSubfolder ? 'ProductDetails.html' : 'product-details.html';

  container.innerHTML = products.map(p => `
    <div class="col">
      <div class="product-card h-100" data-id="${p.id}">
        <div class="product-img-box position-relative">
          ${p.discount ? `<span class="product-badge-discount">-${p.discount}%</span>` : ''}
          <div class="product-actions">
            <button class="btn-product-action action-wishlist" title="Add to Wishlist" onclick="event.preventDefault(); this.querySelector('i').classList.toggle('fa-solid'); this.querySelector('i').classList.toggle('text-danger');">
              <i class="fa-regular fa-heart"></i>
            </button>
            <button class="btn-product-action action-compare" title="Compare">
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>
            <a href="${detailsHref}?id=${p.id}" class="btn-product-action action-view text-decoration-none" title="Quick View">
              <i class="fa-regular fa-eye"></i>
            </a>
          </div>
          <a href="${detailsHref}?id=${p.id}" class="d-flex align-items-center justify-content-center w-100 h-100">
            <img src="${p.imageCover}" alt="${p.title}" class="product-img" loading="lazy" />
          </a>
        </div>
        <div class="product-info">
          <span class="product-category-label">${p.category}</span>
          <h3 class="product-name">
            <a href="${detailsHref}?id=${p.id}" title="${p.title}">${p.title}</a>
          </h3>
          <div class="product-rating">
            <div class="rating-stars">
              ${renderRatingStarsDetailed(p.ratingsAverage)}
            </div>
            <span class="rating-count">${p.ratingsAverage} (${p.ratingsQuantity})</span>
          </div>
          <div class="product-footer">
            <div class="product-price-box">
              <span class="product-price-val">${p.price} EGP</span>
              ${p.oldPrice ? `<span class="product-old-price">${p.oldPrice} EGP</span>` : ''}
            </div>
            <button class="btn-add-cart" title="Add to Cart" onclick="addToCartDetailed('${p.title}', ${p.price})">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Render reviews list inside reviews tab
 */
function renderReviewsList(reviews) {
  const container = document.getElementById('reviews-list-container');
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = '<p class="text-muted">No reviews yet for this product. Be the first to review!</p>';
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div class="review-item p-3 mb-3 border rounded-3 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.8rem;">
            ${(r.user?.name || 'User').charAt(0).toUpperCase()}
          </div>
          <strong>${r.user?.name || 'Customer'}</strong>
        </div>
        <div class="text-warning small">
          ${renderRatingStarsDetailed(r.rating || 5)}
        </div>
      </div>
      <p class="mb-1 text-secondary small">${r.review || 'Great product!'}</p>
      ${r.date ? `<span class="text-muted" style="font-size: 0.75rem;">${r.date}</span>` : ''}
    </div>
  `).join('');
}

/**
 * Switch tabs (Product Details, Reviews, Shipping & Returns)
 */
function switchTab(tabId) {
  // Update nav button state
  document.querySelectorAll('.tab-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update content visibility
  document.querySelectorAll('.tab-pane-content').forEach(pane => pane.classList.add('d-none'));
  const activePane = document.getElementById(`tab-content-${tabId}`);
  if (activePane) activePane.classList.remove('d-none');
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
 * Switch main gallery image when thumbnail is clicked
 */
function switchMainImage(thumbElement, newSrc) {
  const mainImg = document.getElementById('main-product-image');
  if (mainImg) {
    mainImg.style.opacity = '0.4';
    mainImg.src = newSrc;
    setTimeout(() => {
      mainImg.style.opacity = '1';
    }, 150);
  }

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
function addToCartDetailed(title, price) {
  const btn = document.getElementById('btn-add-cart');
  if (btn && !title) {
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Added!</span>';
    btn.style.backgroundColor = '#15803d';

    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.style.backgroundColor = '';
    }, 1500);
  }

  // Increment header cart badge
  const cartBadges = document.querySelectorAll('.cart-badge');
  cartBadges.forEach(badge => {
    const count = parseInt(badge.textContent || '0') + (title ? 1 : currentQuantity);
    badge.textContent = count;
  });
}

/**
 * Buy Now action
 */
function buyNowDetailed() {
  addToCartDetailed();
  const isSubfolder = window.location.pathname.includes('/Pages/');
  const cartUrl = isSubfolder ? 'Cart.html' : './Pages/Cart.html';
  setTimeout(() => {
    window.location.href = cartUrl;
  }, 400);
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
    btn.style.backgroundColor = '#fef2f2';
  } else {
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
    icon.style.color = '';
    btn.style.borderColor = '';
    btn.style.backgroundColor = '';
  }
}

/**
 * Share Product
 */
function shareProductDetailed() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Product link copied to clipboard!');
    }).catch(() => {
      alert('Product URL: ' + window.location.href);
    });
  } else {
    alert('Product URL: ' + window.location.href);
  }
}
