// QA-Treiber fuer den iOS-Simulator (nur im Workflow ios-sim-qa.yml eingehaengt, nie im Store-Build).
// Spielt den Weg eines NEUEN Users im echten WKWebView (capacitor://localhost → https://flunkr.abooz.ch) durch
// und protokolliert alles mit Praefix «QA|» auf die Konsole (Capacitor reicht console.* an stdout weiter).
(function () {
  if (window.__flunkrQa) return; window.__flunkrQa = true;
  var t0 = Date.now();
  function log() { var a = Array.prototype.slice.call(arguments).map(function (x) { return typeof x === 'string' ? x : JSON.stringify(x); }); console.log('QA|' + ((Date.now() - t0) / 1000).toFixed(1) + 's| ' + a.join(' ')); }
  window.addEventListener('error', function (e) { log('ERROR', e.message, e.filename + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { log('REJECTION', String(e.reason && (e.reason.stack || e.reason.message) || e.reason).slice(0, 400)); });
  var ce = console.error; console.error = function () { try { log('console.error', Array.prototype.slice.call(arguments).map(String).join(' ').slice(0, 400)); } catch (_) {} return ce.apply(console, arguments); };
  var cw = console.warn; console.warn = function () { try { log('console.warn', Array.prototype.slice.call(arguments).map(String).join(' ').slice(0, 300)); } catch (_) {} return cw.apply(console, arguments); };
  window.confirm = function (m) { log('confirm()', m); return true; };
  window.alert = function (m) { log('alert()', m); };
  // Netzwerk mitschreiben
  var of = window.fetch; window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url; var m = (init && init.method) || 'GET'; var s = Date.now();
    return of.apply(this, arguments).then(function (r) { if (/abooz/.test(url)) log('fetch', m, url.replace(/^https:\/\/[^/]+/, ''), r.status, (Date.now() - s) + 'ms'); return r; },
      function (e) { log('fetch FAILED', m, url, String(e)); throw e; });
  };
  var OWS = window.WebSocket; window.WebSocket = function (u, p) {
    var ws = p ? new OWS(u, p) : new OWS(u); log('ws new', String(u).replace(/token=[^&]+/, 'token=…'));
    ws.addEventListener('open', function () { log('ws open'); });
    ws.addEventListener('close', function (e) { log('ws close', e.code, e.reason); });
    ws.addEventListener('error', function () { log('ws error'); });
    return ws;
  }; window.WebSocket.prototype = OWS.prototype; ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function (k) { window.WebSocket[k] = OWS[k]; });
  log('start', location.href, navigator.userAgent);

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function visible(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight + 2000; }
  function bodyText() { return document.body ? document.body.innerText : ''; }
  function has(text) { return bodyText().indexOf(text) >= 0; }
  function buttons() { return Array.prototype.slice.call(document.querySelectorAll('[role="button"],button,[role="radio"]')).filter(visible); }
  function findBtn(re) { return buttons().find(function (b) { var s = (b.innerText || b.getAttribute('aria-label') || '').trim(); return re.test(s); }); }
  function tap(el, what) {
    if (!el) throw new Error('nicht gefunden: ' + what);
    el.scrollIntoView({ block: 'center' }); var r = el.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var top = document.elementFromPoint(x, y); if (top && top !== el && !el.contains(top)) log('WARN tap verdeckt', what, '→', (top.innerText || top.tagName).slice(0, 40));
    var o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 };
    try { var tch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y }); el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [tch], targetTouches: [tch], changedTouches: [tch] })); } catch (_) {}
    el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new MouseEvent('mousedown', o));
    o.buttons = 0;
    try { var tch2 = new Touch({ identifier: 1, target: el, clientX: x, clientY: y }); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [tch2] })); } catch (_) {}
    el.dispatchEvent(new PointerEvent('pointerup', o)); el.dispatchEvent(new MouseEvent('mouseup', o)); el.dispatchEvent(new MouseEvent('click', o));
    log('tap', what);
  }
  function fill(input, value) {
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; input.focus(); setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true })); log('fill', input.getAttribute('placeholder'), value);
  }
  async function waitFor(fn, what, ms) { var end = Date.now() + (ms || 30000); while (Date.now() < end) { try { var v = fn(); if (v) return v; } catch (_) {} await sleep(400); } throw new Error('Zeitlimit: ' + what); }
  var lastPath = '';
  setInterval(function () { if (location.pathname !== lastPath) { lastPath = location.pathname; log('route', lastPath); } }, 300);
  setInterval(function () { log('heartbeat', location.pathname, bodyText().replace(/\s+/g, ' ').slice(0, 140)); }, 5000);

  async function tutorialLoop() {
    var acted = {};
    var end = Date.now() + 300000;
    while (Date.now() < end) {
      if (has('Jetzt richtig loslegen')) return;
      var v = findBtn(/^Verstanden$/); if (v) { tap(v, 'Verstanden'); await sleep(400); }
      if (has('Du wählst die Kategorie') && !acted.cat) {
        var tiles = buttons().filter(function (b) { var s = (b.innerText || '').trim(); return s && !/Verstanden|Spiel verlassen|✕|⚑|melden/i.test(s) && !/Spiel verlassen/.test(b.getAttribute('aria-label') || ''); });
        if (tiles[0]) { tap(tiles[0], 'Kategorie ' + tiles[0].innerText.trim().slice(0, 30)); acted.cat = 1; }
      }
      var inp = document.querySelector('input[placeholder="Deine Finte"]');
      if (inp && !acted.bluff) { fill(inp, 'Alpakas'); await sleep(300); tap(findBtn(/^Finte abgeben$/), 'Finte abgeben'); acted.bluff = 1; }
      var truth = findBtn(/^Das ist die Wahrheit!$/);
      if (truth && !acted.vote) {
        var opts = buttons().filter(function (b) { var s = (b.innerText || '').trim(); return s && s !== 'Alpakas' && !/Verstanden|Spiel verlassen|Das ist die Wahrheit|melden|Deine Finte|✕|⚑/i.test(s); });
        if (opts[0]) { tap(opts[0], 'Option ' + opts[0].innerText.trim().slice(0, 30)); await sleep(300); tap(findBtn(/^Das ist die Wahrheit!$/), 'Wahrheit'); acted.vote = 1; }
      }
      var rs = findBtn(/^Zum Rundenstand$/); if (rs && !acted.rs) { tap(rs, 'Zum Rundenstand'); acted.rs = 1; }
      var nx = findBtn(/^(Endergebnis|Weiter|Zum Ergebnis)/); if (nx && acted.rs && !acted.nx) { tap(nx, nx.innerText.trim()); acted.nx = 1; }
      await sleep(700);
    }
    throw new Error('Proberunde nicht fertig');
  }

  async function run() {
    var name = 'Sim' + Math.floor(Math.random() * 9000 + 1000);
    try {
      await waitFor(function () { return has('Eine skurrile Frage'); }, 'Onboarding', 45000); log('STEP onboarding');
      tap(findBtn(/^Weiter$/), 'Weiter'); await sleep(700);
      tap(findBtn(/^Weiter$/), 'Weiter'); await sleep(700);
      tap(findBtn(/Name eingeben/), 'Name eingeben');
      var inp = await waitFor(function () { return document.querySelector('input[placeholder="z.B. Fuchsteufel"]'); }, 'Namensfeld');
      fill(inp, name); await sleep(1200);
      tap(findBtn(/^Los geht/), "Los geht's");
      await waitFor(function () { return has('Hallo ' + name); }, 'Willkommen', 30000); log('STEP profil', name);
      tap(findBtn(/^Proberunde spielen$/), 'Proberunde spielen');
      await waitFor(function () { return /\/game\//.test(location.pathname); }, 'Spiel-Route', 30000); log('STEP proberunde-start');
      await tutorialLoop(); log('STEP proberunde-fertig');
      tap(findBtn(/^Jetzt richtig loslegen$/), 'Jetzt richtig loslegen');
      await waitFor(function () { return findBtn(/^Neues Spiel$/); }, 'Home', 20000); log('STEP home');
      tap(findBtn(/^Neues Spiel$/), 'Neues Spiel');
      await waitFor(function () { return has('Modus'); }, 'Neues Spiel', 20000);
      tap(findBtn(/^Weiter$/), 'Weiter'); await sleep(800);
      tap(await waitFor(function () { return findBtn(/^Spiel erstellen$/); }, 'Spiel erstellen'), 'Spiel erstellen');
      await waitFor(function () { return has('Einladungscode'); }, 'Lobby', 30000); log('STEP lobby');
      await sleep(1500);
      // Aufräumen: Konto löschen
      location.assign('/settings'); return; // weiter nach dem Neuladen (siehe unten)
    } catch (e) { log('FAIL', String(e && e.message || e)); log('QA-DONE FAIL'); }
  }

  async function cleanup() {
    try {
      var b = await waitFor(function () { return findBtn(/^Konto löschen$/); }, 'Konto löschen', 30000);
      tap(b, 'Konto löschen'); await sleep(1500);
      var c = findBtn(/Endgültig löschen|Ja, löschen|^Löschen$/); if (c) tap(c, c.innerText.trim());
      await waitFor(function () { return has('Eine skurrile Frage'); }, 'zurück zum Start', 30000);
      log('STEP konto-geloescht'); log('QA-DONE OK');
    } catch (e) { log('FAIL', String(e && e.message || e)); log('QA-DONE FAIL'); }
  }

  var start = function () { if (location.pathname === '/settings') cleanup(); else run(); };
  if (document.readyState === 'complete') setTimeout(start, 1500); else window.addEventListener('load', function () { setTimeout(start, 1500); });
})();
