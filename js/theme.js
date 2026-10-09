(function () {
  const root = document.documentElement;

  const LABELS = {
    es: { toLight: 'Cambiar a modo claro', toDark: 'Cambiar a modo oscuro' },
    en: { toLight: 'Switch to light mode', toDark: 'Switch to dark mode' },
  };

  // La preferencia inicial ya la fija el script inline de <head> (evita el flash de tema).
  // Esto es solo un respaldo por si ese script no estuviera presente.
  if (!root.hasAttribute('data-theme')) {
    let stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) { /* storage bloqueado */ }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    root.setAttribute('data-theme', stored === 'light' || stored === 'dark' ? stored : (prefersLight ? 'light' : 'dark'));
  }

  function saveTheme(theme) {
    try { localStorage.setItem('theme', theme); } catch (e) { /* sin persistencia si el storage está bloqueado */ }
  }

  function currentLang() {
    return document.body.getAttribute('data-lang') === 'en' ? 'en' : 'es';
  }

  function updateIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const labels = LABELS[currentLang()];
    btn.setAttribute('aria-label', theme === 'dark' ? labels.toLight : labels.toDark);
    btn.querySelector('.icon-sun').style.display = theme === 'dark' ? 'block' : 'none';
    btn.querySelector('.icon-moon').style.display = theme === 'dark' ? 'none' : 'block';
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateIcon(root.getAttribute('data-theme'));
    const btn = document.getElementById('theme-toggle');
    btn?.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      saveTheme(next);
      updateIcon(next);
      window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    });
  });

  // el label del botón depende del idioma activo
  window.addEventListener('langchange', () => updateIcon(root.getAttribute('data-theme')));
})();
