// --- Aetheria Cacao Interactive Module ---

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initGoldCursor();
  initScrollEffects();
  initProductModals();
  initBoxBuilder();
  initFormHandlers();
  initHeroSequenceAnimation();
});

function initGoldCursor() {
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.body.classList.add('has-gold-cursor');
  }
}

function initHeroSequenceAnimation() {
  const section = document.getElementById('hero');
  const canvas = document.getElementById('hero-canvas');
  const loader = document.getElementById('hero-loading');

  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');
  const frameCount = 80;
  const frames = [];
  let currentFrame = -1;
  let targetFrame = 0;
  let firstFrameReady = false;
  let canvasSize = { width: 0, height: 0, dpr: 1 };
  let resizeRaf = 0;
  let scrollRaf = 0;

  function buildFrameUrl(index) {
    const padded = String(index).padStart(3, '0');
    return `hero/Chocolate_bar_unwraps_explodes_i…_202607091510_000/Chocolate_bar_unwraps_explodes_i…_202607091510_${padded}.jpg`;
  }

  function loadFrame(index) {
    if (frames[index]) return;
    const url = buildFrameUrl(index);
    const img = new Image();
    img.decoding = index === 0 ? 'sync' : 'async';
    if (index < 12) img.fetchPriority = 'high';

    img.onload = () => {
      frames[index] = img;
      if (index === 0) {
        firstFrameReady = true;
        if (loader) {
          loader.style.opacity = '0';
          loader.style.pointerEvents = 'none';
        }
        resizeCanvas();
      }
      drawFrame(targetFrame, true);
    };

    img.onerror = () => {
      console.warn(`Failed to load frame ${index} from ${url}`);
    };

    img.src = url;
  }

  function nearestFrame(index) {
    if (frames[index]) return index;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (frames[i]) return i;
    }
    for (let i = index + 1; i < frameCount; i += 1) {
      if (frames[i]) return i;
    }
    return -1;
  }

  function drawFrame(index, force = false) {
    const resolved = nearestFrame(index);
    const img = resolved >= 0 ? frames[resolved] : null;
    if (!img) return;
    if (currentFrame === resolved && !force) return;

    const width = canvasSize.width || canvas.clientWidth || window.innerWidth;
    const height = canvasSize.height || canvas.clientHeight || window.innerHeight;
    if (!width || !height) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const nw = img.naturalWidth || 1280;
    const nh = img.naturalHeight || 720;

    // Use cover scaling so the animation stretches edge-to-edge with no gaps on top, bottom, or sides
    const scale = Math.max(width / nw, height / nh);
    const drawWidth = Math.ceil(nw * scale);
    const drawHeight = Math.ceil(nh * scale);

    const x = Math.floor((width - drawWidth) / 2);
    const y = Math.floor((height - drawHeight) / 2);

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    currentFrame = resolved;
  }

  function resizeCanvas() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasSize = {
      width: w,
      height: h,
      dpr
    };

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    if (currentFrame >= 0) {
      drawFrame(currentFrame, true);
    } else if (frames[0] || firstFrameReady) {
      drawFrame(0, true);
    }
  }

  function updateScrollFrame() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const rect = section.getBoundingClientRect();
      const totalScroll = section.offsetHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / totalScroll));
      targetFrame = Math.round(progress * (frameCount - 1));
      drawFrame(targetFrame);
    });
  }

  function initScrollScrub() {
    window.addEventListener('scroll', updateScrollFrame, { passive: true });
    updateScrollFrame();
  }

  // Initial sizing
  resizeCanvas();
  initScrollScrub();

  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeCanvas();
      updateScrollFrame();
    });
  });

  // Load frame 0 immediately
  loadFrame(0);

  // Load the first 15 frames immediately for instant scroll response
  for (let index = 1; index < Math.min(15, frameCount); index += 1) {
    loadFrame(index);
  }

  // Load remaining frames in small batches so network isn't choked and initial frames render instantly
  setTimeout(() => {
    for (let index = 15; index < frameCount; index += 1) {
      loadFrame(index);
    }
  }, 50);
}

// --- 1. Ambient Canvas Background (Golden Dust & Steam Particles) ---
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  let backgroundGradient;
  let lastFrameTime = 0;
  const frameInterval = 1000 / 30;

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    backgroundGradient = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width);
    backgroundGradient.addColorStop(0, '#0f0805');
    backgroundGradient.addColorStop(1, '#070403');
  }

  resizeCanvas();
  
  const particles = [];
  const particleCount = Math.min(40, Math.floor((width * height) / 35000));
  
  class Particle {
    constructor() {
      this.reset();
      // Start randomly dispersed across screen
      this.y = Math.random() * height;
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 50; // Start off screen bottom
      this.radius = Math.random() * 2 + 0.5; // Thin delicate dust
      this.alpha = Math.random() * 0.4 + 0.05; // Muted opacity
      this.speedY = -(Math.random() * 0.4 + 0.15); // Upward float like steam
      this.speedX = Math.random() * 0.3 - 0.15; // Slow horizontal sway
      this.wobble = Math.random() * 0.02; // Wobble frequency
      this.wobbleSpeed = Math.random() * 0.02;
    }
    
    update(delta) {
      this.y += this.speedY * delta;
      this.x += (this.speedX + Math.sin(this.y * this.wobble) * 0.2) * delta;
      
      // Gradually fade out near the top
      if (this.y < height * 0.2) {
        this.alpha -= 0.002 * delta;
      }
      
      // Recycle if off screen top or faded out
      if (this.y < 0 || this.alpha <= 0) {
        this.reset();
      }
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`; // Elegant gold
      ctx.shadowBlur = this.radius * 2;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow for efficiency
    }
  }
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  // Animation Loop
  function animate(timestamp) {
    requestAnimationFrame(animate);
    if (timestamp - lastFrameTime < frameInterval) return;
    const delta = lastFrameTime ? Math.min((timestamp - lastFrameTime) / (1000 / 60), 2) : 1;
    lastFrameTime = timestamp;

    ctx.clearRect(0, 0, width, height);
    
    // Draw subtle dark chocolate ambient background gradient on canvas as backup
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, width, height);
    
    particles.forEach(p => {
      p.update(delta);
      p.draw();
    });
  }
  
  requestAnimationFrame(animate);
  
  // Resize Handler
  window.addEventListener('resize', resizeCanvas);
}

// --- 2. Scroll-triggered Reveal & Header Transitions ---
function initScrollEffects() {
  const header = document.getElementById('main-header');
  const hero = document.getElementById('hero');
  
  function updateHeaderVisibility() {
    if (!header) return;
    const heroEnd = hero
      ? hero.offsetTop + hero.offsetHeight - window.innerHeight
      : 0;
    header.classList.toggle('scrolled', window.scrollY >= heroEnd);
  }

  window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
  window.addEventListener('resize', updateHeaderVisibility);
  updateHeaderVisibility();

  // Reveal Elements on scroll using Intersection Observer
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target); // Reveal only once
      }
    });
  }, {
    threshold: 0.1, // Trigger when 10% visible
    rootMargin: '0px 0px -50px 0px'
  });
  
  revealElements.forEach(el => revealObserver.observe(el));
}

// --- 3. Product Modals with Detailed Technical & Sommelier Info ---
const PRODUCT_DATA = {
  obsidian: {
    title: "Obsidian 85",
    cocoa: "85% Cocoa | Madagascar Criollo",
    price: "$6.50 / pc",
    img: "assets/truffle_obsidian.png",
    desc: "A bold, obsidian-dark truffle handcrafted from Criollo cacao grown in Madagascar's volcanic plains. It delivers rich tobacco, cherry, and espresso-roast notes. Sprinkled with mineral-rich Icelandic black lava sea salt and hand-layered with pure gold leaf to create a sensory duality of sweet and salty.",
    bitterness: 90,
    sweetness: 20,
    spiciness: 30,
    pairing: "Perfectly complements a vintage tawny Port or an exceptionally peaty single-malt Islay Scotch whisky. Serve at 18°C."
  },
  ruby_rose: {
    title: "Ruby Rose",
    cocoa: "47% Cocoa | Ecuadorian Arriba",
    price: "$7.00 / pc",
    img: "assets/truffle_rose.png",
    desc: "A romantic fusion of color and aroma. Naturally tinted pink ruby chocolate shell with a bright, tart berry profile. The inside features a luxurious liquid infusion of mountain raspberries, cardamon, and organic damask rosewater. Finished with dried raspberry dust.",
    bitterness: 30,
    sweetness: 65,
    spiciness: 10,
    pairing: "Pairs exquisitely with a crisp, chilled Rosé Champagne, dry Prosecco, or a floral Elderflower French 75. Best enjoyed under soft candlelight."
  },
  saffron_gold: {
    title: "Saffron Gold",
    cocoa: "38% Cocoa | Swiss Mountain Cream",
    price: "$8.00 / pc",
    img: "assets/truffle_gold.png",
    desc: "The pinnacle of spice infusion. Silky Swiss white chocolate conched with threads of Kashmiri Saffron—the most expensive spice on Earth—which yields notes of hay, honey, and warm metallic depth. A thin hand-painted accent of 24k edible gold paint crowns the sphere.",
    bitterness: 15,
    sweetness: 80,
    spiciness: 70,
    pairing: "Exquisite when matched with a Sauternes dessert wine, a sweet late-harvest Riesling, or a ceremonial Matcha tea flight."
  }
};

function initProductModals() {
  const modal = document.getElementById('product-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  
  if (!modal || !closeBtn) return;
  
  // Show product profile modal
  document.querySelectorAll('.collection-card').forEach(card => {
    card.addEventListener('click', () => {
      const productId = card.getAttribute('data-id');
      const data = PRODUCT_DATA[productId];
      
      if (data) {
        document.getElementById('modal-product-img').src = data.img;
        document.getElementById('modal-product-img').alt = data.title;
        document.getElementById('modal-product-cocoa').innerText = data.cocoa;
        document.getElementById('modal-product-title').innerText = data.title;
        document.getElementById('modal-product-price').innerText = data.price;
        document.getElementById('modal-product-desc').innerText = data.desc;
        document.getElementById('modal-product-pairing').innerText = data.pairing;
        
        // Modal Flavor Profile bars
        document.getElementById('modal-stat-bitterness').innerText = `${data.bitterness}%`;
        document.getElementById('modal-bar-bitterness').style.width = `${data.bitterness}%`;
        document.getElementById('modal-stat-sweetness').innerText = `${data.sweetness}%`;
        document.getElementById('modal-bar-sweetness').style.width = `${data.sweetness}%`;
        document.getElementById('modal-stat-spiciness').innerText = `${data.spiciness}%`;
        document.getElementById('modal-bar-spiciness').style.width = `${data.spiciness}%`;
        
        // Open Modal
        modal.classList.add('active');
      }
    });
  });
  
  // Close Modal
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
  
  // ESC Key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });
}

// --- 4. Interactive Box Builder Logic (Flavor Symphony) ---
function initBoxBuilder() {
  // Box Contents State
  let box = [null, null, null, null];
  
  const menuItems = document.querySelectorAll('.selection-item');
  const slots = document.querySelectorAll('.box-slot');
  const countText = document.getElementById('builder-count');
  const orderBtn = document.getElementById('btn-order-box');
  
  // Click on a Menu Item to add it to the box
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      const name = item.getAttribute('data-name');
      const cocoa = parseInt(item.getAttribute('data-cocoa'));
      const sweetness = parseInt(item.getAttribute('data-sweetness'));
      const bitterness = parseInt(item.getAttribute('data-bitterness'));
      const fruitiness = parseInt(item.getAttribute('data-fruitiness'));
      const spiciness = parseInt(item.getAttribute('data-spiciness'));
      const img = item.getAttribute('data-img');
      
      const itemData = { id, name, cocoa, sweetness, bitterness, fruitiness, spiciness, img };
      
      // Find first empty slot (null)
      const emptyIndex = box.indexOf(null);
      
      if (emptyIndex !== -1) {
        box[emptyIndex] = itemData;
        renderBox();
        showToast(`Added ${name} to Slot ${emptyIndex + 1}`);
      } else {
        showToast("Your box is fully curated. Remove an item to add a different creation.");
      }
    });
  });
  
  // Render current box state to UI
  function renderBox() {
    let filledCount = 0;
    
    slots.forEach((slot, index) => {
      const item = box[index];
      
      if (item) {
        filledCount++;
        slot.classList.add('filled');
        
        // Dynamic styling for espresso due to image reuse
        let styleFilter = "";
        if (item.id === 'espresso_dark') {
          styleFilter = "style='filter: brightness(0.6) sepia(0.3);'";
        }
        
        slot.innerHTML = `
          <button class="slot-remove" data-index="${index}" aria-label="Remove item">&times;</button>
          <img src="${item.img}" alt="${item.name}" class="slot-img" ${styleFilter}>
        `;
        
        // Remove button click handler
        slot.querySelector('.slot-remove').addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent trigger box selection/re-click
          box[index] = null;
          renderBox();
          showToast(`Removed ${item.name}`);
        });
      } else {
        slot.classList.remove('filled');
        slot.innerHTML = `
          <div class="slot-placeholder">
            <svg viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
            <span>Slot ${getRomanNumeral(index)}</span>
          </div>
        `;
      }
    });
    
    // Update labels and order button
    countText.innerText = filledCount === 0 ? "Box Empty (0/4 filled)" : `Box Curated (${filledCount}/4 filled)`;
    orderBtn.disabled = filledCount < 4; // Require full curation of 4
    
    calculateFlavorProfile();
  }
  
  function getRomanNumeral(index) {
    const numerals = ["I", "II", "III", "IV"];
    return numerals[index] || "X";
  }
  
  // Calculate average flavor profile scores
  function calculateFlavorProfile() {
    const filledItems = box.filter(item => item !== null);
    const count = filledItems.length;
    
    if (count === 0) {
      // Reset all bars to zero
      updateBar('cocoa', 0);
      updateBar('sweetness', 0);
      updateBar('bitterness', 0);
      updateBar('fruitiness', 0);
      updateBar('spiciness', 0);
      return;
    }
    
    let totalCocoa = 0;
    let totalSweet = 0;
    let totalBitter = 0;
    let totalFruit = 0;
    let totalSpice = 0;
    
    filledItems.forEach(item => {
      totalCocoa += item.cocoa;
      totalSweet += item.sweetness;
      totalBitter += item.bitterness;
      totalFruit += item.fruitiness;
      totalSpice += item.spiciness;
    });
    
    updateBar('cocoa', Math.round(totalCocoa / count));
    updateBar('sweetness', Math.round(totalSweet / count));
    updateBar('bitterness', Math.round(totalBitter / count));
    updateBar('fruitiness', Math.round(totalFruit / count));
    updateBar('spiciness', Math.round(totalSpice / count));
  }
  
  function updateBar(id, val) {
    const bar = document.getElementById(`bar-${id}`);
    const label = document.getElementById(`stat-${id}`);
    
    if (bar && label) {
      bar.style.width = `${val}%`;
      label.innerText = id === 'cocoa' ? `${val}%` : `${val}%`;
    }
  }
  
  // Order Box Button Action
  orderBtn.addEventListener('click', () => {
    showToast("Golden Box Reserved. Your invitation receipt has been dispatched.");
    // Clear box
    box = [null, null, null, null];
    renderBox();
  });
}

// --- 5. Custom Toast Notification ---
function showToast(message) {
  const toast = document.getElementById('system-toast');
  if (!toast) return;
  
  toast.innerText = message;
  toast.classList.add('show');
  
  // Clear any existing timeouts
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// --- 6. Form Submission Handlers ---
function initFormHandlers() {
  const bookingForm = document.getElementById('res-booking-form');
  const newsletterForm = document.getElementById('newsletter-subscription-form');
  
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('res-name').value;
      const date = document.getElementById('res-date').value;
      const session = document.getElementById('res-session').value;
      
      showToast(`Booking Requested: Welcome, ${name}. Salon slot on ${date} at ${session} held.`);
      bookingForm.reset();
    });
  }
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input').value;
      showToast(`Symphony Circle Registered: ${email} added.`);
      newsletterForm.reset();
    });
  }

  // Mobile Menu Staggered Navigation Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      
      if (isVisible) {
        navLinks.style.display = 'none';
        mobileToggle.innerHTML = '<i class="fa-solid fa-bars-staggered"></i>';
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(11, 6, 4, 0.98)';
        navLinks.style.borderBottom = '1px solid rgba(212, 175, 55, 0.2)';
        navLinks.style.padding = '2rem';
        navLinks.style.gap = '1.5rem';
        mobileToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      }
    });

    // Close mobile menu on clicking any link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navLinks.style.display = 'none';
          mobileToggle.innerHTML = '<i class="fa-solid fa-bars-staggered"></i>';
        }
      });
    });
  }
}
