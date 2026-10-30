/**
 * Sri Ramleela - Ancient Ayodhya Heritage Website
 * Interactive Logic: Fullscreen Video, In-Browser Image Replacer, Lightbox, Web Audio Chime, Particle Canvas
 */

document.addEventListener('DOMContentLoaded', () => {
  initDiyaCanvas();
  initVideoStreamPlayer();
  initGallerySystem();
  initLightbox();
  initTempleBell();
  initDiyaOffering();
});

/* ==========================================================================
   1. STREAMING VIDEO PLAYER & FULLSCREEN HANDLING
   ========================================================================== */
function initVideoStreamPlayer() {
  const pavilion = document.getElementById('video-pavilion');
  const video = document.getElementById('main-video-player');
  const overlay = document.getElementById('video-play-overlay');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnTheater = document.getElementById('btn-theater');

  if (!video || !pavilion) return;

  // Big Play Overlay Handler
  if (overlay) {
    overlay.addEventListener('click', () => {
      video.play().then(() => {
        overlay.classList.add('hidden');
      }).catch((err) => {
        console.log('Playback error/autoplay policy:', err);
      });
    });
  }

  video.addEventListener('play', () => {
    overlay && overlay.classList.add('hidden');
  });

  video.addEventListener('pause', () => {
    // Only show overlay if stopped near beginning
    if (video.currentTime < 1) {
      overlay && overlay.classList.remove('hidden');
    }
  });

  // Toggle Fullscreen API
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (pavilion.requestFullscreen) {
          await pavilion.requestFullscreen();
        } else if (pavilion.webkitRequestFullscreen) {
          await pavilion.webkitRequestFullscreen();
        } else if (video.requestFullscreen) {
          await video.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }

  // Update button visual state on fullscreen change
  function handleFullscreenChange() {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!btnFullscreen) return;
    if (isFull) {
      btnFullscreen.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
        </svg>
        Exit Fullscreen [F]
      `;
    } else {
      btnFullscreen.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
        Fullscreen [F]
      `;
    }
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreen);
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

  // Toggle Theater Dim Mode
  if (btnTheater) {
    btnTheater.addEventListener('click', () => {
      document.body.classList.toggle('theater-mode-active');
      const isTheater = document.body.classList.contains('theater-mode-active');
      btnTheater.style.background = isTheater ? 'var(--gold-pure)' : '';
      btnTheater.style.color = isTheater ? '#1a0c06' : '';

      if (isTheater) {
        pavilion.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Global Keyboard Shortcuts (F for Fullscreen, T for Theater, Space for Play/Pause)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      btnTheater && btnTheater.click();
    } else if (e.key === ' ' && document.activeElement !== video) {
      // Toggle play/pause
      e.preventDefault();
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  });
}

/* ==========================================================================
   2. GALLERY & IN-BROWSER IMAGE REPLACER SYSTEM
   ========================================================================== */
const defaultPlaceholders = [
  'assets/images/placeholder-1.svg',
  'assets/images/placeholder-2.svg',
  'assets/images/placeholder-3.svg',
  'assets/images/placeholder-4.svg',
  'assets/images/placeholder-5.svg',
  'assets/images/placeholder-6.svg'
];

let activeTargetSlot = null;

function initGallerySystem() {
  const fileInput = document.getElementById('universal-file-input');
  const btnUploadPhotos = document.getElementById('btn-upload-photos');
  const btnResetGallery = document.getElementById('btn-reset-gallery');
  const galleryGrid = document.getElementById('gallery-grid');

  if (!galleryGrid || !fileInput) return;

  // Check if user has uploaded images in this session
  loadCachedImages();

  // Trigger file dialog for batch upload
  if (btnUploadPhotos) {
    btnUploadPhotos.addEventListener('click', () => {
      activeTargetSlot = null; // null means populate all sequentially
      fileInput.value = '';
      fileInput.click();
    });
  }

  // Trigger file dialog for individual slot replace
  galleryGrid.addEventListener('click', (e) => {
    const replaceBtn = e.target.closest('[data-action="replace"]');
    if (replaceBtn) {
      e.stopPropagation();
      const slotIndex = parseInt(replaceBtn.getAttribute('data-slot'), 10);
      activeTargetSlot = slotIndex;
      fileInput.value = '';
      fileInput.click();
    }
  });

  // Handle selected image files
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (activeTargetSlot !== null) {
      // Replace single slot
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      applyImageToSlot(activeTargetSlot, objectUrl, file.name);
    } else {
      // Replace multiple slots sequentially
      files.forEach((file, idx) => {
        if (idx < 6) {
          const objectUrl = URL.createObjectURL(file);
          applyImageToSlot(idx, objectUrl, file.name);
        }
      });
    }

    playTempleBellTone(600, 0.4);
  });

  // Reset to default placeholders
  if (btnResetGallery) {
    btnResetGallery.addEventListener('click', () => {
      defaultPlaceholders.forEach((path, idx) => {
        const img = document.getElementById(`img-slot-${idx}`);
        if (img) img.src = path;
      });
      try {
        localStorage.removeItem('ramleela_custom_images');
      } catch (e) {}
    });
  }
}

function applyImageToSlot(slotIndex, srcUrl, fileName) {
  const img = document.getElementById(`img-slot-${slotIndex}`);
  if (!img) return;

  img.style.opacity = '0.3';
  img.src = srcUrl;
  img.onload = () => {
    img.style.transition = 'opacity 0.4s ease';
    img.style.opacity = '1';
  };

  const card = document.querySelector(`.gallery-card[data-index="${slotIndex}"]`);
  if (card) {
    const badge = card.querySelector('.placeholder-badge');
    if (badge && fileName) {
      badge.textContent = `Active: ${fileName.substring(0, 18)}...`;
      badge.style.color = '#4ade80';
      badge.style.background = 'rgba(34, 197, 94, 0.15)';
    }
  }
}

function loadCachedImages() {
  // Check if sample images or local images exist
  // We check if sample files exist in assets/images/
  // Keep clean defaults
}

/* ==========================================================================
   3. LIGHTBOX SYSTEM
   ========================================================================== */
let currentLightboxIndex = 0;

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const galleryGrid = document.getElementById('gallery-grid');

  if (!modal || !galleryGrid) return;

  // Open Lightbox on card click
  galleryGrid.addEventListener('click', (e) => {
    // If clicked on replace button, do not open lightbox
    if (e.target.closest('[data-action="replace"]')) return;

    const card = e.target.closest('.gallery-card');
    if (card) {
      const index = parseInt(card.getAttribute('data-index'), 10);
      openLightbox(index);
    }
  });

  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxContent();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const imgEl = document.getElementById(`img-slot-${currentLightboxIndex}`);
    const card = document.querySelector(`.gallery-card[data-index="${currentLightboxIndex}"]`);
    if (!imgEl || !card) return;

    const targetImg = document.getElementById('lightbox-img');
    const targetTitle = document.getElementById('lightbox-title');
    const targetDesc = document.getElementById('lightbox-desc');

    targetImg.src = imgEl.src;
    targetTitle.textContent = card.querySelector('.card-devanagari-title')?.textContent || 'अयोध्या दर्शन';
    targetDesc.textContent = card.querySelector('.card-desc')?.textContent || '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex - 1 + 6) % 6;
    updateLightboxContent();
  });

  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex + 1) % 6;
    updateLightboxContent();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });
}

/* ==========================================================================
   4. TEMPLE BELL CHIME (Synthesized Web Audio API)
   ========================================================================== */
let audioCtx = null;

function playTempleBellTone(freq = 528, duration = 2.8) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // Bell Harmonics frequencies and gain ratios
    const partials = [
      { fMult: 1.0, gain: 0.7, decay: duration },
      { fMult: 1.48, gain: 0.4, decay: duration * 0.8 },
      { fMult: 2.05, gain: 0.25, decay: duration * 0.6 },
      { fMult: 2.76, gain: 0.15, decay: duration * 0.4 }
    ];

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, now);
    masterGain.connect(audioCtx.destination);

    partials.forEach(p => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.fMult, now);

      gain.gain.setValueAtTime(p.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + p.decay);
    });
  } catch (err) {
    console.log('Web Audio tone note:', err);
  }
}

function initTempleBell() {
  const bellBtn = document.getElementById('btn-temple-bell');
  if (!bellBtn) return;

  bellBtn.addEventListener('click', () => {
    playTempleBellTone(540, 3.2);
    bellBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      bellBtn.style.transform = '';
    }, 150);
  });
}

/* ==========================================================================
   5. INTERACTIVE DIYA LIGHTING & COUNTER
   ========================================================================== */
function initDiyaOffering() {
  const diyaBtn = document.getElementById('btn-light-diya');
  const counterEl = document.getElementById('diya-counter');
  if (!diyaBtn || !counterEl) return;

  let count = 1108;

  diyaBtn.addEventListener('click', (e) => {
    count++;
    counterEl.textContent = count.toLocaleString('hi-IN');
    counterEl.style.color = '#fff0a0';
    counterEl.style.transform = 'scale(1.15)';
    setTimeout(() => {
      counterEl.style.transform = 'scale(1)';
      counterEl.style.color = 'var(--gold-pure)';
    }, 300);

    // Audio Chime
    playTempleBellTone(640, 2.5);

    // Visual flame flare
    const flame = document.getElementById('diya-flame');
    const glow = document.getElementById('diya-glow');
    if (flame) {
      flame.style.transform = 'scale(1.35)';
      flame.style.transformOrigin = '50% 50%';
      flame.style.transition = 'transform 0.2s';
      setTimeout(() => { flame.style.transform = 'scale(1)'; }, 300);
    }
    if (glow) {
      glow.setAttribute('r', '40');
      glow.setAttribute('opacity', '0.6');
      setTimeout(() => {
        glow.setAttribute('r', '28');
        glow.setAttribute('opacity', '0.35');
      }, 500);
    }
  });
}

/* ==========================================================================
   6. FLOATING SACRED DIYA EMBERS PARTICLES
   ========================================================================== */
function initDiyaCanvas() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleCount = Math.min(38, Math.floor(window.innerWidth / 35));
  const particles = [];

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * height; // initial random distribution
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + 10 + Math.random() * 20;
      this.size = Math.random() * 2.8 + 1.2;
      this.speedY = Math.random() * 0.6 + 0.35;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.55 + 0.25;
      this.glow = Math.random() > 0.4;
      // Golden / saffron color variations
      const hue = Math.floor(Math.random() * 28 + 32); // 32 to 60 (amber gold)
      this.color = `hsl(${hue}, 100%, 65%)`;
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.008) * 0.3;

      if (this.y < -20 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      if (this.glow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffaa00';
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(animate);
  }

  animate();
}
