/* main.js: theme toggle, mobile nav, scrolled header, footer year.
   Plain ES2017, no dependencies. Every DOM lookup is null-safe. */
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

  // ---------- M2 hooks ----------
  // M2: Vienna local clock (#localClock, Europe/Vienna via Intl.DateTimeFormat).
  // M2: Globe loader for .bento-location (lazy-load, centered on Vienna).
  // Add initClock() / initGlobe() here and call them from init() below.

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
