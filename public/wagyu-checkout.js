/* feine jungs – Wagyu-Kasse v3 (Vertrag „Website v3“, docs/09).
   Übernimmt NUR Warenkörbe mit Wagyu-Plätzen. Reine Gutscheinkäufe, Eventservice und alte Rückkehrlinks
   (?bestellung=…&ref=…) laufen unverändert über die bisherigen Wege.

   Sicherheit beim Ausrollen:
   - Auf feinejungs.de bleibt der alte Weg aktiv, solange LIVE_ENABLED=false ist. Erst beim Umstieg
     (Runbook docs/08, Schritt 14) wird hier true gesetzt. Ein versehentliches Mergen ändert also nichts.
   - Überall sonst (Vercel-Vorschau, lokal) spricht die Kasse ausschließlich mit dem TESTPROJEKT.
   - Kein Name, keine E-Mail und kein Zahlungslink landen in URLs, Logs oder Konsolenausgaben. */
(function () {
  'use strict';
  if (window.fjWagyu) return;

  var LIVE_ENABLED = false;                                   // ← Umstieg: auf true setzen (mit Freigabe)
  var LIVE_HOSTS = ['feinejungs.de', 'www.feinejungs.de'];
  var LIVE = { api: 'https://yarzxemodteevfodhstl.supabase.co/functions/v1', key: '' };
  var TEST = { api: 'https://qnngxcpwkkevmxxkxqkt.supabase.co/functions/v1', key: 'sb_publishable_dPgtNtIBGx5LEXUGy68hzg_3POvnCu-' };

  var isLive = LIVE_HOSTS.indexOf(location.hostname) >= 0;
  var cfg = isLive ? LIVE : (window.FJ_WAGYU_TEST_CONFIG || TEST);  // Testhaken nur außerhalb von feinejungs.de
  var enabled = isLive ? LIVE_ENABLED : true;

  var STORE = 'fj_wagyu_checkout';
  var MAX_AGE_MS = 48 * 3600 * 1000;
  var POLL_MAX = 20;
  var MOLLIE_PREFIX = 'https://www.mollie.com/';
  var TEL = '<a href="tel:+491777753688">0177 775 36 88</a>';
  var MAIL = '<a href="mailto:hello@feinejungs.de">hello@feinejungs.de</a>';

  /* ---------- Speicher (localStorage, Fallback Arbeitsspeicher) ---------- */
  var mem = null;
  function load() {
    var r = null;
    try { var t = localStorage.getItem(STORE); r = t ? JSON.parse(t) : null; } catch (e) { r = mem; }
    if (!r || typeof r !== 'object') return null;
    if (!r.created_at || Date.now() - Date.parse(r.created_at) > MAX_AGE_MS || isNaN(Date.parse(r.created_at))) { clear(); return null; }
    return r;
  }
  function save(r) { mem = r; try { localStorage.setItem(STORE, JSON.stringify(r)); } catch (e) { /* Arbeitsspeicher */ } }
  function clear() { mem = null; try { localStorage.removeItem(STORE); } catch (e) { /* egal */ } }
  // Endgültig: Body (personenbezogen) und Besitznachweis löschen, höchstens die Bestellnummer behalten (§1)
  function finish(r) { clear(); if (r && r.order_number) { try { sessionStorage.setItem('fj_wagyu_last', r.order_number); } catch (e) { /* egal */ } } }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function secret() { return Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(24)), function (x) { return (x + 256).toString(16).slice(1); }).join(''); }

  /* ---------- Web Locks (§5) ---------- */
  var busy = false;
  function withLock(fn) {
    if (navigator.locks && navigator.locks.request) return navigator.locks.request('fj-wagyu-checkout', fn);
    if (busy) return Promise.resolve({ busy: true });
    busy = true;
    return Promise.resolve().then(fn).finally(function () { busy = false; });
  }

  /* ---------- HTTP ---------- */
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function headers(rec, idem) {
    var h = { 'Content-Type': 'application/json', 'x-checkout-recovery': rec.recovery };
    if (cfg.key) h.apikey = cfg.key;
    if (idem) h['Idempotency-Key'] = rec.request_id;
    return h;
  }
  function call(path, rec, bodyText, idem) {
    var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, 25000);
    return fetch(cfg.api + path, { method: 'POST', headers: headers(rec, idem), body: bodyText, signal: ctl.signal, credentials: 'omit' })
      .then(function (res) {
        return res.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) { j = null; }
          return { http: res.status, retry: Number(res.headers.get('Retry-After')) || 0, data: j || {} };
        });
      }, function () { return { http: 0, retry: 0, data: {} }; })            // Netzfehler / Timeout
      .finally(function () { clearTimeout(timer); });
  }
  // Kauf-POST: bei Netzfehler/Timeout/404/503 DENSELBEN Body mit DERSELBEN Kennung erneut (§7, §3) – nie neue Kennung
  function postCart(rec) {
    var n = 0;
    function attempt() {
      return call('/wagyu-cart', rec, rec.body, true).then(function (r) {
        var retriable = r.http === 0 || r.http === 503 || (r.http === 404 && r.data.error === 'not_found');
        if (retriable && n < 3) { n++; return sleep(Math.min(30, r.retry || 2 * n) * 1000).then(attempt); }
        return r;
      });
    }
    return attempt();
  }
  function status(rec) { return call('/wagyu-order-status', rec, JSON.stringify({ request_id: rec.request_id }), false); }

  /* ---------- Oberfläche ---------- */
  var css = '#fj-wg{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(20,30,24,.55);pointer-events:auto;font-family:"DM Sans",Arial,sans-serif}'
    + '#fj-wg .b{position:relative;width:100%;max-width:480px;max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#1e2a21;padding:36px 30px 28px;border-top:4px solid #f45d00;box-shadow:0 24px 60px rgba(0,0,0,.25)}'
    + '#fj-wg .k{font-size:10px;letter-spacing:.18em;font-weight:500;color:#647069;margin:0 0 10px}'
    + '#fj-wg h2{font-family:"Instrument Sans",Arial,sans-serif;font-weight:500;font-size:30px;line-height:1.1;margin:0 0 14px;color:#1e2a21}#fj-wg h2 i{font-style:normal;color:#f45d00}'
    + '#fj-wg p{font-size:15px;line-height:1.55;margin:0 0 12px}#fj-wg a{color:#f45d00}#fj-wg .m{font-size:13px;color:#647069}'
    + '#fj-wg .x{position:absolute;top:10px;right:12px;background:none;border:0;font-size:26px;line-height:1;color:#647069;cursor:pointer;padding:6px}'
    + '#fj-wg .btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}'
    + '#fj-wg .btn{display:inline-flex;align-items:center;gap:8px;background:#f45d00;color:#fff;border:0;padding:14px 22px;font:600 12px "DM Sans",Arial,sans-serif;letter-spacing:.12em;text-decoration:none;cursor:pointer}#fj-wg .btn.s{background:#1e3b2a}#fj-wg .btn.g{background:#fff;color:#1e3b2a;border:1px solid #a9b5a6}'
    + '#fj-wg .sp{width:28px;height:28px;border:3px solid #d9dfda;border-top-color:#f45d00;border-radius:50%;animation:fjwgSp .8s linear infinite;margin:6px 0 18px}@keyframes fjwgSp{to{transform:rotate(360deg)}}'
    + '.fj-wcount{margin:8px 0 0;font-size:13px;line-height:1.45;color:#647069}.fj-wcount b{color:#1e2a21;font-weight:600}.fj-wcount .low{color:#f45d00}';
  var root = null, onAction = {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ensureCss() { if (!document.getElementById('fj-wg-css')) { var st = document.createElement('style'); st.id = 'fj-wg-css'; st.textContent = css; document.head.appendChild(st); } }
  function show(html, actions) {
    ensureCss();
    onAction = actions || {};
    if (!root) {
      root = document.createElement('div'); root.id = 'fj-wg'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'fj-wg-h');
      root.innerHTML = '<div class="b"><button class="x" type="button" aria-label="Schließen" data-a="close">×</button><div class="c" aria-live="polite"></div></div>';
      root.addEventListener('click', function (e) {
        var el = e.target.closest('[data-a]'); if (!el && e.target !== root) return;
        act(el ? el.getAttribute('data-a') : 'close', !!(el && el.hasAttribute('data-close')));
      });
      document.body.appendChild(root);
    }
    root.querySelector('.c').innerHTML = html;
  }
  function act(a, andClose) {
    if (a === 'close' && onAction.close === false) return;            // z. B. während Weiterleitung/Warten
    var fn = onAction[a];
    if (a === 'close' || andClose) hide();
    if (typeof fn === 'function') fn();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root) act('close', false); });
  function hide() { if (root) { root.remove(); root = null; } }
  function head(nr, title) { return (nr ? '<p class="k">BESTELLUNG ' + esc(nr) + '</p>' : '') + '<h2 id="fj-wg-h">' + title + '<i>.</i></h2>'; }
  var eur = function (c) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100); };

  function viewWait(nr, text) { show(head(nr, 'Einen Moment') + '<div class="sp" aria-hidden="true"></div><p>' + text + '</p>', { close: false }); }
  function viewPaid(d) {
    show(head(d.order_number, 'Vielen Dank') + '<p>Eure Plätze sind verbindlich gebucht. Die Bestätigung kommt per E-Mail – bringt sie einfach am Abend mit.</p>'
      + '<p class="m">Nichts angekommen? Schaut kurz im Spam-Ordner nach oder schreibt uns an ' + MAIL + '.</p><div class="btns"><button class="btn s" type="button" data-close data-a="ok">WEITER ZUR SEITE</button></div>');
  }
  function viewManual(d) {
    show(head(d.order_number, 'Wir prüfen eure Bestellung') + '<p>Wir prüfen eure Bestellung' + (d.order_number ? ' <b>' + esc(d.order_number) + '</b>' : '') + ' und melden uns. Eure Plätze sind für euch reserviert – bitte nicht noch einmal bestellen.</p>'
      + '<p class="m">Fragen? ' + TEL + ' oder ' + MAIL + '</p><div class="btns"><button class="btn s" type="button" data-close data-a="ok">OK</button></div>');
  }
  function viewSlow(rec, d) {
    show(head(d.order_number, 'Das dauert gerade länger') + '<p>Eure Plätze sind reserviert. Wir prüfen den Zahlungsstart und melden uns bei euch.</p>'
      + '<div class="btns"><button class="btn" type="button" data-a="again">ERNEUT PRÜFEN</button><button class="btn g" type="button" data-close data-a="ok">SCHLIESSEN</button></div>',
      { again: function () { viewWait(d.order_number, 'Wir fragen den Stand ab …'); status(rec).then(function (r) { handle(rec, r, { fromStatus: true, polls: POLL_MAX }); }); } });
  }
  function viewCancelled(d) {
    show(head(d.order_number, 'Zahlung nicht abgeschlossen') + '<p>Die Zahlung wurde abgebrochen oder ist abgelaufen – die Plätze sind wieder frei. Ihr könnt jederzeit neu buchen.</p>'
      + '<div class="btns"><button class="btn" type="button" data-close data-a="rebook">NEU BUCHEN</button></div>',
      { rebook: function () { var t = document.getElementById('wagyu') || document.querySelector('[id*="wagyu"]'); if (t) t.scrollIntoView({ behavior: 'smooth' }); } });
  }
  function viewRetryPay(d) {
    show(head(d.order_number, 'Zahlung noch nicht abgeschlossen') + '<p>Eure Plätze sind noch reserviert. Ihr könnt die Zahlung jetzt abschließen' + (d.amount_due_cents ? ' (' + eur(d.amount_due_cents) + ')' : '') + '.</p>'
      + '<p class="m">Ohne Zahlung werden die Plätze nach kurzer Zeit automatisch wieder frei.</p>'
      + '<div class="btns"><button class="btn" type="button" data-a="pay">ERNEUT VERSUCHEN</button><button class="btn g" type="button" data-close data-a="ok">SPÄTER</button></div>',
      { pay: function () { goPay(d); } });
  }
  function viewError(title, text, actions, buttons) {
    show(head(null, title) + '<p>' + text + '</p><div class="btns">' + (buttons || '<button class="btn s" type="button" data-close data-a="ok">OK</button>') + '</div>', actions);
  }
  function viewNeutralThanks() { show(head(null, 'Danke') + '<p>Die Bestätigung kommt per E-Mail, sobald die Zahlung eingegangen ist.</p><div class="btns"><button class="btn s" type="button" data-close data-a="ok">WEITER ZUR SEITE</button></div>'); }

  // §10: nur zu Mollie navigieren, sonst neutral „wird geprüft“
  function goPay(d) {
    if (typeof d.payment_url === 'string' && d.payment_url.indexOf(MOLLIE_PREFIX) === 0) {
      viewWait(d.order_number, 'Weiter zur Bezahlseite …');
      location.assign(d.payment_url);
      return true;
    }
    viewManual(d);
    return false;
  }

  var DATE_DE = { '2026-12-17': 'Do 17.12.', '2026-12-18': 'Fr 18.12.' };
  /* Ergebnis einer Kasse-/Statusantwort umsetzen. Rückgabe für das Bundle:
     clearCart (Bestellung existiert), voucherError, fieldError. */
  function handle(rec, r, o) {
    o = o || {};
    var d = r.data || {}, e = d.error;
    if (d.order_number && rec.order_number !== d.order_number) { rec.order_number = d.order_number; if (load()) save(rec); }
    if (r.http >= 200 && r.http < 300 && d.ok) {
      switch (d.state) {
        case 'checkout_ready':
          if (!o.returned) { goPay(d); return { clearCart: true }; }
          // Rückkehr: Mollies Bestätigung kann ein paar Sekunden nach dem Rücksprung eintreffen → kurz nachfragen
          if ((o.waits || 0) < 4) {
            viewWait(d.order_number, 'Wir prüfen gerade eure Zahlung …');
            sleep(2500).then(function () { return status(rec); }).then(function (s) { handle(rec, s, { returned: true, fromStatus: true, waits: (o.waits || 0) + 1 }); });
          } else viewRetryPay(d);
          return { clearCart: true };
        case 'paid': finish(rec); viewPaid(d); refreshCount(true); return { clearCart: true };
        case 'cancelled':
          finish(rec); refreshCount(true);
          if (!o.fromStatus) {                                         // Kauf-Klick traf eine abgelaufene, gleiche Altbestellung
            viewError('Vorherige Bestellung abgelaufen', 'Eure vorherige Bestellung mit diesem Warenkorb wurde nicht bezahlt und ist abgelaufen. Klickt noch einmal auf „Jetzt kaufen“, um neu zu buchen.');
            return { modal: true };                                    // Warenkorb bleibt; nächster Klick = neue Kennung
          }
          viewCancelled(d); return { clearCart: true };
        case 'received': finish(rec); viewNeutralThanks(); return { clearCart: true };
        case 'manual_review': viewManual(d); return { clearCart: true };
        case 'processing': {
          var polls = o.polls || 0;
          if (polls >= POLL_MAX) { viewSlow(rec, d); return { clearCart: true }; }
          viewWait(d.order_number, o.returned ? 'Wir prüfen gerade eure Zahlung …' : 'Eure Plätze sind reserviert. Die Bezahlseite wird vorbereitet …');
          var wait = Math.max(1, Math.min(10, r.retry || 3)) * 1000;
          sleep(wait).then(function () { return status(rec); }).then(function (s) { handle(rec, s, { returned: o.returned, polls: polls + 1, fromStatus: true }); });
          return { clearCart: true };
        }
      }
    }
    // Fehler (§3, §6, §7)
    if (e === 'wagyu_ausverkauft' || e === 'wagyu_nur_noch_restplaetze') {
      clear(); refreshCount(true);                                    // nichts angelegt; Menge ändern = neuer Vorgang
      var day = DATE_DE[d.date] || 'diesen Abend';
      viewError(e === 'wagyu_ausverkauft' ? 'Leider ausverkauft' : 'Nur noch wenige Plätze',
        e === 'wagyu_ausverkauft' ? 'Für ' + esc(day) + ' sind leider alle Plätze vergeben. Bitte wählt den anderen Abend.'
          : 'Für ' + esc(day) + ' sind nur noch <b>' + esc(d.remaining) + '</b> Plätze frei. Bitte passt die Anzahl im Warenkorb an.');
      return { modal: true };
    }
    if (e === 'gutschein_ungueltig' || e === 'gutschein_nicht_anrechenbar') { clear(); return { voucherError: true }; }
    if (r.http === 400) { clear(); return { fieldError: true }; }      // nichts angelegt; korrigieren = neue Kennung
    if (e === 'contract_upgrade_required') {
      viewError('Bitte Seite neu laden', 'Die Kasse wurde aktualisiert. Bitte ladet die Seite neu und bestellt dann noch einmal.', { reload: function () { location.reload(); } },
        '<button class="btn" type="button" data-a="reload">SEITE NEU LADEN</button>');
      return { modal: true };
    }
    if (e === 'idempotency_mismatch') { askNew(rec, o.payload); return { modal: true }; }
    if (r.http === 401) {
      viewError('Bestellung nicht zugeordnet', 'Diese Bestellung konnte nicht zugeordnet werden. Bitte prüft eure E-Mails oder meldet euch bei uns: ' + TEL + ' · ' + MAIL + '.',
        { restart: function () { clear(); } },
        '<button class="btn s" type="button" data-close data-a="ok">OK</button><button class="btn g" type="button" data-close data-a="restart">NEU STARTEN (Vorsicht: keine Doppelbuchung!)</button>');
      return { modal: true };
    }
    if (r.http === 404 && o.fromStatus) {
      if (rec.body && o.returned) return null;                       // Aufrufer sendet den gespeicherten Body erneut (§7)
      viewError('Bestellung nicht gefunden', 'Zu dieser Bestellung liegt uns nichts vor. Bitte gebt die Bestellung erneut auf.', { restart: function () { clear(); } },
        '<button class="btn" type="button" data-close data-a="restart">BESTELLUNG ERNEUT AUFGEBEN</button>');
      return { modal: true };
    }
    // Netz/503 nach 3 Versuchen: Vorgang bleibt gespeichert → derselbe Klick sendet denselben Request
    viewError('Gerade nicht erreichbar', 'Die Kasse ist gerade nicht erreichbar. Bitte versucht es gleich noch einmal – eure Angaben bleiben erhalten, es entsteht keine doppelte Bestellung.');
    return { modal: true };
  }

  // Offener Vorgang mit anderem Warenkorb (§5): nur nach ausdrücklicher Bestätigung neue Kennung
  function askNew(rec, payload) {
    return new Promise(function (resolve) {
      show(head(rec.order_number, 'Offene Bestellung') + '<p>In diesem Browser gibt es schon eine offene Wagyu-Bestellung'
        + (rec.order_number ? ' (<b>' + esc(rec.order_number) + '</b>)' : '') + ' mit einem anderen Warenkorb.</p>'
        + '<p class="m">Eine neue Bestellung ist eine zusätzliche Buchung. Die offene hält ihre Plätze, bis ihre Zahlung abläuft (ca. 15 Minuten).</p>'
        + '<div class="btns"><button class="btn s" type="button" data-a="view">OFFENE BESTELLUNG ANSEHEN</button><button class="btn g" type="button" data-a="new">NEUE BESTELLUNG ANLEGEN</button></div>',
        { view: function () { viewWait(rec.order_number, 'Wir fragen den Stand ab …'); status(rec).then(function (r) { resolve(handle(rec, r, { fromStatus: true, returned: true })); }); },
          new: function () { clear(); viewWait(null, 'Neue Bestellung wird angelegt …'); resolve(null); },
          close: function () { resolve({ modal: true }); } });
    });
  }

  function buildBody(p) {
    // Exakter Vertrags-Body (§2). Wird einmal erzeugt und als Text gespeichert; Wiederholungen senden genau diesen Text.
    return JSON.stringify({
      contract_version: 2,
      items: p.items.map(function (i) {
        return i.type === 'wagyu' ? { type: 'wagyu', date: i.date, quantity: i.quantity, gift: !!i.gift }
          : { type: 'voucher', amount: i.amount, recipient_name: i.recipient_name || null, message: i.message || null };
      }),
      contact: { name: p.contact.name, email: p.contact.email, phone: p.contact.phone || null, company: null, vat_id: null },
      billing: null,
      voucher_code: p.voucher_code || null,
      honeypot: p.honeypot || ''
    });
  }

  /* Öffentlicher Einstieg für das Bundle. */
  function checkout(payload) {
    var bodyText = buildBody(payload);
    return withLock(function () {
      var rec = load();
      if (rec && rec.body && rec.body !== bodyText) {
        return askNew(rec, payload).then(function (res) {
          if (res) return res;                                         // Status der offenen Bestellung gezeigt / abgebrochen
          return start(bodyText);
        });
      }
      if (rec && !rec.body) { clear(); rec = null; }                  // Body verloren → neuer Vorgang nur durch ausdrücklichen Klick (dieser Klick)
      return rec ? send(rec) : start(bodyText);
    }).then(function (res) { return res && !res.busy ? res : {}; });
  }
  function start(bodyText) {
    var rec = { request_id: uuid(), recovery: secret(), body: bodyText, created_at: new Date().toISOString(), order_number: null };
    save(rec);
    return send(rec);
  }
  function send(rec) { return postCart(rec).then(function (r) { return handle(rec, r, {}); }); }

  /* ---------- Rückkehr von Mollie (§9): ?bestellung=<nr> ohne ref ---------- */
  function onReturn() {
    var q = new URLSearchParams(location.search), nr = q.get('bestellung');
    if (!nr || q.has('ref')) return;                                  // alte Links: bisheriges Popup
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* egal */ }
    try { sessionStorage.setItem('fj-promo-xmas26', '1'); } catch (e) { /* Promo-Popup unterdrücken wie bisher */ }
    var kp = function () { Array.prototype.forEach.call(document.querySelectorAll('.fj-pr-bg'), function (x) { x.remove(); }); };
    kp(); var kpi = setInterval(kp, 500); setTimeout(function () { clearInterval(kpi); }, 15000);
    var rec = load();
    if (!rec || (rec.order_number && rec.order_number !== nr)) { viewNeutralThanks(); return; }
    viewWait(nr, 'Wir prüfen gerade eure Zahlung …');
    status(rec).then(function (r) {
      var out = handle(rec, r, { fromStatus: true, returned: true });
      if (out === null) send(rec);                                     // 404 mit gespeichertem Body → identisch erneut senden
    });
  }

  /* ---------- Platzzähler (§12) ---------- */
  var count = null, countAt = 0, countState = 'idle';
  function refreshCount(force) {
    if (!enabled || countState === 'loading') return;
    if (!force && Date.now() - countAt < 30000) return paintCount();
    countState = 'loading';
    fetch(cfg.api + '/wagyu-availability', { credentials: 'omit', headers: cfg.key ? { apikey: cfg.key } : {} })
      .then(function (r) { if (r.status !== 200) throw new Error('http'); return r.json(); })
      .then(function (j) { if (!j || !Array.isArray(j.days)) throw new Error('format'); count = j.days; countState = 'ok'; })
      .catch(function () { count = null; countState = 'error'; })
      .finally(function () { countAt = Date.now(); paintCount(); });
  }
  function paintCount() {
    var dates = document.querySelectorAll('.fj-ticket-dialog .co-dates');
    Array.prototype.forEach.call(dates, function (el) {
      var p = el.parentNode.querySelector('.fj-wcount');
      if (!p) { p = document.createElement('p'); p.className = 'fj-wcount'; p.setAttribute('aria-live', 'polite'); el.parentNode.appendChild(p); }
      var html = countState === 'error' ? 'Verfügbarkeit aktuell nicht abrufbar'
        : count ? count.map(function (d) {
          var a = Math.max(0, Number(d.available) || 0);
          return esc(DATE_DE[d.date] || d.date) + ': ' + (a === 0 ? '<b class="low">ausverkauft</b>' : '<b' + (a <= 5 ? ' class="low"' : '') + '>noch ' + a + ' ' + (a === 1 ? 'Platz' : 'Plätze') + '</b>');
        }).join(' · ') : '';
      if (p.innerHTML !== html) p.innerHTML = html;
      p.hidden = !html;
    });
  }
  function watchDialog() {
    var open = false;
    new MutationObserver(function () {
      var now = !!document.querySelector('.fj-ticket-dialog .co-dates');
      if (now && !open) refreshCount(false);                           // beim Öffnen (höchstens alle 30 s)
      else if (now && countState !== 'loading') paintCount();          // Neuzeichnen durch Preact überleben
      open = now;
    }).observe(document.body, { childList: true, subtree: true });
  }

  window.fjWagyu = { enabled: enabled, live: isLive, api: cfg.api, checkout: checkout };
  if (!enabled) return;
  ensureCss();
  window.addEventListener('storage', function (e) { if (e.key === STORE) mem = null; });   // anderer Tab hat den Vorgang geändert
  function boot() { load(); onReturn(); watchDialog(); refreshCount(true); }        // load(): >48 h alte Einträge löschen (§1)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
