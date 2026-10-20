-- ============================================================================
-- Contador de visitas anónimo del portafolio
--
-- Cómo usarlo: en el panel de Supabase, abre el proyecto "Projects", ve a SQL Editor, pega TODO este archivo y
-- ejecútalo una vez. Se puede volver a ejecutar sin problema (usa "if not exists" y "create or replace").
--
-- Qué guarda por cada visita (y nada más):
--   viewed_at      la hora, redondeada a la hora en punto
--   path           la página vista (sin parámetros ni #)
--   referrer_host  solo el dominio desde el que se llegó, por ejemplo linkedin.com
--   country        el país aproximado (2 letras), si el servidor lo informa
--   language       el idioma del navegador (2 letras)
--   device         mobile, tablet o desktop, según el ancho de pantalla
--
-- Qué NO guarda: dirección IP, cookies, identificadores de la persona, agente de usuario ni la URL completa del origen.
--
-- Seguridad:
--   1. Las tablas tienen RLS activado y ninguna política: por la API pública nadie puede leerlas ni escribirlas.
--   2. La única puerta es la función register_visit, que valida y limpia todo lo que recibe, solo acepta peticiones
--      del dominio del portafolio y tiene un tope global por minuto y por día, para que nadie llene la base.
--   3. La clave "anon" del portafolio es pública por diseño. La clave "service_role" NUNCA va en el sitio.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabla de visitas
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  id             bigint generated always as identity primary key,
  viewed_at      timestamptz not null default date_trunc('hour', now()),
  path           text        not null default '/' check (char_length(path) <= 200),
  referrer_host  text        check (referrer_host is null or char_length(referrer_host) <= 100),
  country        text        check (country is null or country ~ '^[A-Z]{2}$'),
  language       text        check (language is null or language ~ '^[a-z]{2,3}$'),
  device         text        not null default 'desktop' check (device in ('mobile', 'tablet', 'desktop'))
);

create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at);

-- ---------------------------------------------------------------------------
-- Contadores por minuto para el tope de seguridad (no guardan nada de las personas)
-- ---------------------------------------------------------------------------
create table if not exists public.visit_rate_limit (
  bucket timestamptz primary key,
  hits   integer not null default 0
);

-- RLS activado y sin políticas = cerrado para la API pública. Además se quitan los permisos directos.
alter table public.page_views       enable row level security;
alter table public.visit_rate_limit enable row level security;

revoke all on table public.page_views       from public, anon, authenticated;
revoke all on table public.visit_rate_limit from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Función que registra una visita
-- ---------------------------------------------------------------------------
create or replace function public.register_visit(
  p_path          text    default '/',
  p_referrer_host text    default null,
  p_language      text    default null,
  p_screen_width  integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Dominios que pueden registrar visitas. Si cambias el dominio del portafolio, cámbialo aquí.
  allowed_origins constant text[] := array['https://th33andr3s.github.io'];
  -- Topes globales. El portafolio tiene poco tráfico: si algún día se queda corto, súbelos.
  max_per_minute  constant integer := 60;
  max_per_day     constant integer := 5000;

  request_headers json := coalesce(nullif(current_setting('request.headers', true), '')::json, '{}'::json);
  origin_header   text := request_headers ->> 'origin';
  minute_hits     integer;
  day_hits        integer;
  clean_path      text;
  clean_referrer  text;
  clean_language  text;
  clean_country   text;
  device_class    text;
begin
  -- 1. Solo peticiones que dicen venir del portafolio. Un script puede falsear este dato, por eso hay topes abajo.
  if origin_header is null or not (origin_header = any (allowed_origins)) then
    return;
  end if;

  -- 2. Topes globales: si se pasan, la visita se ignora sin error.
  insert into public.visit_rate_limit (bucket, hits)
  values (date_trunc('minute', now()), 1)
  on conflict (bucket) do update set hits = public.visit_rate_limit.hits + 1
  returning hits into minute_hits;

  if minute_hits > max_per_minute then
    return;
  end if;

  select coalesce(sum(hits), 0) into day_hits
  from public.visit_rate_limit
  where bucket >= date_trunc('day', now());

  if day_hits > max_per_day then
    return;
  end if;

  -- Limpieza de los contadores viejos (basta con los de los últimos dos días)
  delete from public.visit_rate_limit where bucket < now() - interval '2 days';

  -- 3. Se limpia cada dato; lo que no tenga la forma esperada se descarta, no se guarda tal cual.
  clean_path := case
    when p_path ~ '^/[A-Za-z0-9._~/-]*$' and char_length(p_path) <= 200 then p_path
    else '/'
  end;

  clean_referrer := case
    when lower(p_referrer_host) ~ '^[a-z0-9.-]{1,100}$' then lower(p_referrer_host)
    else null
  end;

  clean_language := case
    when lower(left(p_language, 3)) ~ '^[a-z]{2,3}$' then lower(left(p_language, 3))
    else null
  end;

  -- El país lo informa la red de Supabase en un encabezado; "XX" y "T1" significan desconocido o red Tor.
  clean_country := upper(request_headers ->> 'cf-ipcountry');
  if clean_country !~ '^[A-Z]{2}$' or clean_country in ('XX', 'T1') then
    clean_country := null;
  end if;

  device_class := case
    when p_screen_width is null then 'desktop'
    when p_screen_width < 600 then 'mobile'
    when p_screen_width < 1024 then 'tablet'
    else 'desktop'
  end;

  insert into public.page_views (path, referrer_host, country, language, device)
  values (clean_path, clean_referrer, clean_country, clean_language, device_class);
end;
$$;

-- Solo la API pública puede llamar a la función; nadie más hereda el permiso por defecto.
revoke all on function public.register_visit(text, text, text, integer) from public;
grant execute on function public.register_visit(text, text, text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- OPCIONAL: borrar visitas de más de 24 meses cada domingo a las 3:00.
-- Primero activa la extensión en Database > Extensions > pg_cron, y luego quita los "--" de la línea siguiente.
-- ---------------------------------------------------------------------------
-- select cron.schedule('delete_old_page_views', '0 3 * * 0', $$delete from public.page_views where viewed_at < now() - interval '24 months'$$);

-- ---------------------------------------------------------------------------
-- CONSULTAS PARA VER LOS NÚMEROS (se ejecutan en el SQL Editor, con tu sesión de dueño del proyecto)
-- ---------------------------------------------------------------------------
-- Total de visitas:
--   select count(*) as total from public.page_views;
-- Visitas por día, últimos 30 días:
--   select viewed_at::date as day, count(*) as views from public.page_views
--   where viewed_at >= now() - interval '30 days' group by 1 order by 1 desc;
-- De dónde llegan:
--   select coalesce(referrer_host, '(directo)') as source, count(*) as views from public.page_views
--   group by 1 order by 2 desc limit 20;
-- Países:
--   select coalesce(country, '??') as country, count(*) as views from public.page_views group by 1 order by 2 desc;
-- Celular, tableta o computador:
--   select device, count(*) as views from public.page_views group by 1 order by 2 desc;
-- Idioma del navegador:
--   select coalesce(language, '??') as language, count(*) as views from public.page_views group by 1 order by 2 desc;
