(function () {
  const META_DESCRIPTION = {
    es: 'Portafolio de Andres Felipe Olaya Cadena: Ingeniero de Software full-stack especializado en automatización, datos, IA/ML e infraestructura cloud.',
    en: 'Portfolio of Andres Felipe Olaya Cadena: full-stack Software Engineer specialized in automation, data, AI/ML and cloud infrastructure.',
  };

  let stored = null;
  try { stored = localStorage.getItem('lang'); } catch (e) { /* storage bloqueado */ }
  const browserLang = navigator.language?.startsWith('en') ? 'en' : 'es';
  const initial = stored === 'es' || stored === 'en' ? stored : browserLang;

  function saveLang(lang) {
    try { localStorage.setItem('lang', lang); } catch (e) { /* sin persistencia si el storage está bloqueado */ }
  }

  function apply(lang) {
    document.body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      const active = b.dataset.lang === lang;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });

    // aria-label declarativos: data-aria-es / data-aria-en
    document.querySelectorAll('[data-aria-es][data-aria-en]').forEach((el) => {
      el.setAttribute('aria-label', el.getAttribute('data-aria-' + lang));
    });

    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', META_DESCRIPTION[lang]);

    saveLang(lang);
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    apply(initial);
    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.addEventListener('click', () => apply(b.dataset.lang));
    });
  });
})();
