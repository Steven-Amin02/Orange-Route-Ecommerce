/**
 * FreshCart - Wishlist Management Engine (wishlist.js)
 * 
 * Renders persisted wishlist items from FreshCart domain,
 * supports instant "Move to Cart", item removal, and cross-tab synchronization.
 */

(function () {
  'use strict';

  const API_URL = 'https://ecommerce.routemisr.com/api/v1/products';
  let wishlistProducts = [];

  async function loadWishlistItems() {
    const container = document.getElementById('wishlist-items-container');
    if (!container) return;

    const wishlistIds = FreshCart.getWishlist();
    const countBadge = document.getElementById('wishlist-count-text');

    if (countBadge) {
      countBadge.textContent = `${wishlistIds.length} item${wishlistIds.length === 1 ? '' : 's'}`;
    }

    if (!wishlistIds.length) {
      renderEmptyWishlist(container);
      return;
    }

    container.innerHTML = `
      <div class="py-5 text-center">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading wishlist items...</span>
        </div>
      </div>
    `;

    // Fetch details for all wishlisted IDs concurrently
    try {
      const fetchPromises = wishlistIds.map((id) =>
        fetch(`${API_URL}/${encodeURIComponent(id)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => json?.data || null)
          .catch(() => null)
      );

      const results = await Promise.allSettled(fetchPromises);
      wishlistProducts = results
        .filter((r) => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value);

      if (!wishlistProducts.length) {
        renderEmptyWishlist(container);
        return;
      }

      renderWishlistTable(container, wishlistProducts);
    } catch (error) {
      console.error('[FreshCart Wishlist] Error loading wishlist items:', error);
      container.innerHTML = `
        <div class="py-5 text-center text-danger">
          <p>Failed to load your wishlist items. Please try again.</p>
          <button type="button" class="btn btn-outline-success btn-sm mt-2" onclick="loadWishlistItems()">Retry</button>
        </div>
      `;
    }
  }

  function renderEmptyWishlist(container) {
    document.getElementById('wishlist-clear-all-btn')?.classList.add('d-none');
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-regular fa-heart fa-3x text-muted mb-3" aria-hidden="true"></i>
        <h2 class="h4 fw-bold">Your Wishlist is Empty</h2>
        <p class="text-secondary">Explore our catalog and save your favorite items for later.</p>
        <a href="Shop.html" class="btn btn-success rounded-pill px-4 py-2 mt-2">
          <i class="fa-solid fa-arrow-left me-2" aria-hidden="true"></i>Explore Products
        </a>
      </div>
    `;
  }

  function renderWishlistTable(container, products) {
    document.getElementById('wishlist-clear-all-btn')?.classList.remove('d-none');

    let rowsHtml = '';
    products.forEach((product) => {
      const id = String(product._id || product.id || '');
      const title = FreshCart.escapeHtml(product.title || 'Product');
      const category = FreshCart.escapeHtml(product.category?.name || "General");
      const image = FreshCart.sanitizeUrl(product.imageCover || '');
      const price = FreshCart.formatCurrency(product.priceAfterDiscount || product.price || 0);

      rowsHtml += `
        <div class="wishlist-row" id="wishlist-row-${FreshCart.escapeHtml(id)}" data-id="${FreshCart.escapeHtml(id)}">
          <div class="d-flex align-items-center gap-3">
            <a href="ProductDetails.html?id=${encodeURIComponent(id)}" class="text-decoration-none">
              <img src="${image}" alt="${title}" class="wishlist-item-thumb" />
            </a>
            <div>
              <span class="badge bg-light text-secondary border small mb-1">${category}</span>
              <h3 class="h6 mb-1 fw-bold">
                <a href="ProductDetails.html?id=${encodeURIComponent(id)}" class="text-dark text-decoration-none">
                  ${title}
                </a>
              </h3>
              <div class="stock-status-in">
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i> In Stock
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-4">
            <span class="fw-bold fs-5 text-dark">${price} EGP</span>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-success btn-sm rounded-pill px-3" data-action="move-cart" data-id="${FreshCart.escapeHtml(id)}">
                <i class="fa-solid fa-cart-plus me-1" aria-hidden="true"></i> Add to Cart
              </button>
              <button type="button" class="btn btn-outline-danger btn-sm rounded-circle p-2" data-action="remove-wishlist" data-id="${FreshCart.escapeHtml(id)}" title="Remove from wishlist" aria-label="Remove ${title} from wishlist">
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div class="wishlist-table-card">
        ${rowsHtml}
      </div>
    `;

    container.querySelectorAll('.wishlist-item-thumb').forEach((img) => {
      img.addEventListener('error', function () {
        this.src = 'https://placehold.co/100x100?text=Product';
      });
    });
  }

  function setupWishlistDelegation() {
    const container = document.getElementById('wishlist-items-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      // 1. Add to Cart
      const cartBtn = e.target.closest('button[data-action="move-cart"]');
      if (cartBtn) {
        const id = cartBtn.dataset.id;
        const product = wishlistProducts.find((p) => String(p._id || p.id) === String(id));
        if (product) {
          FreshCart.addToCart({
            id: String(product._id || product.id),
            title: product.title,
            price: product.priceAfterDiscount || product.price,
            imageCover: product.imageCover,
            category: product.category?.name || 'General'
          }, 1);

          const originalHtml = cartBtn.innerHTML;
          cartBtn.innerHTML = '<i class="fa-solid fa-check me-1"></i> Added';
          cartBtn.classList.replace('btn-success', 'btn-outline-success');
          setTimeout(() => {
            cartBtn.innerHTML = originalHtml;
            cartBtn.classList.replace('btn-outline-success', 'btn-success');
          }, 1000);
        }
        return;
      }

      // 2. Remove from Wishlist
      const removeBtn = e.target.closest('button[data-action="remove-wishlist"]');
      if (removeBtn) {
        const id = removeBtn.dataset.id;
        FreshCart.toggleWishlist(id);
        const row = document.getElementById(`wishlist-row-${id}`);
        if (row) {
          row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          row.style.opacity = '0';
          row.style.transform = 'translateX(-10px)';
          setTimeout(() => {
            row.remove();
            wishlistProducts = wishlistProducts.filter((p) => String(p._id || p.id) !== String(id));
            const countBadge = document.getElementById('wishlist-count-text');
            if (countBadge) {
              countBadge.textContent = `${wishlistProducts.length} item${wishlistProducts.length === 1 ? '' : 's'}`;
            }
            if (!wishlistProducts.length) {
              renderEmptyWishlist(container);
            }
          }, 200);
        }
      }
    });

    // Clear All button
    document.getElementById('wishlist-clear-all-btn')?.addEventListener('click', () => {
      FreshCart.saveWishlist([]);
      wishlistProducts = [];
      renderEmptyWishlist(container);
      const countBadge = document.getElementById('wishlist-count-text');
      if (countBadge) countBadge.textContent = '0 items';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadWishlistItems();
    setupWishlistDelegation();
  });

  window.addEventListener('freshcart:wishlist-updated', () => {
    loadWishlistItems();
  });
})();
