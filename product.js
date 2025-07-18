const content = document.getElementById("content");

function extractMeta(text) {
  const match = text.match(/<!--meta([\s\S]*?)-->/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    console.error("Meta parsing error:", e);
    return {};
  }
}

async function loadMarkdown(file) {
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error("File not found: " + file);
    let text = await res.text();
    const meta = extractMeta(text);
    text = text.replace(/<!--meta[\s\S]*?-->/, "");

    content.innerHTML = `
      <h2>${meta.title || "Untitled Design"}</h2>
      <div class="image-carousel">
        <button class="carousel-btn prev" onclick="prevImage()">‹</button>
        <button class="carousel-btn next" onclick="nextImage()">›</button>
        <!-- All images are added here dynamically -->
      </div>
      <p><a href="${meta.stripe}" class="btn">Buy for ${meta.price}</a></p>
      <hr />
      ${marked.parse(text)}
    `;

    setupImageCarousel(meta.images || []);
  } catch (e) {
    content.innerHTML = `<p style="color:#f88;">Error loading document: ${e.message}</p>`;
  }
}

let currentImgIndex = 0;
let carouselImages = [];

function setupImageCarousel(images) {
  carouselImages = images;
  currentImgIndex = 0;

  const carousel = document.querySelector(".image-carousel");

  // Clear out old stack
  const oldImgs = carousel.querySelectorAll("image.stack-img");
  oldImgs.forEach((img) => img.remove());

  // Add new stacked iamges
  images.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "stack-img";
    img.dataset.index = index;
    carousel.appendChild(img);
  });

  updateCarouselImage();
}

function updateCarouselImage() {
  const imgs = [...document.querySelectorAll(".stack-img")];
  if (imgs.length === 0) return;

  imgs.forEach((img, i) => {
    const z = i === currentImgIndex ? 49 : i;

    img.style.zIndex = z;
    img.style.opacity = i === currentImgIndex ? 1 : 0.9;
    img.style.pointerEvents = i === currentImgIndex ? "auto" : "none";

    if (i === currentImgIndex) {
      img.style.transform = "rotate(0deg) translate(0, 0)";
    } else {
      const rotate = randomRange(-3, 3);
      const translate = randomRange(-10, 10)

      img.style.transform = `rotate(${rotate}deg) translate(${translate}px, ${translate}px)`;
    }
  });
}

function getRandomIndexExcluding(exclude = []) {
  if (carouselImages.length <= exclude.length) return exclude[0] || 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * carouselImages.length);
  } while (exclude.includes(idx));
  return idx;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function nextImage() {
  if (carouselImages.length === 0) return;
  currentImgIndex = (currentImgIndex + 1) % carouselImages.length;
  updateCarouselImage();
}

function prevImage() {
  if (carouselImages.length === 0) return;
  currentImgIndex = (currentImgIndex - 1 + carouselImages.length) % carouselImages.length;
  updateCarouselImage();
}

// Load initial product
const params = new URLSearchParams(window.location.search);
const file = params.get("file");

if (file) {
  loadMarkdown(file);
} else {
  document.body.innerHTML = "<p>No product specified.</p>";
}