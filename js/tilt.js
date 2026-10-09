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
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      // se quita el transform en línea: la tarjeta vuelve a su estado normal con la transición de .card
      el.style.transform = '';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Opt-in: solo los elementos con clase .tilt (tarjetas de dominio y de proyecto).
    // Las tarjetas de texto largo y los enlaces de contacto no se inclinan.
    document.querySelectorAll('.tilt').forEach((el) => attachTilt(el, 6));

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
