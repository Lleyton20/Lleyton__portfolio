const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector('.menu-btn');
const siteNav = document.querySelector('.site-nav');
const header = document.querySelector('.site-header');
const canvas = document.querySelector('.starfield');
const canvasContext = canvas?.getContext('2d', { alpha: true });
const ambient = document.querySelector('.ambient');

// Enhance only after JS is ready; without it, all content remains visible.
if (!reducedMotion.matches) document.documentElement.classList.add('motion-ready');

// Brief monogram curtain, once per session. The hero's entrance waits until it lifts.
function finishIntro() {
  document.documentElement.classList.add('intro-done');
}
function playIntro() {
  let seen = false;
  try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch { /* storage unavailable */ }
  if (reducedMotion.matches || seen) return finishIntro();
  try { sessionStorage.setItem('intro-seen', '1'); } catch { /* storage unavailable */ }
  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.setAttribute('aria-hidden', 'true');
  intro.innerHTML = '<div class="intro-mark"><span class="intro-monogram"><span>L</span><span>M</span></span><span class="intro-bar"></span></div>';
  document.body.append(intro);
  window.setTimeout(() => {
    intro.classList.add('is-leaving');
    window.setTimeout(finishIntro, 180);
    window.setTimeout(() => intro.remove(), 950);
  }, 820);
}
playIntro();

// Wrap each visual line of a headline so it can rise from behind a mask.
// Lines break at <br> and at children that already render as blocks.
function splitLines(heading) {
  const lines = [[]];
  [...heading.childNodes].forEach((node) => {
    if (node.nodeName === 'BR') return lines.push([]);
    const isBlock = node.nodeType === 1 && getComputedStyle(node).display === 'block';
    if (isBlock) lines.push([node], []);
    else lines[lines.length - 1].push(node);
  });
  const filled = lines.filter((nodes) => nodes.some((node) => node.textContent.trim()));
  heading.replaceChildren(...filled.map((nodes, index) => {
    const line = document.createElement('span');
    const inner = document.createElement('span');
    line.className = 'split-line';
    inner.className = 'split-inner';
    line.style.setProperty('--line-i', String(index));
    inner.append(...nodes);
    line.append(inner);
    return line;
  }));
  heading.classList.add('is-split');
}
if (!reducedMotion.matches) {
  document.querySelectorAll('.hero h1, .journey-copy h2, .about-heading h2, .section-heading h2, .contact-copy h2').forEach(splitLines);
}

if (menuButton && siteNav) {
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    siteNav.classList.remove('open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? 'Open navigation menu' : 'Close navigation menu');
    siteNav.classList.toggle('open', !open);
  });
  siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

const currentYear = document.getElementById('current-year');
if (currentYear) currentYear.textContent = new Date().getFullYear();

// Hero discipline switcher. Its full, static equivalent is available to screen readers.
const roleSlot = document.querySelector('.role-slot');
const roles = ['product engineering', 'AI & machine learning', 'quantitative finance'];
let roleIndex = 0;
let roleTimer = 0;
function rotateRole() {
  if (!roleSlot || reducedMotion.matches || document.hidden) return;
  roleSlot.classList.add('is-switching');
  window.setTimeout(() => {
    roleIndex = (roleIndex + 1) % roles.length;
    roleSlot.textContent = roles[roleIndex];
    roleSlot.classList.remove('is-switching');
  }, 220);
}
function startRoleTimer() {
  if (roleTimer || !roleSlot || reducedMotion.matches) return;
  roleTimer = window.setInterval(rotateRole, 3000);
}
function stopRoleTimer() {
  window.clearInterval(roleTimer);
  roleTimer = 0;
}
startRoleTimer();

// Hero portrait crossfades between photos; the caption and counter follow along.
const portraitSlides = [...document.querySelectorAll('.portrait-slide')];
const portraitCaption = document.querySelector('.portrait-caption');
const portraitCount = document.querySelector('.portrait-count');
let portraitIndex = 0;
let portraitTimer = 0;
function showNextPortrait() {
  if (document.hidden) return;
  portraitSlides[portraitIndex].classList.remove('is-active');
  portraitIndex = (portraitIndex + 1) % portraitSlides.length;
  const slide = portraitSlides[portraitIndex];
  slide.classList.add('is-active');
  portraitCaption?.classList.add('is-switching');
  window.setTimeout(() => {
    if (portraitCaption) portraitCaption.textContent = slide.dataset.caption;
    if (portraitCount) portraitCount.textContent = `${String(portraitIndex + 1).padStart(2, '0')} — ${String(portraitSlides.length).padStart(2, '0')}`;
    portraitCaption?.classList.remove('is-switching');
  }, 300);
}
function startPortraitTimer() {
  if (portraitTimer || portraitSlides.length < 2 || reducedMotion.matches) return;
  portraitTimer = window.setInterval(showNextPortrait, 5500);
}
function stopPortraitTimer() {
  window.clearInterval(portraitTimer);
  portraitTimer = 0;
}
startPortraitTimer();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopRoleTimer();
    stopPortraitTimer();
  } else {
    startRoleTimer();
    startPortraitTimer();
  }
});

// Small one-shot flourishes that run as their section is revealed.
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
function within(root, selector) {
  return [...(root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];
}
function countUp(element) {
  const finalText = element.textContent.trim();
  const match = finalText.match(/^([\d,]*\.?\d+)(.*)$/);
  if (!match) return;
  const target = Number(match[1].replace(/,/g, ''));
  const decimals = (match[1].split('.')[1] || '').length;
  const grouped = match[1].includes(',');
  const format = (value) => (grouped ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : value.toFixed(decimals)) + match[2];
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 1500);
    element.textContent = t < 1 ? format(target * easeOutCubic(t)) : finalText;
    if (t < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
const scrambleGlyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ/#*+';
function scramble(element) {
  const finalText = element.textContent;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - start) / 650);
    const settled = Math.floor(progress * finalText.length);
    element.textContent = [...finalText].map((char, index) => (index < settled || char === ' ' ? char : scrambleGlyphs[Math.floor(Math.random() * scrambleGlyphs.length)])).join('');
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
function onReveal(target) {
  within(target, '.proof-value').forEach(countUp);
  within(target, '.section-rail .eyebrow').forEach(scramble);
}

// Prepare stroked chart lines so they can draw in when their card is revealed.
document.querySelectorAll('.project-visual svg path[fill="none"]').forEach((path) => {
  path.setAttribute('pathLength', '1');
  path.classList.add('draw-path');
});

// Reveal once on entry; avoid hiding or repeatedly animating already-read sections.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      onReveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Keep the experience rail aligned with the timeline as it moves through view.
const timeline = document.querySelector('.timeline');
const timelineDots = timeline ? [...timeline.querySelectorAll('.timeline-dot')] : [];
const hero = document.querySelector('.hero');
const parallaxTargets = [
  document.querySelector('.portrait-media'),
  ...document.querySelectorAll('.project-visual > :first-child'),
  document.querySelector('.flight-map'),
].filter(Boolean);
let scrollQueued = false;
const navLinks = siteNav ? [...siteNav.querySelectorAll('a[href^="#"]')] : [];
const navSections = navLinks.map((link) => document.querySelector(link.hash)).filter(Boolean);
function updateScrollState() {
  const range = document.documentElement.scrollHeight - window.innerHeight;
  document.documentElement.style.setProperty('--scroll-progress', String(range > 0 ? window.scrollY / range : 0));
  header?.classList.toggle('scrolled', window.scrollY > 20);
  if (!reducedMotion.matches && ambient) ambient.style.setProperty('--scroll-y', `${window.scrollY}px`);
  if (timeline) {
    const rect = timeline.getBoundingClientRect();
    const distance = Math.max(1, rect.height + window.innerHeight * .36);
    const progress = Math.max(0, Math.min(1, (window.innerHeight * .68 - rect.top) / distance));
    timeline.style.setProperty('--timeline-progress', `${progress * 100}%`);
    const filled = progress * rect.height;
    timelineDots.forEach((dot) => {
      const dotRect = dot.getBoundingClientRect();
      dot.classList.toggle('is-lit', filled >= dotRect.top + dotRect.height / 2 - rect.top);
    });
  }
  if (hero && !reducedMotion.matches) {
    const exit = Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * .85)));
    hero.style.setProperty('--hero-exit', exit.toFixed(3));
  }
  if (!reducedMotion.matches) {
    const viewportHeight = window.innerHeight || 1;
    parallaxTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > viewportHeight + 80) return;
      const centerProgress = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      const drift = Math.max(-17, Math.min(17, centerProgress * -22));
      target.style.setProperty('--scroll-drift', `${drift.toFixed(1)}px`);
    });
  }
  let active = null;
  navSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= 150) active = section;
  });
  navLinks.forEach((link) => {
    if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  window.requestAnimationFrame(updateScrollState);
}, { passive: true });
updateScrollState();

// A shared pill that glides to whichever control in a group is active.
function slidingIndicator(group) {
  if (!group) return () => {};
  const indicator = document.createElement('span');
  indicator.className = 'slide-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  group.prepend(indicator);
  group.classList.add('has-indicator');
  const update = () => {
    const active = group.querySelector('.is-active');
    if (!active) return;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.height = `${active.offsetHeight}px`;
    indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  };
  update();
  window.requestAnimationFrame(() => indicator.classList.add('is-ready'));
  window.addEventListener('resize', update, { passive: true });
  document.fonts?.ready.then(update);
  return update;
}

// Project filters with accessible pressed state and lightweight re-entry animation.
const filterButtons = [...document.querySelectorAll('.project-filter')];
const projectCards = [...document.querySelectorAll('.project-card')];
const updateFilterIndicator = slidingIndicator(document.querySelector('.project-filters'));
let filterTimeouts = [];
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    updateFilterIndicator();
    filterTimeouts.forEach(window.clearTimeout);
    filterTimeouts = [];
    projectCards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.remove('is-filtering-in', 'is-filtering-out');
      if (!show && !card.hidden) {
        card.classList.add('is-filtering-out');
        filterTimeouts.push(window.setTimeout(() => {
          card.hidden = true;
          card.classList.remove('is-filtering-out');
        }, reducedMotion.matches ? 0 : 260));
      } else if (show && card.hidden) {
        card.hidden = false;
        if (!reducedMotion.matches) {
          void card.offsetWidth;
          card.classList.add('is-filtering-in');
          filterTimeouts.push(window.setTimeout(() => card.classList.remove('is-filtering-in'), 460));
        }
      }
    });
  });
});

// Accessible tablist: arrow keys move focus and select the related skill group.
const skillTabs = [...document.querySelectorAll('.skill-tab')];
const skillPanels = [...document.querySelectorAll('.skill-panel')];
const updateSkillIndicator = slidingIndicator(document.querySelector('.skill-tabs'));
skillPanels.forEach((panel) => panel.querySelectorAll('.skill-chips span').forEach((chip, index) => chip.style.setProperty('--i', String(index))));
function activateSkillTab(tab, moveFocus = false) {
  skillTabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  skillPanels.forEach((panel) => {
    const selected = panel.dataset.panel === tab.dataset.skill;
    panel.hidden = !selected;
    panel.classList.toggle('is-active', selected);
  });
  updateSkillIndicator();
  if (moveFocus) tab.focus();
}
skillTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateSkillTab(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % skillTabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + skillTabs.length) % skillTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = skillTabs.length - 1;
    else return;
    event.preventDefault();
    activateSkillTab(skillTabs[nextIndex], true);
  });
});

// Optional pause control also pauses the SVG plane's SMIL motion.
const flightMap = document.querySelector('.flight-map');
const flightControl = document.querySelector('.flight-control');
const planeMotion = document.querySelector('.flight-plane animateMotion');
if (reducedMotion.matches) planeMotion?.ownerSVGElement?.pauseAnimations();
flightControl?.addEventListener('click', () => {
  const paused = flightMap?.classList.toggle('is-paused') ?? false;
  flightControl.setAttribute('aria-pressed', String(paused));
  flightControl.setAttribute('aria-label', paused ? 'Resume the flight animation' : 'Pause the flight animation');
  const label = flightControl.querySelector('.flight-control-label');
  const icon = flightControl.querySelector('.flight-control-icon');
  if (label) label.textContent = paused ? 'Resume flight' : 'Pause flight';
  if (icon) icon.textContent = paused ? '▶' : 'Ⅱ';
  if (planeMotion) paused ? planeMotion.pauseAnimations() : planeMotion.unpauseAnimations();
});

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (finePointer && !reducedMotion.matches) {
  // Cursor glow is throttled to one update per paint.
  let pointerPending = false;
  let pointerX = 0;
  let pointerY = 0;
  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (pointerPending) return;
    pointerPending = true;
    window.requestAnimationFrame(() => {
      ambient?.style.setProperty('--cursor-x', `${(pointerX / window.innerWidth) * 100}%`);
      ambient?.style.setProperty('--cursor-y', `${(pointerY / window.innerHeight) * 100}%`);
      pointerPending = false;
    });
  }, { passive: true });

  document.querySelectorAll('.magnetic').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty('--mag-x', `${((event.clientX - rect.left) / rect.width - .5) * 7}px`);
      button.style.setProperty('--mag-y', `${((event.clientY - rect.top) / rect.height - .5) * 7}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mag-x', '0px');
      button.style.setProperty('--mag-y', '0px');
    });
  });

  const portrait = document.querySelector('.portrait-card');
  portrait?.addEventListener('pointermove', (event) => {
    const rect = portrait.getBoundingClientRect();
    portrait.style.setProperty('--tilt-x', `${((event.clientX - rect.left) / rect.width - .5) * 3}deg`);
    portrait.style.setProperty('--tilt-y', `${(.5 - (event.clientY - rect.top) / rect.height) * 3}deg`);
  });
  portrait?.addEventListener('pointerleave', () => {
    portrait.style.setProperty('--tilt-x', '0deg');
    portrait.style.setProperty('--tilt-y', '0deg');
  });

  flightMap?.classList.add('interactive-flight');
  flightMap?.addEventListener('pointermove', (event) => {
    const rect = flightMap.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    flightMap.style.setProperty('--flight-light-x', `${(x + .5) * 100}%`);
    flightMap.style.setProperty('--flight-light-y', `${(y + .5) * 100}%`);
    flightMap.style.setProperty('--flight-tilt-x', `${x * 2}deg`);
    flightMap.style.setProperty('--flight-tilt-y', `${-y * 2}deg`);
  });
  flightMap?.addEventListener('pointerleave', () => {
    flightMap.style.setProperty('--flight-light-x', '50%');
    flightMap.style.setProperty('--flight-light-y', '50%');
    flightMap.style.setProperty('--flight-tilt-x', '0deg');
    flightMap.style.setProperty('--flight-tilt-y', '0deg');
  });

  document.querySelectorAll('.project-card').forEach((card) => {
    let framePending = false;
    let latestEvent;
    card.addEventListener('pointermove', (event) => {
      latestEvent = event;
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (latestEvent.clientX - rect.left) / rect.width;
        const y = (latestEvent.clientY - rect.top) / rect.height;
        card.style.setProperty('--pointer-x', `${x * 100}%`);
        card.style.setProperty('--pointer-y', `${y * 100}%`);
        card.style.setProperty('--tilt-x', `${(x - .5) * 3}deg`);
        card.style.setProperty('--tilt-y', `${(.5 - y) * 3}deg`);
        framePending = false;
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--pointer-x', '50%');
      card.style.setProperty('--pointer-y', '50%');
    });
  });
}

// Light, capped star field. Stops painting when the tab is hidden or off-screen.
let stars = [];
let canvasWidth = 0;
let canvasHeight = 0;
let starFrame = 0;
let lastFrame = 0;
let canvasVisible = true;
function drawStars(now, staticFrame = false) {
  if (!canvasContext || !canvasWidth || !canvasHeight || document.hidden || (!canvasVisible && !staticFrame)) return;
  const elapsed = Math.min((now - lastFrame) / 1000, .05);
  lastFrame = now;
  const scroll = reducedMotion.matches ? 0 : window.scrollY;
  canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
  stars.forEach((star) => {
    if (!staticFrame && !reducedMotion.matches) {
      star.x -= star.speed * elapsed;
      if (star.x < -2) star.x = canvasWidth + 2;
      star.phase += elapsed * .55;
    }
    const y = ((star.y - scroll * star.depth) % canvasHeight + canvasHeight) % canvasHeight;
    const alpha = reducedMotion.matches ? .27 : .13 + ((Math.sin(star.phase) + 1) / 2) * .31;
    canvasContext.beginPath();
    canvasContext.fillStyle = `rgba(176, 196, 240, ${alpha})`;
    canvasContext.arc(star.x, y, star.radius, 0, Math.PI * 2);
    canvasContext.fill();
  });
  if (!staticFrame && !reducedMotion.matches && canvasVisible && !document.hidden) starFrame = window.requestAnimationFrame(drawStars);
}
function resizeCanvas() {
  if (!canvas || !canvasContext) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = Math.round(canvasWidth * ratio);
  canvas.height = Math.round(canvasHeight * ratio);
  canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = Math.min(115, Math.max(46, Math.round(canvasWidth * canvasHeight / 14500)));
  stars = Array.from({ length: count }, () => ({ x: Math.random() * canvasWidth, y: Math.random() * canvasHeight, radius: Math.random() * 1.2 + .35, depth: Math.random() * .13 + .02, phase: Math.random() * Math.PI * 2, speed: Math.random() * .45 + .15 }));
  drawStars(performance.now(), true);
  if (!reducedMotion.matches && canvasVisible && !document.hidden) starFrame = window.requestAnimationFrame(drawStars);
}
if (canvas && canvasContext) {
  if ('IntersectionObserver' in window) {
    const canvasObserver = new IntersectionObserver(([entry]) => {
      canvasVisible = entry.isIntersecting;
      window.cancelAnimationFrame(starFrame);
      if (canvasVisible && !document.hidden && !reducedMotion.matches) starFrame = window.requestAnimationFrame(drawStars);
    });
    canvasObserver.observe(document.querySelector('.ambient'));
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => {
    window.cancelAnimationFrame(starFrame);
    if (!document.hidden && canvasVisible && !reducedMotion.matches) starFrame = window.requestAnimationFrame(drawStars);
  });
}
