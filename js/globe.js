/* globe.js: interactive dot globe centered on SITE.location, built on cobe,
   with a 2D overlay web linking home to SITE.anchors.
   ES module, loaded lazily by main.js. mountGlobe() throws if WebGL is
   unavailable (and the import itself rejects if the CDN fails), so the
   caller can show .globe-fallback instead. */
import createGlobe from 'https://cdn.jsdelivr.net/npm/cobe@0.6.5/+esm';

// ---------- Tunables ----------
const MAX_DPR = 2;
const SPIN_SPEED = (2 * Math.PI) / 90;   // rad/s: one full turn every 90 s
const DRAG_SPEED = Math.PI;    // rad of phi (or theta) per canvas-width (or height) dragged
const MAX_TILT = 1.35;         // rad: how far the view can tilt toward either pole (~77°)
const HOVER_RADIUS = 12;       // CSS px around a node that shows its name
const ZOOM_IN = 3;             // scale after a double-click/double-tap zooms in
const VIEW_EASE = 6;           // 1/s, how fast zoom and re-centering animate
const DOUBLE_TAP_MS = 320;     // max gap between the two clicks/taps of a double
const DOUBLE_TAP_PX = 24;      // max distance between them (CSS px)
const GLOBE_R = 0.8;           // cobe draws the sphere at 0.8 of the canvas half-width
const ARC_SAMPLES = 48;        // points per web line
const SPOKE_LIFT = [0.04, 0.2];   // arc height above the surface: [min, extra at 180°]
const THREAD_LIFT = [0.02, 0.1];
const PULSE_PERIOD = 2800;     // ms for a light pulse to run from home to an anchor

// ---------- Centering math ----------
// Derived from cobe 0.6.5: markers sit at [-cos(lat)cos(lon-PI), sin(lat), cos(lat)sin(lon-PI)]
// and the shader samples the disc center at l * J(theta, phi) = [-sin(phi)cos(theta), sin(theta),
// cos(phi)cos(theta)]. Equating them gives theta = lat, phi = 3PI/2 - lon. Increasing phi moves
// the surface to the right on screen (verified), so a rightward drag adds to phi.
function centerOn([lat, lon]) {
  return { phi: 1.5 * Math.PI - (lon * Math.PI) / 180, theta: (lat * Math.PI) / 180 };
}

const clampTilt = (t) => Math.max(-MAX_TILT, Math.min(MAX_TILT, t));

// Unit vector of a location, in cobe's marker convention (above).
function toVec([lat, lon]) {
  const a = (lat * Math.PI) / 180;
  const o = (lon * Math.PI) / 180 - Math.PI;
  return [-Math.cos(a) * Math.cos(o), Math.sin(a), Math.cos(a) * Math.sin(o)];
}

// Rotate a globe vector into screen space for the current phi/theta:
// x right, y up, z toward the viewer. At rest, home maps to [0, 0, 1].
function toScreen([x, y, z], phi, theta) {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const cp = Math.cos(phi), sp = Math.sin(phi);
  return [
    cp * x + sp * z,
    sp * st * x + ct * y - cp * st * z,
    -sp * ct * x + st * y + cp * ct * z,
  ];
}

// Inverse of toScreen (the rotation is orthonormal, so its transpose).
function fromScreen([x, y, z], phi, theta) {
  const ct = Math.cos(theta), st = Math.sin(theta);
  const cp = Math.cos(phi), sp = Math.sin(phi);
  return [
    cp * x + sp * st * y - sp * ct * z,
    ct * y + st * z,
    sp * x - cp * st * y + cp * ct * z,
  ];
}

// Globe vector back to [lat, lon] in degrees (inverse of toVec).
function toLatLon([x, y, z]) {
  const lat = Math.asin(Math.max(-1, Math.min(1, y)));
  const lon = Math.atan2(z, -x) + Math.PI;
  return [(lat * 180) / Math.PI, ((lon * 180) / Math.PI + 540) % 360 - 180];
}

// Wrap an angle into [-PI, PI] so the spin angle never grows without bound.
function wrapAngle(a) {
  return a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
}

// ---------- Theme colors ----------
// Tokens are normalised through a 2D context so any CSS color syntax works.
const probe = document.createElement('canvas').getContext('2d');

function toRGB(value, fallback) {
  if (!probe || !value) return fallback;
  probe.fillStyle = '#000';
  probe.fillStyle = value.trim();
  const s = probe.fillStyle;   // "#rrggbb" or "rgba(r, g, b, a)"
  if (s[0] === '#') return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  const m = s.match(/[\d.]+/g);
  return m ? m.slice(0, 3).map((n) => Number(n) / 255) : fallback;
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function readTheme() {
  const css = getComputedStyle(document.documentElement);
  const token = (name) => css.getPropertyValue(name);
  const bg = toRGB(token('--bg'), [0.18, 0.2, 0.25]);
  const surface = toRGB(token('--surface'), bg);
  const accent = toRGB(token('--accent'), [0.53, 0.75, 0.82]);
  const dark = luminance(bg) < 0.5;
  // Optional --globe-base token overrides the sphere/dot color per theme.
  const base = toRGB(token('--globe-base'), dark ? toRGB(token('--nord3'), [0.3, 0.34, 0.42]) : bg);
  return {
    dark: dark ? 1 : 0,
    baseColor: base,
    markerColor: accent,
    glowColor: mix(surface, accent, dark ? 0.35 : 0.25),
    mapBrightness: dark ? 6 : 1.6,
  };
}

// Web colors are CSS strings for the 2D overlay (tokens in the theme file).
function readWebColors() {
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  return {
    line: token('--accent', '#88C0D0'),
    node: token('--accent', '#88C0D0'),
    hub: token('--globe-hub', '#BF616A'),
    goldFrom: token('--globe-gold-from', '#C9962B'),
    goldTo: token('--globe-gold-to', '#EBCB8B'),
    outline: token('--bg', '#2E3440'),
  };
}

// ---------- Web geometry ----------
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Initial compass bearing from a to b, used to order anchors around home.
function bearing([lat1, lon1], [lat2, lon2]) {
  const p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  return Math.atan2(Math.sin(dl) * Math.cos(p2),
    Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl));
}

// Great-circle arc from a to b, lifted off the surface in the middle.
function arcPoints(a, b, [minLift, extraLift]) {
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  const lift = minLift + extraLift * (angle / Math.PI);
  const s = Math.sin(angle) || 1;
  const pts = [];
  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const t = i / ARC_SAMPLES;
    const wa = angle < 1e-6 ? 1 - t : Math.sin((1 - t) * angle) / s;
    const wb = angle < 1e-6 ? t : Math.sin(t * angle) / s;
    const h = 1 + lift * Math.sin(Math.PI * t);
    pts.push([(a[0] * wa + b[0] * wb) * h, (a[1] * wa + b[1] * wb) * h, (a[2] * wa + b[2] * wb) * h]);
  }
  return pts;
}

// Spokes run from home to every anchor. Threads link anchors that are neighbors
// by direction from home, closing the ring, so together they read as a web.
function buildWeb(location, anchors, homeName) {
  const home = toVec(location);
  const nodes = anchors
    .filter((a) => a && Array.isArray(a.location) && a.location.length === 2)
    .map((a) => ({
      vec: toVec(a.location),
      name: a.name || '',
      gold: a.style === 'gold',
      // Optional size multiplier; gold nodes default slightly larger.
      size: a.size > 0 ? a.size : (a.style === 'gold' ? 1.4 : 1),   // ring needs a little more room
      angle: bearing(location, a.location),
    }))
    .sort((a, b) => a.angle - b.angle);
  const spokes = nodes.map((n) => arcPoints(home, n.vec, SPOKE_LIFT));
  const threads = nodes.length < 3 ? [] : nodes.map((n, i) => arcPoints(n.vec, nodes[(i + 1) % nodes.length].vec, THREAD_LIFT));
  return { home, homeName: homeName || '', nodes, spokes, threads };
}

// ---------- Web drawing ----------
// A lifted point is hidden only when it is behind the globe AND inside its disc.
const hidden = ([x, y, z]) => z < 0 && x * x + y * y < 1;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function drawWeb(ctx, web, colors, phi, theta, zoom, now, reducedMotion) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const cx = w / 2, cy = h / 2, r = (Math.min(w, h) / 2) * GLOBE_R * zoom;
  const px = (p) => [cx + p[0] * r, cy - p[1] * r];
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';

  // Lines: split into visible runs; farther runs fade out.
  function strokeArc(points, width, alpha) {
    ctx.lineWidth = width;
    ctx.strokeStyle = colors.line;
    let prev = null;
    for (const v of points) {
      const p = toScreen(v, phi, theta);
      if (hidden(p)) { prev = null; continue; }
      if (prev) {
        ctx.globalAlpha = alpha * (0.3 + 0.7 * clamp01((prev[2] + p[2] + 0.6) / 1.6));
        const [x1, y1] = px(prev), [x2, y2] = px(p);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      prev = p;
    }
  }
  const unit = w / 400;
  web.threads.forEach((pts) => strokeArc(pts, Math.max(0.75, unit * 0.9), 0.35));
  web.spokes.forEach((pts) => strokeArc(pts, Math.max(1, unit * 1.3), 0.8));

  // Pulses: a bright dot runs out along each spoke.
  if (!reducedMotion) {
    ctx.fillStyle = colors.line;
    web.spokes.forEach((pts, i) => {
      const t = ((now / PULSE_PERIOD) + i / web.spokes.length) % 1;
      const p = toScreen(pts[Math.round(t * ARC_SAMPLES)], phi, theta);
      if (hidden(p)) return;
      const [x, y] = px(p);
      ctx.globalAlpha = 0.9 * Math.sin(Math.PI * t);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, unit * 2.2), 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // Nodes: on the surface, so they fade out as they reach the rim.
  // Each drawn node is recorded (canvas px) for hover hit-testing.
  const hits = [];
  // ring: draw the node as an open circle instead of a filled dot, so it is
  // told apart by shape as well as colour (red, gold and the accent orange
  // converge under red-green colour blindness).
  function node(vec, radius, fill, name, ring) {
    const p = toScreen(vec, phi, theta);
    const a = clamp01(p[2] / 0.12);
    if (a <= 0) return null;
    const [x, y] = px(p);
    if (name && a > 0.3) hits.push({ x, y, r: radius, name });
    ctx.globalAlpha = a;
    const paint = typeof fill === 'function' ? fill(x, y) : fill;
    if (ring) {
      // Hollow centre, then the coloured band, then a thin outline each side.
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.45, 0, 2 * Math.PI);
      ctx.fillStyle = colors.outline;
      ctx.fill();
      ctx.lineWidth = radius * 0.55;
      ctx.strokeStyle = paint;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.72, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.lineWidth = Math.max(1, unit * 0.8);
      ctx.strokeStyle = colors.outline;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      return [x, y, a];
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = paint;
    ctx.fill();
    ctx.lineWidth = Math.max(1, unit);
    ctx.strokeStyle = colors.outline;
    ctx.stroke();
    return [x, y, a];
  }
  const nodeR = Math.max(3, unit * 4);
  web.nodes.forEach((n) => {
    const radius = nodeR * n.size;
    const fill = n.gold
      ? (x, y) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, colors.goldFrom);
        g.addColorStop(1, colors.goldTo);
        return g;
      }
      : colors.node;
    node(n.vec, radius, fill, n.name, n.gold);
  });

  // Home: red, with a halo that pulses (static under reduced motion).
  const homeR = nodeR * 1.5;
  const at = node(web.home, homeR, colors.hub, web.homeName);
  if (at) {
    const t = reducedMotion ? 0.5 : (now % 2000) / 2000;
    ctx.globalAlpha = at[2] * (1 - t) * 0.8;
    ctx.lineWidth = Math.max(1, unit * 1.2);
    ctx.strokeStyle = colors.hub;
    ctx.beginPath();
    ctx.arc(at[0], at[1], homeR * (1.3 + 1.4 * t), 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return hits;
}

// ---------- Mount ----------
export function mountGlobe(wrap, {
  location = [48.2082, 16.3738], homeName = '', anchors = [], reducedMotion = false,
} = {}) {
  const canvas = wrap && (wrap.querySelector('#globe') || wrap.querySelector('canvas'));
  if (!canvas) throw new Error('globe: no canvas inside wrap');
  const webCanvas = wrap.querySelector('.globe-web');
  const webCtx = webCanvas && webCanvas.getContext('2d');
  const web = buildWeb(location, anchors, homeName);
  let webColors = readWebColors();
  const sizeWeb = () => {
    if (!webCanvas) return;
    webCanvas.width = Math.max(1, Math.round(webCanvas.clientWidth * dpr()));
    webCanvas.height = Math.max(1, Math.round(webCanvas.clientHeight * dpr()));
  };

  const home = centerOn(location);
  const dpr = () => Math.min(window.devicePixelRatio || 1, MAX_DPR);
  let theme = readTheme();
  let themeDirty = false;
  let spin = 0;            // phi turned away from home, by the slow spin and by drags
  let theta = home.theta;  // view tilt; vertical drags change it
  let zoom = 1;            // current scale (animated)
  let zoomTarget = 1;      // 1 or ZOOM_IN; toggled by double-click/double-tap
  let aim = null;          // { spin, theta } the view is easing toward after a zoom-in
  let lastTap = null;      // { time, x, y } of the previous tap, for double-tap
  let dragging = null;     // { x, id } while a pointer is down
  let pointer = null;      // last pointer position over the wrap (CSS px), for hover
  let hits = [];           // nodes drawn in the last frame (canvas px)
  let hovered = null;      // hit whose name is showing
  let frames = 0;
  let last = performance.now();
  const start = last;

  // ---------- Hover label ----------
  const tip = document.createElement('div');
  tip.className = 'globe-tip';
  tip.setAttribute('aria-hidden', 'true');   // names are in the canvas aria-label
  tip.hidden = true;
  wrap.appendChild(tip);

  function updateHover() {
    let best = null;
    if (pointer && !dragging && webCanvas && webCanvas.clientWidth) {
      const scale = webCanvas.width / webCanvas.clientWidth;   // canvas px per CSS px
      const x = pointer.x * scale, y = pointer.y * scale;
      let bestD = Infinity;
      for (const h of hits) {
        const d = Math.hypot(h.x - x, h.y - y);
        if (d < Math.max(h.r * 1.5, HOVER_RADIUS * scale) && d < bestD) { best = h; bestD = d; }
      }
      if (best) {
        // Keep the label inside the wrap: it is centered on the node, so a node
        // near either rim would otherwise push it past the card edge.
        const half = tip.offsetWidth / 2;
        const limit = wrap.clientWidth;
        tip.style.left = Math.min(Math.max(best.x / scale, half), Math.max(half, limit - half)) + 'px';
        tip.style.top = (best.y - best.r) / scale + 'px';
        // Nodes that overlap the hovered one (e.g. neighboring towns) share the label.
        const names = hits
          .filter((h) => Math.hypot(h.x - best.x, h.y - best.y) < best.r)
          .map((h) => h.name);
        best = { name: [...new Set(names)].join('\n') };
      }
    }
    if (!best || !hovered || best.name !== hovered.name) tip.textContent = best ? best.name : '';
    hovered = best;
    tip.hidden = !best;
    wrap.classList.toggle('is-over-node', !!best);
  }

  // ---------- Globe ----------
  let globe;
  try {
    globe = createGlobe(canvas, {
      devicePixelRatio: dpr(),
      width: Math.max(1, canvas.clientWidth * dpr()),
      height: Math.max(1, canvas.clientHeight * dpr()),
      phi: home.phi,
      theta: home.theta,
      diffuse: 1.2,
      scale: 1,
      mapSamples: 16000,
      markers: [],   // nodes are drawn on the overlay so each can have its own color
      ...theme,
      onRender(state) {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        // ---------- Motion ----------
        // Zoom and re-centering ease toward their targets (instant under reduced motion).
        const ease = reducedMotion ? 1 : 1 - Math.exp(-VIEW_EASE * dt);
        zoom += (zoomTarget - zoom) * ease;
        if (Math.abs(zoomTarget - zoom) < 1e-3) zoom = zoomTarget;
        if (aim && !dragging) {
          const ds = wrapAngle(aim.spin - spin);
          spin = wrapAngle(spin + ds * ease);
          theta += (aim.theta - theta) * ease;
          if (Math.abs(ds) < 1e-3 && Math.abs(aim.theta - theta) < 1e-3) aim = null;
        }
        // Slow spin, paused while zoomed in, dragging, or while a node's name is showing.
        if (!reducedMotion && zoomTarget === 1 && !aim && !dragging && !hovered) {
          spin = wrapAngle(spin + SPIN_SPEED * dt);
        }
        state.phi = home.phi + spin;
        state.theta = theta;
        state.scale = zoom;

        // ---------- Web overlay ----------
        if (webCtx) {
          hits = drawWeb(webCtx, web, webColors, state.phi, state.theta, zoom, now - start, reducedMotion);
          updateHover();
        }

        // ---------- Size + theme ----------
        state.width = canvas.width;
        state.height = canvas.height;
        if (themeDirty) {
          Object.assign(state, theme);
          themeDirty = false;
        }

        // Second callback: the first frame (with the map texture) is on screen.
        if (++frames === 2) wrap.classList.add('is-ready');
      },
    });
  } catch (err) {
    throw new Error('globe: WebGL unavailable (' + (err && err.message) + ')');
  }
  if (!globe || !globe.gl) throw new Error('globe: WebGL unavailable');

  // ---------- Resize ----------
  const resizeObserver = new ResizeObserver(() => {
    if (!canvas.clientWidth) return;
    globe.devicePixelRatio = dpr();
    globe.resize();   // phenomenon: sets canvas.width/height from clientWidth * dpr + viewport
    sizeWeb();
  });
  sizeWeb();
  resizeObserver.observe(wrap);

  // ---------- Pause offscreen / hidden ----------
  let onScreen = true;
  const updateRunning = () => globe.toggle(onScreen && !document.hidden);
  const intersection = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    last = performance.now();
    updateRunning();
  });
  intersection.observe(wrap);
  const onVisibility = () => { last = performance.now(); updateRunning(); };
  document.addEventListener('visibilitychange', onVisibility);

  // ---------- Theme changes ----------
  const refreshTheme = () => { theme = readTheme(); webColors = readWebColors(); themeDirty = true; };
  const themeObserver = new MutationObserver(refreshTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const schemeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  if (schemeQuery && schemeQuery.addEventListener) schemeQuery.addEventListener('change', refreshTheme);

  // ---------- Reduced motion ----------
  // Followed live, so switching the OS setting on stops the spin, the spoke
  // pulses and the home halo without a reload (and switching it off resumes).
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const onMotionChange = () => { reducedMotion = !!(motionQuery && motionQuery.matches); };
  if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);

  // ---------- Drag + hover ----------
  // A tap (touch) on a node shows its name. Dragging sideways spins the globe;
  // dragging up/down tilts the view toward a pole. A double-click (or double-tap)
  // zooms in on that spot; another one zooms back out.
  // Hover labels follow the pointer position and are re-checked every frame.
  function trackPointer(e) {
    const rect = wrap.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!dragging) updateHover();
  }
  function onDown(e) {
    trackPointer(e);
    if (dragging || (e.pointerType === 'mouse' && e.button !== 0)) return;
    dragging = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
  }
  function onMove(e) {
    if (dragging && e.pointerId === dragging.id) {
      const dx = e.clientX - dragging.x;
      const dy = e.clientY - dragging.y;
      if (!dragging.moved && Math.hypot(dx, dy) < 3) return;   // small jitter is still a tap
      if (!dragging.moved) {
        dragging.moved = true;
        wrap.classList.add('is-dragging');
        updateHover();   // hides the label while dragging
      }
      aim = null;   // a drag takes over from any zoom re-centering
      // Zoomed in, the same drag covers less of the globe so it tracks the finger.
      spin = wrapAngle(spin + (dx / (canvas.clientWidth || 1)) * (DRAG_SPEED / zoom));
      // Dragging down pulls the surface down, bringing northern latitudes to the center.
      theta = clampTilt(theta + (dy / (canvas.clientHeight || 1)) * (DRAG_SPEED / zoom));
      dragging.x = e.clientX;
      dragging.y = e.clientY;
      return;
    }
    trackPointer(e);
  }
  function onUp(e) {
    if (!dragging || e.pointerId !== dragging.id) return;
    const wasTap = !dragging.moved && e.type === 'pointerup';
    dragging = null;
    wrap.classList.remove('is-dragging');
    trackPointer(e);
    if (wasTap) onTap(e);
  }
  function onLeave(e) {
    if (e.pointerType !== 'mouse') return;   // touch keeps the tapped label until the next tap
    pointer = null;
    updateHover();
  }

  // ---------- Zoom ----------
  // Double-click/double-tap is detected here (not with 'dblclick') so mouse and
  // touch behave the same.
  function onTap(e) {
    const now = performance.now();
    if (lastTap && now - lastTap.time < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < DOUBLE_TAP_PX) {
      lastTap = null;
      toggleZoom(e.clientX, e.clientY);
      return;
    }
    lastTap = { time: now, x: e.clientX, y: e.clientY };
  }
  function toggleZoom(clientX, clientY) {
    if (zoomTarget !== 1) {
      zoomTarget = 1;
      aim = null;
      return;
    }
    zoomTarget = ZOOM_IN;
    // Re-center on the point under the pointer (if it is on the globe).
    const rect = wrap.getBoundingClientRect();
    const r = (Math.min(rect.width, rect.height) / 2) * GLOBE_R * zoom;
    const x = (clientX - rect.left - rect.width / 2) / r;
    const y = -(clientY - rect.top - rect.height / 2) / r;
    if (x * x + y * y >= 1) return;
    const [lat, lon] = toLatLon(fromScreen([x, y, Math.sqrt(1 - x * x - y * y)], home.phi + spin, theta));
    const target = centerOn([lat, lon]);
    aim = { spin: wrapAngle(target.phi - home.phi), theta: clampTilt(target.theta) };
  }
  wrap.addEventListener('pointerdown', onDown);
  wrap.addEventListener('pointermove', onMove);
  wrap.addEventListener('pointerup', onUp);
  wrap.addEventListener('pointercancel', onUp);
  wrap.addEventListener('lostpointercapture', onUp);
  wrap.addEventListener('pointerleave', onLeave);

  // ---------- Teardown ----------
  let destroyed = false;
  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (schemeQuery && schemeQuery.removeEventListener) schemeQuery.removeEventListener('change', refreshTheme);
      if (motionQuery && motionQuery.removeEventListener) motionQuery.removeEventListener('change', onMotionChange);
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
      wrap.removeEventListener('lostpointercapture', onUp);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.classList.remove('is-ready', 'is-dragging', 'is-over-node');
      tip.remove();
      if (webCtx) webCtx.clearRect(0, 0, webCanvas.width, webCanvas.height);
      const gl = globe.gl;
      globe.destroy();   // stops the rAF loop, frees program + buffers
      const lose = gl && gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    },
  };
}
