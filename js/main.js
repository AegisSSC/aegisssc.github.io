/* main.js: theme toggle, mobile nav, scrolled header, footer year,
   SITE data binding, local clock, connect links, tool marquee, globe loader.
   Plain ES2017, no dependencies (globe.js is lazy-loaded). Every DOM lookup is null-safe. */
(function () {
  'use strict';

  const root = document.documentElement;
  const THEME_KEY = 'theme';
  const MOBILE_BREAKPOINT = 760;
  const SCROLL_THRESHOLD = 10;

  // ---------- Storage helpers ----------
  function readStoredTheme() {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* storage blocked (private mode, etc.): the theme still applies for this page view */
    }
  }

  // ---------- Element refs ----------
  // Resolved in init() so the script also works without defer.
  let themeToggle = null;
  let header = null;
  let navToggle = null;
  let mobileNav = null;

  // ---------- Theme ----------
  const lightQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function systemTheme() {
    return lightQuery && lightQuery.matches ? 'light' : 'dark';
  }

  function currentTheme() {
    return root.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function syncThemeColorMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (bg) meta.setAttribute('content', bg);
  }

  function syncThemeToggleLabel(theme) {
    if (!themeToggle) return;
    const next = theme === 'light' ? 'dark' : 'light';
    themeToggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    syncThemeToggleLabel(theme);
    syncThemeColorMeta();
  }

  function onThemeToggleClick() {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    storeTheme(next);
    applyTheme(next);
  }

  function onSystemThemeChange() {
    // Follow the OS only while the user has made no explicit choice.
    if (readStoredTheme() === null) applyTheme(systemTheme());
  }

  function initTheme() {
    applyTheme(readStoredTheme() || root.dataset.theme || systemTheme());
    if (themeToggle) themeToggle.addEventListener('click', onThemeToggleClick);
    if (!lightQuery) return;
    if (lightQuery.addEventListener) lightQuery.addEventListener('change', onSystemThemeChange);
    else if (lightQuery.addListener) lightQuery.addListener(onSystemThemeChange); // older Safari
  }

  // ---------- Mobile nav ----------
  function isNavOpen() {
    return !!mobileNav && mobileNav.classList.contains('is-open');
  }

  function setNavOpen(open) {
    if (mobileNav) mobileNav.classList.toggle('is-open', open);
    if (header) header.classList.toggle('nav-open', open);
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }

  function onNavLinkClick(event) {
    if (event.target.closest && event.target.closest('a')) setNavOpen(false);
  }

  function onKeydown(event) {
    if (event.key !== 'Escape' || !isNavOpen()) return;
    setNavOpen(false);
    if (navToggle) navToggle.focus();
  }

  function onResize() {
    if (window.innerWidth > MOBILE_BREAKPOINT && isNavOpen()) setNavOpen(false);
  }

  function initMobileNav() {
    if (!navToggle || !mobileNav) return;
    navToggle.addEventListener('click', function () { setNavOpen(!isNavOpen()); });
    mobileNav.addEventListener('click', onNavLinkClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize, { passive: true });
  }

  // ---------- Scrolled header ----------
  function updateScrolledHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  }

  function initScrolledHeader() {
    if (!header) return;
    updateScrolledHeader();
    window.addEventListener('scroll', updateScrolledHeader, { passive: true });
  }

  // ---------- Footer year ----------
  function initFooterYear() {
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  // ---------- Site content (js/content.js) ----------
  // SITE is optional: without it every section keeps its static placeholder HTML.
  const DEFAULT_TIME_ZONE = 'Europe/Vienna';
  const DEFAULT_LOCATION = [48.2082, 16.3738];
  const SITE_TEXT_KEYS = ['name', 'initials', 'tagline', 'status', 'city'];

  function site() {
    const value = window.SITE;
    return value && typeof value === 'object' ? value : null;
  }

  function siteString(key) {
    const s = site();
    const value = s ? s[key] : null;
    return typeof value === 'string' && value.trim() ? value : null;
  }

  function siteLocation() {
    const s = site();
    const loc = s && s.location;
    if (Array.isArray(loc) && loc.length === 2 && isFinite(loc[0]) && isFinite(loc[1])) {
      return [Number(loc[0]), Number(loc[1])];
    }
    return DEFAULT_LOCATION;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ---------- Data binding ----------
  function initSiteText() {
    const nodes = document.querySelectorAll('[data-site]');
    for (let i = 0; i < nodes.length; i++) {
      const key = nodes[i].getAttribute('data-site');
      if (SITE_TEXT_KEYS.indexOf(key) === -1) continue;
      const value = siteString(key);
      if (value !== null) nodes[i].textContent = value;
    }
    const name = siteString('name');
    if (name) document.title = name + ' — Portfolio';

    const city = siteString('city');
    const canvas = document.getElementById('globe');
    if (canvas && city) {
      const anchors = site() && Array.isArray(site().anchors) ? site().anchors : [];
      const names = anchors.map(function (a) { return a && a.name; }).filter(Boolean);
      canvas.setAttribute('aria-label', 'Globe centered on ' + city +
        (names.length ? ', linked to ' + names.join('; ') : ''));
    }

    const fallback = document.querySelector('#globeWrap .globe-fallback');
    if (fallback && site() && site().location) {
      const loc = siteLocation();
      fallback.textContent =
        Math.abs(loc[0]).toFixed(2) + '° ' + (loc[0] >= 0 ? 'N' : 'S') + ', ' +
        Math.abs(loc[1]).toFixed(2) + '° ' + (loc[1] >= 0 ? 'E' : 'W');
    }
  }

  // ---------- Local clock ----------
  let clockTimer = 0;
  let clockEl = null;
  let zoneEl = null;
  let timeFormat = null;
  let zoneFormat = null;

  function zoneName(date) {
    if (!zoneFormat || !zoneFormat.formatToParts) return null;
    const parts = zoneFormat.formatToParts(date);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].type === 'timeZoneName') return parts[i].value;
    }
    return null;
  }

  function tickClock() {
    clockTimer = 0;
    const now = new Date();
    if (clockEl) clockEl.textContent = timeFormat.format(now);
    if (zoneEl) {
      const zone = zoneName(now);
      if (zone && zoneEl.textContent !== zone) zoneEl.textContent = zone;
    }
    if (document.hidden) return;
    // Aligned to the next full second (+ a few ms so we never land just before it).
    clockTimer = window.setTimeout(tickClock, 1000 - (Date.now() % 1000) + 5);
  }

  function onClockVisibilityChange() {
    if (clockTimer) {
      window.clearTimeout(clockTimer);
      clockTimer = 0;
    }
    if (!document.hidden) tickClock();
  }

  function initClock() {
    clockEl = document.getElementById('localClock');
    zoneEl = document.getElementById('localZone');
    if (!clockEl || !window.Intl || !Intl.DateTimeFormat) return;
    const timeZone = siteString('timeZone') || DEFAULT_TIME_ZONE;
    try {
      timeFormat = new Intl.DateTimeFormat('en-GB', {
        timeZone: timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
      zoneFormat = new Intl.DateTimeFormat('en-GB', { timeZone: timeZone, timeZoneName: 'short' });
    } catch (e) {
      return; // unknown time zone: keep the static placeholder
    }
    document.addEventListener('visibilitychange', onClockVisibilityChange);
    tickClock();
  }

  // ---------- Connect links ----------
  const CONNECT_LINKS = [
    { key: 'github', label: 'GitHub', external: true },
    { key: 'linkedin', label: 'LinkedIn', external: true },
    { key: 'email', label: 'Email', external: false },
  ];

  function connectHref(key, value) {
    if (key === 'email') return 'mailto:' + value.replace(/^mailto:/i, '');
    return value;
  }

  function initConnectLinks() {
    const list = document.getElementById('connectLinks');
    const s = site();
    if (!list || !s || !s.links || typeof s.links !== 'object') return;

    const fragment = document.createDocumentFragment();
    let count = 0;
    CONNECT_LINKS.forEach(function (link) {
      const value = s.links[link.key];
      if (typeof value !== 'string' || !value.trim()) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = connectHref(link.key, value.trim());
      if (link.external) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      a.appendChild(document.createTextNode(link.label + ' '));
      const arrow = document.createElement('span');
      arrow.className = 'link-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      a.appendChild(arrow);
      li.appendChild(a);
      fragment.appendChild(li);
      count++;
    });
    if (!count) return; // nothing configured: keep the static fallback
    list.textContent = '';
    list.appendChild(fragment);
  }

  // ---------- Tool marquee ----------
  const ICON_CDN = 'https://cdn.simpleicons.org/';

  function buildToolTrack(tools) {
    const track = document.createElement('ul');
    track.className = 'tool-track';
    tools.forEach(function (tool) {
      if (!tool || typeof tool.name !== 'string' || typeof tool.slug !== 'string') return;
      const slug = tool.slug.trim().toLowerCase();
      if (!/^[a-z0-9.+-]+$/.test(slug)) return;
      const li = document.createElement('li');
      li.className = 'tool';
      li.title = tool.name;
      const icon = document.createElement('span');
      icon.className = 'tool-icon';
      icon.style.setProperty('--icon', "url('" + ICON_CDN + encodeURIComponent(slug) + "')");
      const name = document.createElement('span');
      name.className = 'tool-name';
      name.textContent = tool.name;
      li.appendChild(icon);
      li.appendChild(name);
      track.appendChild(li);
    });
    return track;
  }

  function initToolMarquee() {
    const marquee = document.getElementById('toolMarquee');
    const s = site();
    if (!marquee || !s || !Array.isArray(s.tools) || !s.tools.length) return;
    const track = buildToolTrack(s.tools);
    if (!track.children.length) return;
    // Second copy makes the -100% loop seamless; hidden from assistive tech.
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marquee.textContent = '';
    marquee.appendChild(track);
    marquee.appendChild(clone);
  }

  // ---------- Globe loader ----------
  // globe.js is an ES module; main.js is a classic script, so the URL is resolved
  // against the page before the dynamic import.
  function showGlobeFallback(wrap) {
    wrap.classList.add('is-fallback');
    const canvas = wrap.querySelector('canvas');
    const hint = wrap.querySelector('.globe-hint');
    const fallback = wrap.querySelector('.globe-fallback');
    if (canvas) canvas.hidden = true;
    if (hint) hint.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  function importModule(url) {
    return import(url);
  }

  function loadGlobe(wrap) {
    let url;
    try {
      url = new URL('js/globe.js', document.baseURI).href;
    } catch (e) {
      showGlobeFallback(wrap);
      return;
    }
    importModule(url)
      .then(function (mod) {
        if (!mod || typeof mod.mountGlobe !== 'function') throw new Error('globe.js: mountGlobe missing');
        const anchors = site() && Array.isArray(site().anchors) ? site().anchors : [];
        return mod.mountGlobe(wrap, {
          location: siteLocation(),
          homeName: siteString('city') || 'Home',
          anchors: anchors,
          reducedMotion: prefersReducedMotion(),
        });
      })
      .catch(function (err) {
        showGlobeFallback(wrap);
        if (window.console && console.warn) console.warn('Globe unavailable:', err);
      });
  }

  function initGlobe() {
    const wrap = document.getElementById('globeWrap');
    if (!wrap) return;
    if (!('IntersectionObserver' in window)) {
      loadGlobe(wrap);
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      for (let i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        observer.disconnect();
        loadGlobe(wrap);
        return;
      }
    }, { rootMargin: '200px' });
    observer.observe(wrap);
  }

  // ---------- Init ----------
  function init() {
    themeToggle = document.getElementById('themeToggle');
    header = document.getElementById('siteHeader');
    navToggle = document.getElementById('navToggle');
    mobileNav = document.getElementById('mobileNav');
    initTheme();
    initMobileNav();
    initScrolledHeader();
    initFooterYear();
    // M2: each step is isolated so one failure never blocks the rest.
    [initSiteText, initClock, initConnectLinks, initToolMarquee, initGlobe].forEach(function (step) {
      try {
        step();
      } catch (e) {
        if (window.console && console.error) console.error(e);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
