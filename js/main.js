/* main.js: theme toggle, mobile nav, scrolled header, footer year,
   SITE data binding, local clock, connect links, tool marquee, globe loader,
   and the M3 content renderers (about, projects, skills, experience, education,
   activity chart, contact).
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
      // A count, not 20-odd names: a screen reader reads this label in one go.
      const names = anchors.map(function (a) { return a && a.name; }).filter(Boolean);
      canvas.setAttribute('aria-label', 'Globe centered on ' + city +
        (names.length ? ', linked to ' + names.length + ' other locations' : ''));
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

  function linkArrow() {
    const arrow = document.createElement('span');
    arrow.className = 'link-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    return arrow;
  }

  // One <li><a> per configured entry of SITE.links. Empty entries are skipped.
  function buildSiteLinks(withArrow) {
    const s = site();
    const links = s && s.links && typeof s.links === 'object' ? s.links : null;
    const fragment = document.createDocumentFragment();
    if (!links) return fragment;
    CONNECT_LINKS.forEach(function (link) {
      const value = links[link.key];
      if (typeof value !== 'string' || !value.trim()) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = connectHref(link.key, value.trim());
      if (link.external) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      if (withArrow) {
        a.appendChild(document.createTextNode(link.label + ' '));
        a.appendChild(linkArrow());
      } else {
        a.textContent = link.label;
      }
      li.appendChild(a);
      fragment.appendChild(li);
    });
    return fragment;
  }

  // Replaces a list's static fallback only when there is something to show.
  function fillLinkList(list, withArrow) {
    if (!list) return;
    const fragment = buildSiteLinks(withArrow);
    if (!fragment.childNodes.length) return; // nothing configured: keep the static fallback
    list.textContent = '';
    list.appendChild(fragment);
  }

  function initConnectLinks() {
    fillLinkList(document.getElementById('connectLinks'), true);
  }

  // ---------- Tool marquee ----------
  // Official brand colours: https://cdn.simpleicons.org/<slug> serves the icon in
  // the brand's own colour and /<slug>/<hex> overrides it. An entry of SITE.tools
  // may carry `dark`/`light` hex values (no '#') for the theme where its brand
  // colour would disappear; the URLs are swapped when <html data-theme> changes.
  const ICON_CDN = 'https://cdn.simpleicons.org/';
  const ICON_PX = 28;                                // matches .tool-icon in css/style.css
  const ICON_HEX = /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
  let toolIcons = [];                                // every <img> across both tracks
  let cloneIcons = [];                               // the duplicate track's <img>s only

  function toolOverride(tool, key) {
    const raw = tool && typeof tool[key] === 'string' ? tool[key].trim().replace(/^#/, '') : '';
    return ICON_HEX.test(raw) ? raw : '';
  }

  function toolIconSrc(img, theme) {
    const color = img.getAttribute(theme === 'light' ? 'data-light' : 'data-dark');
    return ICON_CDN + img.getAttribute('data-slug') + (color ? '/' + color : '');
  }

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

      const icon = document.createElement('img');
      icon.className = 'tool-icon';
      icon.width = ICON_PX;       // width/height attributes: the row holds its size
      icon.height = ICON_PX;      // before the icons arrive, so nothing shifts
      icon.loading = 'lazy';
      icon.decoding = 'async';
      icon.alt = '';              // decorative in both tracks: .tool-name carries the name
      icon.setAttribute('data-slug', encodeURIComponent(slug));
      const dark = toolOverride(tool, 'dark');
      const light = toolOverride(tool, 'light');
      if (dark) icon.setAttribute('data-dark', dark);
      if (light) icon.setAttribute('data-light', light);
      // src is set by updateToolIcons() once the theme is known.

      const name = document.createElement('span');
      name.className = 'tool-name';
      name.textContent = tool.name;
      li.appendChild(icon);
      li.appendChild(name);
      track.appendChild(li);
    });
    return track;
  }

  function onToolIconError(event) {
    // No broken-image glyph. Both tracks hold the same URLs, so they hide alike
    // and the two tracks keep the same width.
    const img = event.currentTarget;
    if (img) img.hidden = true;
  }

  // The duplicate track starts past the marquee's right edge, where overflow
  // hides it, so its lazy images may never intersect anything and would stay
  // blank — a visible gap once the loop reaches them. As soon as the first
  // track has an icon, switch the copies to eager: identical URLs, so they come
  // straight from the cache without a second request.
  function wakeCloneIcons() {
    for (let i = 0; i < cloneIcons.length; i++) cloneIcons[i].loading = 'eager';
    cloneIcons = [];
  }

  function onToolIconLoad(event) {
    // A re-coloured icon can succeed after an earlier one failed.
    const img = event.currentTarget;
    if (img) img.hidden = false;
    if (cloneIcons.length) wakeCloneIcons();
  }

  function updateToolIcons() {
    const theme = currentTheme();
    for (let i = 0; i < toolIcons.length; i++) {
      const img = toolIcons[i];
      const src = toolIconSrc(img, theme);
      // Compare against the resolved URL so an unchanged icon is never re-requested.
      if (img.src === src) continue;
      img.src = src;
    }
  }

  function initToolMarquee() {
    const marquee = document.getElementById('toolMarquee');
    const s = site();
    if (!marquee || !s || !Array.isArray(s.tools) || !s.tools.length) return;
    const track = buildToolTrack(s.tools);
    if (!track.children.length) return;
    // Second copy makes the -100% loop seamless; hidden from assistive tech, so
    // the first track stays the only one that names a tool.
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marquee.textContent = '';
    marquee.appendChild(track);
    marquee.appendChild(clone);

    // Collected after the clone exists: cloneNode() copies attributes, not listeners.
    toolIcons = Array.prototype.slice.call(marquee.querySelectorAll('img.tool-icon'));
    cloneIcons = Array.prototype.slice.call(clone.querySelectorAll('img.tool-icon'));
    for (let i = 0; i < toolIcons.length; i++) {
      toolIcons[i].addEventListener('error', onToolIconError);
      toolIcons[i].addEventListener('load', onToolIconLoad);
    }
    updateToolIcons();
    // Re-colour on theme change (same idea as the activity chart).
    if (!window.MutationObserver) return;
    const observer = new MutationObserver(updateToolIcons);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
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

  // ---------- About ----------
  function siteArray(key) {
    const s = site();
    const value = s ? s[key] : null;
    return Array.isArray(value) ? value : null;
  }

  function initAbout() {
    const holder = document.getElementById('aboutText');
    const paragraphs = siteArray('about');
    if (!holder || !paragraphs) return;

    const fragment = document.createDocumentFragment();
    paragraphs.forEach(function (text) {
      if (typeof text !== 'string' || !text.trim()) return;
      const p = document.createElement('p');
      p.textContent = text.trim();
      fragment.appendChild(p);
    });
    if (!fragment.childNodes.length) return; // keep the static fallback
    holder.textContent = '';
    holder.appendChild(fragment);
  }

  // ---------- Tag lists ----------
  function buildTags(items) {
    const list = document.createElement('ul');
    list.className = 'tags';
    if (!Array.isArray(items)) return list;
    items.forEach(function (item) {
      if (typeof item !== 'string' || !item.trim()) return;
      const li = document.createElement('li');
      li.className = 'tag';
      li.textContent = item.trim();
      list.appendChild(li);
    });
    return list;
  }

  // ---------- Projects ----------
  function buildProjectCard(project) {
    if (!project || typeof project !== 'object') return null;
    const name = typeof project.name === 'string' ? project.name.trim() : '';
    const url = typeof project.url === 'string' ? project.url.trim() : '';
    if (!name) return null;
    // A project with no (public) link renders as a plain card instead of a link.
    const linked = /^https?:\/\//i.test(url);

    const card = document.createElement(linked ? 'a' : 'div');
    card.className = linked ? 'project-card' : 'project-card is-static';
    if (linked) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener';
    }

    const heading = document.createElement('h4');
    heading.className = 'project-name';
    heading.appendChild(document.createTextNode(name + (linked ? ' ' : '')));
    if (linked) heading.appendChild(linkArrow());
    card.appendChild(heading);

    if (typeof project.blurb === 'string' && project.blurb.trim()) {
      const blurb = document.createElement('p');
      blurb.className = 'project-blurb';
      blurb.textContent = project.blurb.trim();
      card.appendChild(blurb);
    }

    const tags = buildTags(project.tags);
    if (tags.children.length) card.appendChild(tags);
    return card;
  }

  function initProjects() {
    const grid = document.getElementById('projectsGrid');
    const projects = siteArray('projects');
    if (!grid || !projects) return;

    const fragment = document.createDocumentFragment();
    projects.forEach(function (project) {
      const card = buildProjectCard(project);
      if (card) fragment.appendChild(card);
    });
    if (!fragment.childNodes.length) return; // keep the static fallback card
    grid.textContent = '';
    grid.appendChild(fragment);
  }

  // ---------- Skills ----------
  function buildSkillCard(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const group = typeof entry.group === 'string' ? entry.group.trim() : '';
    if (!group) return null;
    const tags = buildTags(entry.items);
    if (!tags.children.length) return null;

    const card = document.createElement('div');
    card.className = 'skill-card';
    const heading = document.createElement('h4');
    heading.className = 'skill-group';
    heading.textContent = group;
    card.appendChild(heading);
    card.appendChild(tags);
    return card;
  }

  function initSkills() {
    const grid = document.getElementById('skillsGrid');
    const skills = siteArray('skills');
    if (!grid || !skills) return;

    const fragment = document.createDocumentFragment();
    skills.forEach(function (entry) {
      const card = buildSkillCard(entry);
      if (card) fragment.appendChild(card);
    });
    if (!fragment.childNodes.length) return; // keep the static fallback card
    grid.textContent = '';
    grid.appendChild(fragment);
  }

  // ---------- Timeline (experience + education) ----------
  // Both sections render the same way; only the heading field differs
  // (role for experience, degree for education).
  function timelineDates(entry) {
    const start = typeof entry.start === 'string' ? entry.start.trim() : '';
    const end = typeof entry.end === 'string' ? entry.end.trim() : '';
    if (start && end) return start + ' — ' + end;
    return start || end;
  }

  function buildTimelineItem(entry, titleKey) {
    if (!entry || typeof entry !== 'object') return null;
    const title = typeof entry[titleKey] === 'string' ? entry[titleKey].trim() : '';
    if (!title) return null; // no role/degree: nothing to head the entry with
    const org = typeof entry.org === 'string' ? entry.org.trim() : '';
    const place = typeof entry.place === 'string' ? entry.place.trim() : '';

    const item = document.createElement('li');
    item.className = 'timeline-item';

    // The rail and the dot are drawn in CSS, so nothing decorative lands here.
    const heading = document.createElement('h4');
    heading.className = 'timeline-role';
    heading.textContent = org ? title + ' · ' + org : title;
    item.appendChild(heading);

    const parts = [timelineDates(entry), place].filter(Boolean);
    if (parts.length) {
      const meta = document.createElement('p');
      meta.className = 'timeline-meta';
      meta.textContent = parts.join(' · ');
      item.appendChild(meta);
    }

    if (typeof entry.blurb === 'string' && entry.blurb.trim()) {
      const blurb = document.createElement('p');
      blurb.className = 'timeline-blurb';
      blurb.textContent = entry.blurb.trim();
      item.appendChild(blurb);
    }

    const tags = buildTags(entry.tags);
    if (tags.children.length) item.appendChild(tags);
    return item;
  }

  function fillTimeline(listId, key, titleKey) {
    const list = document.getElementById(listId);
    const entries = siteArray(key);
    if (!list || !entries) return;

    const fragment = document.createDocumentFragment();
    entries.forEach(function (entry) {
      const item = buildTimelineItem(entry, titleKey);
      if (item) fragment.appendChild(item);
    });
    if (!fragment.childNodes.length) return; // keep the static fallback entry
    list.textContent = '';
    list.appendChild(fragment);
  }

  function initExperience() {
    fillTimeline('experienceList', 'experience', 'role');
  }

  function initEducation() {
    fillTimeline('educationList', 'education', 'degree');
  }

  // ---------- Activity (GitHub contribution chart) ----------
  const CHART_BASE = 'https://ghchart.rshah.org/';
  let activityChart = null;
  let activityUser = '';
  let activityGridReady = false;   // once the grid is drawn, the image stays gone

  function accentHex() {
    const raw = getComputedStyle(root).getPropertyValue('--accent').trim();
    const match = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(raw);
    if (!match) return null;
    let hex = match[1].toLowerCase();
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return hex;
  }

  function activitySrc() {
    const hex = accentHex();
    return CHART_BASE + (hex ? hex + '/' : '') + encodeURIComponent(activityUser);
  }

  function updateActivityChart() {
    if (!activityChart || activityGridReady) return;
    const src = activitySrc();
    // Compare against the resolved URL so we never re-request the same chart.
    if (activityChart.src === src) return;
    activityChart.src = src;
  }

  function activityFallback() {
    return document.querySelector('.activity-card .activity-fallback');
  }

  function onActivityChartError() {
    if (activityChart) activityChart.hidden = true;
    const fallback = activityFallback();
    if (fallback && !activityGridReady) fallback.hidden = false;
  }

  function onActivityChartLoad() {
    // A re-coloured image must not reappear on top of the grid that replaced it.
    if (activityGridReady) {
      if (activityChart) activityChart.hidden = true;
      return;
    }
    // A later (re-coloured) chart can succeed after an earlier one failed.
    if (activityChart) activityChart.hidden = false;
    const fallback = activityFallback();
    if (fallback) fallback.hidden = true;
  }

  // The hosted chart image bakes in its own colours (a pale orange for the
  // lightest level, #EEEEEE for empty days) which read badly on both themes.
  // So fetch the raw per-day counts and draw the grid ourselves, in tokens.
  const ACTIVITY_API = 'https://github-contributions-api.jogruber.de/v4/';
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function buildActivityGrid(days, user) {
    const grid = document.createElement('div');
    grid.className = 'activity-grid';
    grid.setAttribute('role', 'img');

    // Pad the first column so each row is one weekday, as GitHub draws it.
    const first = new Date(days[0].date + 'T00:00:00');
    for (let i = 0; i < first.getDay(); i++) {
      const pad = document.createElement('span');
      pad.className = 'activity-day is-pad';
      grid.appendChild(pad);
    }

    let total = 0;
    days.forEach(function (day) {
      const count = Number(day.count) || 0;
      total += count;
      const cell = document.createElement('span');
      cell.className = 'activity-day';
      cell.dataset.level = String(Math.max(0, Math.min(4, Number(day.level) || 0)));
      const when = new Date(day.date + 'T00:00:00');
      cell.title = count + (count === 1 ? ' contribution on ' : ' contributions on ') +
        DAY_NAMES[when.getDay()] + ', ' + day.date;
      grid.appendChild(cell);
    });

    grid.setAttribute('aria-label',
      total + ' contributions by ' + user + ' in the last year, one square per day');
    return grid;
  }

  // Month labels above the grid: one label per month, spanning that month's
  // columns, skipped where a month has too few weeks on screen to fit a label.
  function buildActivityMonths(days, leadingPad) {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const row = document.createElement('div');
    row.className = 'activity-months';
    row.setAttribute('aria-hidden', 'true');

    const spans = [];
    days.forEach(function (day, i) {
      const column = Math.floor((i + leadingPad) / 7) + 1;
      const month = Number(day.date.slice(5, 7)) - 1;
      const last = spans[spans.length - 1];
      if (!last || last.month !== month) spans.push({ month: month, start: column, end: column });
      else last.end = column;
    });

    // A week column can hold the end of one month and the start of the next,
    // so trim each span to start after the previous one: overlapping spans get
    // pushed onto a second row by grid auto-placement.
    let placed = 0;
    spans.forEach(function (span) {
      const start = Math.max(span.start, placed + 1);
      const width = span.end - start + 1;
      if (width < 1) return;
      placed = span.end;
      const cell = document.createElement('span');
      cell.style.gridColumn = start + ' / span ' + width;
      if (width >= 3) cell.textContent = MONTHS[span.month];
      row.appendChild(cell);
    });
    return row;
  }

  function buildActivityLegend() {
    const legend = document.createElement('div');
    legend.className = 'activity-legend';
    legend.setAttribute('aria-hidden', 'true');
    legend.appendChild(document.createTextNode('Less'));
    for (let level = 0; level <= 4; level++) {
      const cell = document.createElement('span');
      cell.className = 'activity-day';
      cell.dataset.level = String(level);
      legend.appendChild(cell);
    }
    legend.appendChild(document.createTextNode('More'));
    return legend;
  }

  function initActivity() {
    const img = document.getElementById('activityChart');
    const user = siteString('github');
    if (!img || !user || !/^[A-Za-z0-9-]+$/.test(user.trim())) return;
    activityChart = img;
    activityUser = user.trim();
    img.addEventListener('error', onActivityChartError);
    img.addEventListener('load', onActivityChartLoad);
    updateActivityChart();
    // Re-colour the hosted fallback when the theme changes; the grid below
    // takes over if it loads, and then this observer has nothing left to do.
    let chartObserver = null;
    if (window.MutationObserver) {
      chartObserver = new MutationObserver(updateActivityChart);
      chartObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }

    if (!window.fetch) return;
    fetch(ACTIVITY_API + encodeURIComponent(activityUser) + '?y=last')
      .then(function (res) {
        if (!res.ok) throw new Error('contributions API ' + res.status);
        return res.json();
      })
      .then(function (data) {
        const days = data && Array.isArray(data.contributions) ? data.contributions : [];
        if (!days.length) return;
        const card = img.parentNode;
        if (!card) return;
        const leadingPad = new Date(days[0].date + 'T00:00:00').getDay();
        const grid = buildActivityGrid(days, activityUser);
        card.insertBefore(buildActivityMonths(days, leadingPad), img);
        card.insertBefore(grid, img);
        card.insertBefore(buildActivityLegend(), img.nextSibling);
        activityGridReady = true;
        img.hidden = true;   // the hosted image was only ever the fallback
        if (chartObserver) chartObserver.disconnect();
        const fallback = activityFallback();
        if (fallback) fallback.hidden = true;
      })
      .catch(function (err) {
        // The hosted chart image stays on screen; nothing to undo.
        if (window.console && console.warn) console.warn('Contribution grid unavailable:', err);
      });
  }

  // ---------- Contact ----------
  function initContact() {
    const primary = document.getElementById('contactPrimary');
    const s = site();
    const links = s && s.links && typeof s.links === 'object' ? s.links : null;

    if (primary && links) {
      const email = typeof links.email === 'string' ? links.email.trim() : '';
      const github = typeof links.github === 'string' ? links.github.trim() : '';
      let label = null;
      if (email) {
        primary.href = connectHref('email', email);
        primary.removeAttribute('target');
        primary.removeAttribute('rel');
        label = 'Say hello';
      } else if (github) {
        primary.href = github;
        primary.target = '_blank';
        primary.rel = 'noopener';
        label = 'Find me on GitHub';
      }
      if (label) {
        primary.textContent = '';
        primary.appendChild(document.createTextNode(label + ' '));
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        primary.appendChild(arrow);
      }
    }

    fillLinkList(document.getElementById('contactLinks'), true);
    fillLinkList(document.getElementById('footerLinks'), false);
  }

  // ---------- Scroll reveal ----------
  // The .reveal start state only exists under :root.js (set by the inline head
  // script when IntersectionObserver exists), so anything that stops this from
  // running leaves the page fully visible rather than blank.
  const REVEAL_MARGIN = '0px 0px -8% 0px';
  const REVEAL_FAILSAFE_MS = 10000;

  function revealAll(nodes) {
    for (let i = 0; i < nodes.length; i++) nodes[i].classList.add('is-visible');
  }

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;
    // No observer, or motion is unwelcome: show everything at once.
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      revealAll(nodes);
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      for (let i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('is-visible');
        observer.unobserve(entries[i].target); // once each
      }
    }, { rootMargin: REVEAL_MARGIN });
    // Sections already on screen intersect on the first callback, so they
    // reveal straight away instead of waiting for a scroll.
    for (let i = 0; i < nodes.length; i++) observer.observe(nodes[i]);

    // A tab that loads in the background runs no intersection callbacks, so
    // nothing would ever reveal there. Arm a failsafe that gives up on the
    // animation and shows everything; cancel it as soon as the tab is looked
    // at, since the observer works from then on.
    if (!document.hidden) return;
    const failsafe = window.setTimeout(function () {
      revealAll(nodes);
      observer.disconnect();
    }, REVEAL_FAILSAFE_MS);
    document.addEventListener('visibilitychange', function onShow() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onShow);
      window.clearTimeout(failsafe);
    });
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
    // initReveal runs first: the page must become visible even if a later step throws.
    [initReveal, initSiteText, initClock, initConnectLinks, initToolMarquee, initGlobe,
      initAbout, initProjects, initSkills, initExperience, initEducation,
      initActivity, initContact].forEach(function (step) {
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
