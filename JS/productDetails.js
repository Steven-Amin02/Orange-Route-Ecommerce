const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let unitPrice = 0;
let maxQty = 1;

const mainImage = document.getElementById("mainImage");
const thumbGrid = document.getElementById("thumbGrid");
const qtyInput = document.getElementById("quantity");
const totalPriceEl = document.getElementById("totalPrice");
const decreaseBtn = document.getElementById("decreaseQty");
const increaseBtn = document.getElementById("increaseQty");

function renderStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += i <= Math.round(rating)
      ? '<i class="bi bi-star-fill text-warning"></i>'
      : '<i class="bi bi-star text-warning"></i>';
  }
  return stars;
}

function updateTotal() {
  const qty = parseInt(qtyInput.value) || 1;
  totalPriceEl.textContent = (qty * unitPrice).toFixed(2) + " EGP";
}

decreaseBtn.addEventListener("click", () => {
  let qty = parseInt(qtyInput.value) || 1;
  if (qty > 1) qty--;
  qtyInput.value = qty;
  updateTotal();
});

increaseBtn.addEventListener("click", () => {
  let qty = parseInt(qtyInput.value) || 1;
  if (qty < maxQty) qty++;
  qtyInput.value = qty;
  updateTotal();
});

async function getProductDetails() {
  const res = await fetch(`https://ecommerce.routemisr.com/api/v1/products/${productId}`);
  const data = await res.json();
  const p = data.data;

  unitPrice = p.priceAfterDiscount || p.price;
  maxQty = p.quantity;

  document.getElementById("productCategory").textContent = p.category?.name || "";
  document.getElementById("productBrand").textContent = p.brand?.name || "";
  document.getElementById("productTitle").textContent = p.title;
  document.getElementById("ratingStars").innerHTML = renderStars(p.ratingsAverage);
  document.getElementById("ratingValue").textContent = p.ratingsAverage;
  document.getElementById("reviewsCountLink").textContent = `(${p.ratingsQuantity} reviews)`;
  document.getElementById("productPrice").textContent = `${unitPrice} EGP`;
  document.getElementById("stockStatus").innerHTML =
    p.quantity > 0
      ? `<i class="bi bi-circle-fill me-1" style="font-size:0.5rem"></i>In Stock`
      : `<i class="bi bi-circle-fill me-1" style="font-size:0.5rem"></i>Out of Stock`;
  document.getElementById("productDescriptionShort").textContent = p.description;
  document.getElementById("productDescriptionFull").textContent = p.description;
  document.getElementById("availableQty").textContent = `${p.quantity} available`;

  document.getElementById("infoCategory").textContent = p.category?.name || "-";
  document.getElementById("infoSubcategory").textContent = p.subcategory?.[0]?.name || "-";
  document.getElementById("infoBrand").textContent = p.brand?.name || "-";
  document.getElementById("infoSold").textContent = `${p.sold}+ sold`;

  document.getElementById("reviewsTabCount").textContent = p.ratingsQuantity;
  document.getElementById("reviewsAvgBig").textContent = p.ratingsAverage;
  document.getElementById("reviewsBasedOn").textContent = `Based on ${p.ratingsQuantity} reviews`;

  mainImage.src = p.imageCover;

  const images = p.images && p.images.length ? p.images : [p.imageCover];
  thumbGrid.innerHTML = "";
  images.forEach((img, i) => {
    thumbGrid.insertAdjacentHTML("beforeend", `
      <div class="col">
        <img src="${img}" class="img-fluid rounded-3 border ${i === 0 ? "border-2 border-success" : ""} thumb-img" style="cursor:pointer" alt="thumbnail">
      </div>
    `);
  });

  document.querySelectorAll(".thumb-img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      mainImage.src = thumb.src;
      document.querySelectorAll(".thumb-img").forEach((t) => t.classList.remove("border-success", "border-2"));
      thumb.classList.add("border-success", "border-2");
    });
  });

  qtyInput.value = 1;
  updateTotal();

  getRelatedProducts(p.category?._id, p._id);
}

async function getRelatedProducts(categoryId, currentId) {
  if (!categoryId) return;
  const res = await fetch(`https://ecommerce.routemisr.com/api/v1/products?category[in]=${categoryId}`);
  const data = await res.json();
  const related = data.data.filter((item) => item._id !== currentId).slice(0, 5);

  const relatedGrid = document.getElementById("relatedGrid");
  relatedGrid.innerHTML = "";

  related.forEach((item) => {
    const discount = item.priceAfterDiscount
      ? Math.round(100 - (item.priceAfterDiscount / item.price) * 100)
      : null;

    relatedGrid.insertAdjacentHTML("beforeend", `
      <div class="col">
        <a href="productDetails.html?id=${item._id}" class="text-decoration-none text-dark">
          <div class="card border-0 shadow-sm h-100 product-card">
            <div class="position-relative p-3 bg-light">
              ${discount ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">-${discount}%</span>` : ""}
              <img src="${item.imageCover}" class="img-fluid mx-auto d-block" style="height:200px; object-fit:contain;" alt="${item.title}">
            </div>
            <div class="card-body">
              <p class="text-success small mb-1">${item.category?.name || ""}</p>
              <h6 class="title fw-semibold" style="min-height:2.6em;">${item.title}</h6>
              <div class="small mb-2">${renderStars(item.ratingsAverage)} <span class="text-secondary">${item.ratingsAverage} (${item.ratingsQuantity})</span></div>
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="fw-bold">${item.priceAfterDiscount || item.price} EGP</span>
                  ${discount ? `<span class="text-decoration-line-through text-secondary small ms-1">${item.price} EGP</span>` : ""}
                </div>
              </div>
            </div>
          </div>
        </a>
      </div>
    `);
  });
}

getProductDetails();