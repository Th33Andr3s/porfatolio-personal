document.addEventListener('DOMContentLoaded', () => {
  // Header scroll state
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile nav
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (navToggle && mobileNav) {
    const isOpen = () => mobileNav.classList.contains('is-open');

    const setMenu = (open, restoreFocus = false) => {
      navToggle.classList.toggle('is-open', open);
      mobileNav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      mobileNav.inert = !open;
      document.documentElement.classList.toggle('menu-open', open);
      if (!open && restoreFocus) navToggle.focus();
    };

    setMenu(false);
    navToggle.addEventListener('click', () => setMenu(!isOpen()));
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) setMenu(false, true);
    });

    // Si se ensancha la ventana con el menú abierto, el drawer deja de existir: liberar scroll y foco.
    window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
      if (e.matches && isOpen()) setMenu(false);
    });
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    // Navegadores sin IntersectionObserver: mostrar todo en lugar de dejarlo oculto.
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Current year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
