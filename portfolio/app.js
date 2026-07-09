// --- Aetheria Cacao Interactive Module ---

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initScrollEffects();
  initProductModals();
  initBoxBuilder();
  initFormHandlers();
  initHeroSequenceAnimation();
});

function initHeroSequenceAnimation() {
  const section = document.getElementById('hero');
  const canvas = document.getElementById('hero-canvas');
  const loader = document.getElementById('hero-loading');

  if (!section || !canvas || !window.gsap || !window.ScrollTrigger) return;

  const ctx = canvas.getContext('2d');
  const frameCount = 80;
  const fallbackPaths = [
    'assets/hero-sequence/',
    'hero/Chocolate_bar_unwraps_explodes_i…_202607091510_000/'
  ];
  const frames = [];
  let loadedCount = 0;
  let currentFrame = -1;
  let ready = false;
  let canvasSize = { width: 0, height: 0, dpr: 1 };
  let resizeRaf = 0;

  function buildFrameUrl(index) {
    const padded = String(index).padStart(3, '0');
    return [
      `assets/hero-sequence/Chocolate_bar_unwraps_explodes_i…_202607091510_${padded}.jpg`,
      `hero/Chocolate_bar_unwraps_explodes_i…_202607091510_000/Chocolate_bar_unwraps_explodes_i…_202607091510_${padded}.jpg`
    ];
  }

  function loadFrame(index) {
    const candidates = buildFrameUrl(index);
    const img = new Image();
    img.decoding = 'async';

    const tryNext = (position = 0) => {
      if (position >= candidates.length) {
        loadedCount += 1;
        return;
      }

      img.onload = () => {
        frames[index] = img;
        loadedCount += 1;
        if (loadedCount === frameCount) {
          ready = true;
          loader.style.opacity = '0';
          loader.style.pointerEvents = 'none';
          drawFrame(0);
          initScrollScrub();
        }
      };

      img.onerror = () => tryNext(position + 1);
      img.src = candidates[position];
    };

    tryNext();
  }

  function drawFrame(index, force = false) {
    const img = frames[index];
    if (!img || !ready) return;
    if (currentFrame === index && !force) return;

    const { width, height } = canvasSize;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const sourceRatio = img.naturalWidth / img.naturalHeight;
    const viewportRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;

    if (sourceRatio > viewportRatio) {
      drawHeight = width / sourceRatio;
    } else {
      drawWidth = height * sourceRatio;
    }

    if (drawHeight > height) {
      drawHeight = height;
      drawWidth = height * sourceRatio;
    }

    if (drawWidth > width) {
      drawWidth = width;
      drawHeight = width / sourceRatio;
    }

    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    currentFrame = index;
  }

  function resizeCanvas() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvasSize = {
        width: rect.width,
        height: rect.height,
        dpr
      };

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;

      if (ready && currentFrame >= 0) {
        drawFrame(currentFrame, true);
      } else if (ready) {
        drawFrame(0, true);
      }
    });
  }

  function initScrollScrub() {
    const heroHeight = window.innerHeight * 3.2;
    section.style.height = `${heroHeight}px`;
    section.style.minHeight = `${heroHeight}px`;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: true,
      pinSpacing: false,
      scrub: true,
      onUpdate: (self) => {
        const frameIndex = Math.round(self.progress * (frameCount - 1));
        if (frameIndex !== currentFrame) {
          drawFrame(frameIndex);
        }
      }
    });

    ScrollTrigger.refresh();
  }

  for (let index = 0; index < frameCount; index += 1) {
    loadFrame(index);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

// --- 1. Ambient Canvas Background (Golden Dust & Steam Particles) ---
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  
  const particles = [];
  const particleCount = Math.min(60, Math.floor((width * height) / 25000)); // Responsive density
  
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
    
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * this.wobble) * 0.2;
      
      // Gradually fade out near the top
      if (this.y < height * 0.2) {
        this.alpha -= 0.002;
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
  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw subtle dark chocolate ambient background gradient on canvas as backup
    const gradient = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, width);
    gradient.addColorStop(0, '#0f0805');
    gradient.addColorStop(1, '#070403');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Resize Handler
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
}

// --- 2. Scroll-triggered Reveal & Header Transitions ---
function initScrollEffects() {
  const header = document.getElementById('main-header');
  
  // Header state transition on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

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
