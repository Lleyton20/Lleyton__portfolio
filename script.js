const glow = document.querySelector('.cursor-glow');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.links a');
const navPill = document.querySelector('.nav-pill');
const navContainer = document.querySelector('.links');
const sections = document.querySelectorAll('section[id], main#home');

function moveNavPill(link) {
  if (!navPill || !link || window.innerWidth <= 700) return;
  navPill.style.width = `${link.offsetWidth}px`;
  navPill.style.transform = `translateX(${link.offsetLeft}px)`;
}

function setActiveNav(id) {
  if (!id) {
    navLinks.forEach((link) => link.classList.remove('active'));
    if (navPill) navPill.style.opacity = '0';
    return;
  }
  if (navPill) navPill.style.opacity = '1';
  navLinks.forEach((link) => {
    const href = link.getAttribute('href').slice(1);
    const isActive = href === id;
    link.classList.toggle('active', isActive);
    if (isActive) moveNavPill(link);
  });
}

if (navContainer) {
  navLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => moveNavPill(link));
  });
  navContainer.addEventListener('mouseleave', () => {
    const active = document.querySelector('.links a.active');
    if (active) moveNavPill(active);
  });
}

window.addEventListener('resize', () => {
  const active = document.querySelector('.links a.active');
  if (active) moveNavPill(active);
});

window.addEventListener('pointermove', (e) => {
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;

  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;

  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    heroVisual.style.transform = `translate(${x * 8}px, ${y * 6}px)`;
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    animateCounter(entry.target);
    counterObserver.unobserve(entry.target);
  });
}, { threshold: 0.5 });

function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const compact = el.hasAttribute('data-compact');
  const duration = 1600;
  const start = performance.now();

  function format(value) {
    if (compact && value >= 1000) return `${Math.round(value / 1000)}K`;
    return decimals ? value.toFixed(decimals) : Math.round(value).toString();
  }

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${format(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

document.querySelectorAll('.counter').forEach((el) => counterObserver.observe(el));

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 24);

  let current = '';
  sections.forEach((section) => {
    const top = section.offsetTop - 140;
    if (window.scrollY >= top) current = section.id || '';
  });

  setActiveNav(current);
}, { passive: true });

const heroImg = document.querySelector('.hero-visual img');
if (heroImg) {
  window.addEventListener('scroll', () => {
    const offset = Math.min(window.scrollY * 0.08, 40);
    heroImg.style.transform = `translateY(${offset}px)`;
  }, { passive: true });
}

const menuBtn = document.querySelector('.menu-btn');
const links = document.querySelector('.links');

menuBtn.addEventListener('click', () => {
  links.classList.toggle('open');
});

document.querySelectorAll('.links a').forEach((link) => {
  link.addEventListener('click', () => links.classList.remove('open'));
});

document.body.classList.add('loaded');
window.dispatchEvent(new Event('scroll'));

document.querySelectorAll('.experience-card, .project-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

const CONTACT = {
  gsu: { type: 'email', value: 'lmagama@gsumail.gram.edu', label: 'GSU Email' },
  personal: { type: 'email', value: 'lleytonedu2001@gmail.com', label: 'Personal Email' },
  phone: { type: 'phone', value: '+14803709238', label: 'Phone / Text' },
  linkedin: { type: 'linkedin', value: 'https://www.linkedin.com/in/lleyton-magama-57721826a/', label: 'LinkedIn' },
};

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = data.get('name').trim();
    const replyEmail = data.get('reply-email').trim();
    const message = data.get('message').trim();
    const method = data.get('method');
    const channel = CONTACT[method];

    const fullMessage = `Hi Lleyton,\n\n${message}\n\n— ${name}\nReply to: ${replyEmail}`;
    const subject = encodeURIComponent(`Portfolio message from ${name}`);
    const body = encodeURIComponent(fullMessage);

    if (channel.type === 'email') {
      window.location.href = `mailto:${channel.value}?subject=${subject}&body=${body}`;
      formStatus.textContent = 'Opening your email app…';
    } else if (channel.type === 'phone') {
      window.location.href = `sms:${channel.value}?body=${body}`;
      formStatus.textContent = 'Opening your messaging app…';
    } else if (channel.type === 'linkedin') {
      navigator.clipboard.writeText(fullMessage).then(() => {
        window.open(channel.value, '_blank', 'noopener');
        formStatus.textContent = 'Message copied! Paste it in LinkedIn and send.';
      }).catch(() => {
        window.open(channel.value, '_blank', 'noopener');
        formStatus.textContent = 'LinkedIn opened — send me a message there!';
      });
    }

    contactForm.reset();
    contactForm.querySelector('[value="gsu"]').checked = true;
  });
}
