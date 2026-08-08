(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  function attachTilt(el, strength) {
    let raf = null;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateZ(0)`;
      });
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.card').forEach((el) => attachTilt(el, 6));

    const sim = document.querySelector('.sim-stage');
    const hero3d = document.querySelector('.hero-3d');
    if (sim && hero3d) {
      hero3d.addEventListener('mousemove', (e) => {
        const rect = hero3d.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        sim.style.transform = `rotateY(${(px * 40).toFixed(2)}deg) rotateX(${(-py * 40).toFixed(2)}deg)`;
      });
      hero3d.addEventListener('mouseleave', () => {
        sim.style.transform = '';
      });
    }
  });
})();
