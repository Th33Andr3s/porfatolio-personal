(function () {
  const canvas = document.getElementById('neural-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let width = 0, height = 0, dpr = 1;
  let nodes = [];
  let rafId = null;
  let resizeTimer = null;
  const mouse = { x: null, y: null };
  const LINK_DIST = 150;
  const MOUSE_DIST = 180;

  function colors() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return dark
      ? { node: 'rgba(79,124,255,0.85)', line: 'rgba(79,124,255,', accent: 'rgba(168,85,247,' }
      : { node: 'rgba(52,87,230,0.55)', line: 'rgba(52,87,230,', accent: 'rgba(139,47,214,' };
  }

  function makeNode() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 1,
    };
  }

  function resize() {
    const prevW = width, prevH = height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Conservar los nodos existentes (reescalados) en lugar de regenerarlos:
    // en móvil la barra de direcciones dispara "resize" y los nodos no deben saltar.
    if (prevW && prevH) {
      const sx = width / prevW, sy = height / prevH;
      for (const n of nodes) { n.x *= sx; n.y *= sy; }
    }
    const count = Math.min(90, Math.floor((width * height) / 16000));
    if (nodes.length > count) nodes.length = count;
    while (nodes.length < count) nodes.push(makeNode());

    if (motionQuery.matches) draw(); // sin animación: redibujar el fotograma estático
  }

  function update() {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }
  }

  function draw() {
    const c = colors();
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = c.line + (1 - dist / LINK_DIST) * 0.35 + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (mouse.x !== null) {
        const dist = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
        if (dist < MOUSE_DIST) {
          ctx.strokeStyle = c.accent + (1 - dist / MOUSE_DIST) * 0.5 + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = c.node;
      ctx.fill();
    }
  }

  function frame() {
    update();
    draw();
    rafId = requestAnimationFrame(frame);
  }

  // Animación continua salvo que el usuario prefiera movimiento reducido (entonces, un fotograma estático).
  function sync() {
    if (motionQuery.matches) {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      draw();
    } else if (rafId === null) {
      rafId = requestAnimationFrame(frame);
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  // "mouseleave" no burbujea hasta window: se escucha en el elemento raíz.
  document.documentElement.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
  // En el fotograma estático los colores solo cambian al redibujar.
  window.addEventListener('themechange', () => { if (motionQuery.matches) draw(); });
  motionQuery.addEventListener('change', sync);

  resize();
  sync();
})();
