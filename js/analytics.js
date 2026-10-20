/*
  Contador de visitas anónimo.

  Por cada vista de página envía a Supabase (función register_visit, ver supabase/visit_counter.sql) solo:
  la página, el dominio de origen (sin la URL completa), el idioma del navegador y el ancho de pantalla.
  No usa cookies ni almacenamiento para identificar a nadie, no envía la dirección IP como dato (el servidor solo
  deduce el país) y no cuenta a quien tenga activada la señal "No rastrear". Todo está explicado en la nota de
  privacidad del pie de página.

  La clave anon es pública por diseño: la seguridad la dan la función y las políticas de la base de datos.
  La clave service_role NUNCA debe aparecer aquí (scripts/check-site.mjs lo comprueba).
*/
(function () {
  'use strict';

  const SUPABASE_URL = 'https://skifmhzhajjnhtuibdte.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraWZtaHpoYWpqbmh0dWliZHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjYzMTksImV4cCI6MjEwNjY0MjMxOX0._wHeNnb7BYDJuO03tjn9eB7YLSuOIXzNCa5BpPqUTL0';
  const ENDPOINT = SUPABASE_URL + '/rest/v1/rpc/register_visit';

  // Quien visite con ?analytics=off deja de contarse en ese navegador (para no contar mis propias visitas);
  // con ?analytics=on vuelve a contarse. Es un interruptor de exclusión: no identifica a nadie.
  const OPT_OUT_KEY = 'analytics_off';
  const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit/i;

  function isLocalHost(host) {
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '' || host.endsWith('.localhost');
  }

  // "No rastrear" (DNT) y Global Privacy Control: si están activas, no se cuenta la visita.
  function privacySignalOn() {
    return (
      navigator.doNotTrack === '1' ||
      window.doNotTrack === '1' ||
      navigator.msDoNotTrack === '1' ||
      navigator.globalPrivacyControl === true
    );
  }

  function readOptOut() {
    try {
      const flag = new URLSearchParams(location.search).get('analytics');
      if (flag === 'off') localStorage.setItem(OPT_OUT_KEY, '1');
      if (flag === 'on') localStorage.removeItem(OPT_OUT_KEY);
      return localStorage.getItem(OPT_OUT_KEY) === '1';
    } catch (e) {
      return false; // storage bloqueado: simplemente no hay exclusión guardada
    }
  }

  // Solo el dominio del sitio de origen, nunca la URL completa; las visitas internas no cuentan como origen.
  function referrerHost() {
    if (!document.referrer) return null;
    try {
      const host = new URL(document.referrer).hostname;
      return host && host !== location.hostname ? host : null;
    } catch (e) {
      return null;
    }
  }

  function shouldCount() {
    if (location.protocol !== 'https:' || isLocalHost(location.hostname)) return false;
    if (navigator.webdriver || BOT_PATTERN.test(navigator.userAgent || '')) return false;
    if (privacySignalOn()) return false;
    return !readOptOut();
  }

  function send() {
    const payload = {
      p_path: location.pathname,
      p_referrer_host: referrerHost(),
      p_language: (navigator.language || '').slice(0, 2).toLowerCase() || null,
      p_screen_width: window.innerWidth || null,
    };
    // credentials omit: sin cookies. referrerPolicy no-referrer: la petición no revela la URL de esta página.
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }).catch(function () {
      /* contar visitas nunca debe romper ni ensuciar la página */
    });
  }

  function start() {
    if (!shouldCount()) return;
    // Una pestaña abierta en segundo plano o precargada no es una visita: se cuenta cuando se ve de verdad.
    if (document.visibilityState === 'visible') {
      send();
      return;
    }
    const onVisible = function () {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVisible);
      send();
    };
    document.addEventListener('visibilitychange', onVisible);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
