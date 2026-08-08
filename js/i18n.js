(function () {
  const stored = localStorage.getItem('lang');
  const browserLang = navigator.language?.startsWith('en') ? 'en' : 'es';
  const initial = stored || browserLang;

  function apply(lang) {
    document.body.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
    localStorage.setItem('lang', lang);
  }

  document.addEventListener('DOMContentLoaded', () => {
    apply(initial);
    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.addEventListener('click', () => apply(b.dataset.lang));
    });
  });
})();
