/*
  Contador de visitas anónimo.

  Por cada vista de página envía a Supabase (función register_visit, ver supabase/visit_counter.sql) solo:
  la página, el dominio de origen (sin la URL completa), el idioma del navegador y el ancho de pantalla.
  No usa cookies ni almacenamiento para identificar a nadie, no envía la dirección IP como dato (el servidor solo
  deduce el país) y no cuenta a quien tenga activada la señal "No rastrear". Solo cuenta una visita cuando hubo una
  interacción real con la página (ver más abajo), para dejar fuera a los robots y a los revisores automáticos de
  enlaces. Todo está explicado en la nota de privacidad del pie de página.

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

  // Una visita solo se cuenta cuando una persona interactúa con la página (mover el mouse, tocar, usar el teclado
  // o la rueda) y la ha tenido a la vista unos segundos. Los revisores automáticos de enlaces (por ejemplo los que
  // usan las redes sociales) y los robots cargan la página, no hacen nada de eso y se van, así que no se cuentan.
  // Solo valen los eventos reales del navegador (isTrusted): un script que los simule no cuenta.
  const MIN_VISIBLE_MS = 2500;
  const INTERACTION_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel'];
  const LISTENER_OPTIONS = { passive: true, capture: true };

  function start() {
    if (!shouldCount()) return;

    let interacted = false;
    let visibleMs = 0; // tiempo acumulado con la pestaña a la vista, sin contar el tramo en curso
    let visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
    let timer = 0;

    function visibleTime() {
      return visibleMs + (visibleSince === null ? 0 : performance.now() - visibleSince);
    }

    function finish() {
      clearTimeout(timer);
      INTERACTION_EVENTS.forEach(function (type) {
        window.removeEventListener(type, onInteraction, LISTENER_OPTIONS);
      });
      document.removeEventListener('visibilitychange', onVisibility);
      send();
    }

    // Cuenta cuando ya hubo interacción y la página lleva a la vista el tiempo mínimo; si falta, espera lo que falte.
    function check() {
      if (!interacted || visibleSince === null) return;
      const missing = MIN_VISIBLE_MS - visibleTime();
      if (missing <= 0) {
        finish();
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(check, missing);
    }

    function onInteraction(event) {
      if (!event.isTrusted || interacted) return;
      interacted = true;
      check();
    }

    // Una pestaña en segundo plano o precargada no suma tiempo: se cuenta lo que esté a la vista de verdad.
    function onVisibility() {
      if (document.visibilityState === 'visible') {
        visibleSince = performance.now();
        check();
      } else {
        visibleMs = visibleTime();
        visibleSince = null;
        clearTimeout(timer);
      }
    }

    INTERACTION_EVENTS.forEach(function (type) {
      window.addEventListener(type, onInteraction, LISTENER_OPTIONS);
    });
    document.addEventListener('visibilitychange', onVisibility);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
