/**
 * CYBER-ARCHITECT / TERMINAL ENGINE JAVASCRIPT
 * Nedim Omanović - Portfolio
 * - Interactive Fleeing '>' Arrows Background Canvas
 * - Mathematical Eye Tracking with Math.atan2(dy, dx)
 * - Real-time Viewport Coordinate HUD (X/Y)
 * - Profile Vector Acknowledgment & Smile Reaction on Contact Trigger
 * - Natural Blinking Cycle
 * - Clipboard Transmission Copy with Terminal Toast
 * - Zero Emojis / Pure Technical UI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const avatarCard = document.getElementById('avatarCard');
  const pupilLeft = document.getElementById('pupilLeft');
  const pupilRight = document.getElementById('pupilRight');
  const viewportCoords = document.getElementById('viewportCoords');
  const contactSection = document.getElementById('contact');
  const terminalNav = document.getElementById('terminalNav');
  const mobileToggle = document.getElementById('mobileToggle');
  const toast = document.getElementById('terminalToast');
  const toastCode = document.getElementById('toastCode');
  const bgCanvas = document.getElementById('bgArrowsCanvas');

  // Exact pupil coordinates from 433 x 577 portrait geometry
  // Left eye: x = 35.80%, y = 46.97%
  // Right eye: x = 59.82%, y = 46.62%
  const eyeConfig = {
    left: { el: pupilLeft, ratioX: 0.3580, ratioY: 0.4697, maxRadiusX: 4.8, maxRadiusY: 2.2 },
    right: { el: pupilRight, ratioX: 0.5982, ratioY: 0.4662, maxRadiusX: 4.8, maxRadiusY: 2.2 }
  };

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentPos = {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 }
  };
  let animationFrameId = null;
  let idleTimer = null;

  // ==========================================================================
  // 1. INTERACTIVE FLEEING ARROWS BACKGROUND ENGINE
  // ==========================================================================

  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    let width = 0;
    let height = 0;
    let arrows = [];
    const SPACING = 52; // Grid spacing between arrows
    const FLEE_RADIUS = 135; // Radius of mouse influence

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      bgCanvas.width = width * dpr;
      bgCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      createGrid();
    }

    function createGrid() {
      arrows = [];
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hX = c * SPACING + (r % 2 === 0 ? 0 : SPACING * 0.5);
          const hY = r * SPACING;
          arrows.push({
            homeX: hX,
            homeY: hY,
            x: hX,
            y: hY,
            vx: 0,
            vy: 0,
            angle: 0,
            targetAngle: 0,
            distToMouse: 999
          });
        }
      }
    }

    function updateAndDrawArrows() {
      ctx.clearRect(0, 0, width, height);
      ctx.font = '13px "JetBrains Mono", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const springK = 0.055; // Returning spring force
      const friction = 0.83;  // Damping

      for (let i = 0; i < arrows.length; i++) {
        const a = arrows[i];

        // Vector from arrow to mouse
        const dx = a.x - targetX;
        const dy = a.y - targetY;
        const dist = Math.hypot(dx, dy);
        a.distToMouse = dist;

        // Flee repulsion
        if (dist < FLEE_RADIUS && dist > 0.1) {
          const forceRatio = (FLEE_RADIUS - dist) / FLEE_RADIUS;
          const force = Math.pow(forceRatio, 1.8) * 8.5;
          const angle = Math.atan2(dy, dx);
          a.vx += Math.cos(angle) * force;
          a.vy += Math.sin(angle) * force;
          a.targetAngle = angle;
        }

        // Hooke's law: Spring back towards home grid cell
        const fx = (a.homeX - a.x) * springK;
        const fy = (a.homeY - a.y) * springK;

        a.vx = (a.vx + fx) * friction;
        a.vy = (a.vy + fy) * friction;

        a.x += a.vx;
        a.y += a.vy;

        // Gentle return of orientation when quiet
        const currentSpeed = Math.hypot(a.vx, a.vy);
        if (currentSpeed < 0.25) {
          a.targetAngle = 0; // standard right pointing '>'
        }
        a.angle += (a.targetAngle - a.angle) * 0.14;

        // Render arrow
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);

        // Responsive color highlight when disturbed
        if (dist < FLEE_RADIUS) {
          const highlightRatio = (FLEE_RADIUS - dist) / FLEE_RADIUS;
          ctx.fillStyle = `rgba(56, 189, 248, ${0.15 + highlightRatio * 0.45})`;
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
        }

        ctx.fillText('>', 0, 0);
        ctx.restore();
      }

      requestAnimationFrame(updateAndDrawArrows);
    }

    window.addEventListener('resize', setupCanvas);
    setupCanvas();
    requestAnimationFrame(updateAndDrawArrows);
  }

  // ==========================================================================
  // 2. MATHEMATICAL EYE TRACKING ENGINE (Math.atan2)
  // ==========================================================================

  function calculateEyeOffset(eye, clientX, clientY, cardRect) {
    const eyeCenterX = cardRect.left + cardRect.width * eye.ratioX;
    const eyeCenterY = cardRect.top + cardRect.height * eye.ratioY;

    const dx = clientX - eyeCenterX;
    const dy = clientY - eyeCenterY;

    const angle = Math.atan2(dy, dx);
    const distance = Math.hypot(dx, dy);

    // Normalize distance up to 260px
    const normalizedDistance = Math.min(1.0, distance / 260);

    const moveX = Math.cos(angle) * eye.maxRadiusX * normalizedDistance;
    const moveY = Math.sin(angle) * eye.maxRadiusY * normalizedDistance;

    return { x: moveX, y: moveY };
  }

  function renderEyeLoop() {
    if (!avatarCard || !pupilLeft || !pupilRight) return;

    const cardRect = avatarCard.getBoundingClientRect();

    if (cardRect.bottom >= 0 && cardRect.top <= window.innerHeight) {
      const leftTarget = calculateEyeOffset(eyeConfig.left, targetX, targetY, cardRect);
      const rightTarget = calculateEyeOffset(eyeConfig.right, targetX, targetY, cardRect);

      const lerp = 0.22;
      currentPos.left.x += (leftTarget.x - currentPos.left.x) * lerp;
      currentPos.left.y += (leftTarget.y - currentPos.left.y) * lerp;
      currentPos.right.x += (rightTarget.x - currentPos.right.x) * lerp;
      currentPos.right.y += (rightTarget.y - currentPos.right.y) * lerp;

      pupilLeft.style.transform = `translate3d(${currentPos.left.x.toFixed(2)}px, ${currentPos.left.y.toFixed(2)}px, 0)`;
      pupilRight.style.transform = `translate3d(${currentPos.right.x.toFixed(2)}px, ${currentPos.right.y.toFixed(2)}px, 0)`;
    }

    // Update real-time HUD coordinates
    if (viewportCoords) {
      const padX = String(Math.round(targetX)).padStart(3, '0');
      const padY = String(Math.round(targetY)).padStart(3, '0');
      viewportCoords.textContent = `X: ${padX} | Y: ${padY}`;
    }

    animationFrameId = requestAnimationFrame(renderEyeLoop);
  }

  // Pointer & Touch Listeners
  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    resetIdleTimer();
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      targetX = e.touches[0].clientX;
      targetY = e.touches[0].clientY;
      resetIdleTimer();
    }
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      targetX = e.touches[0].clientX;
      targetY = e.touches[0].clientY;
      resetIdleTimer();
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    centerGaze();
  });

  function centerGaze() {
    if (!avatarCard) return;
    const cardRect = avatarCard.getBoundingClientRect();
    targetX = cardRect.left + cardRect.width / 2;
    targetY = cardRect.top + cardRect.height * 0.47;
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      centerGaze();
    }, 4500);
  }

  renderEyeLoop();

  // ==========================================================================
  // 3. NATURAL BLINKING LOOP
  // ==========================================================================

  function triggerBlinkCycle() {
    if (!avatarCard || avatarCard.classList.contains('happy')) return;

    pupilLeft.style.transform += ' scaleY(0.1)';
    pupilRight.style.transform += ' scaleY(0.1)';

    setTimeout(() => {
      const nextBlinkMs = Math.random() * 3500 + 2500;
      setTimeout(triggerBlinkCycle, nextBlinkMs);
    }, 130);
  }

  setTimeout(triggerBlinkCycle, 3000);

  // ==========================================================================
  // 4. CONTACT SECTION REACTION TRIGGER (SMILE & VECTOR SIGNAL)
  // ==========================================================================

  let isContactActive = false;

  function activateReaction() {
    if (isContactActive) return;
    isContactActive = true;
    avatarCard.classList.add('happy');
  }

  function deactivateReaction() {
    isContactActive = false;
    avatarCard.classList.remove('happy');
  }

  if (contactSection) {
    contactSection.addEventListener('mouseenter', activateReaction);
    contactSection.addEventListener('mouseleave', deactivateReaction);

    contactSection.addEventListener('touchstart', activateReaction, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && window.innerWidth <= 768) {
          activateReaction();
        } else if (!entry.isIntersecting && window.innerWidth <= 768) {
          deactivateReaction();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(contactSection);
  }

  if (avatarCard) {
    avatarCard.addEventListener('click', () => {
      if (avatarCard.classList.contains('happy')) {
        deactivateReaction();
      } else {
        activateReaction();
        setTimeout(deactivateReaction, 4000);
      }
    });
  }

  // ==========================================================================
  // 5. CLIPBOARD COPY TRANSMISSION
  // ==========================================================================

  let toastTimer = null;
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        showTerminalToast(`DATA_COPIED // ${textToCopy}`);
      }).catch(() => {
        showTerminalToast('ERROR // CLIPBOARD_DENIED');
      });
    });
  });

  function showTerminalToast(text) {
    if (!toast || !toastCode) return;
    toastCode.textContent = text;
    toast.classList.add('active');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('active');
    }, 2800);
  }

  // ==========================================================================
  // 6. MOBILE NAVIGATION
  // ==========================================================================

  if (mobileToggle && terminalNav) {
    mobileToggle.addEventListener('click', () => {
      terminalNav.classList.toggle('active');
    });

    terminalNav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        terminalNav.classList.remove('active');
      });
    });
  }

  // ==========================================================================
  // 7. SMOOTH SCROLLING
  // ==========================================================================

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Direct Form Transmission Handler
function handleTerminalSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('clientName').value;
  const email = document.getElementById('clientEmail').value;
  const subject = document.getElementById('clientSubject').value;
  const message = document.getElementById('clientMessage').value;

  const mailtoUrl = `mailto:nedimomanovic04@gmail.com?subject=${encodeURIComponent(`[UPIT] ${subject} - ${name}`)}&body=${encodeURIComponent(`IDENTIFIKATOR: ${name}\nEMAIL: ${email}\n\nSPECIFIKACIJA PORUKE:\n${message}`)}`;

  window.location.href = mailtoUrl;
}
