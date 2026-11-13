/* feine jungs – Cookie-Einwilligung, Google Analytics (nur nach Zustimmung), Rechtstexte */
(function(){
  var GA_ID='G-PYN5JWD7T4', KEY='fj-consent-v2';
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){dataLayer.push(arguments);};
  function loadGA(){
    if(window.__fjGaLoaded)return; window.__fjGaLoaded=true;
    var s=document.createElement('script'); s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID; document.head.appendChild(s);
    gtag('js',new Date()); gtag('config',GA_ID,{anonymize_ip:true});
  }
  window.fjLoadAnalytics=loadGA;
  /* Widerruf: Messung sofort abschalten und Analyse-Cookies (_ga, _ga_*) löschen */
  function stopGA(){
    window['ga-disable-'+GA_ID]=true;
    var host=location.hostname, doms=['', host, '.'+host, '.'+host.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function(x){
      var n=x.split('=')[0].trim(); if(!/^_ga(_|$)/.test(n))return;
      doms.forEach(function(dm){ document.cookie=n+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'+(dm?'; domain='+dm:''); });
    });
  }
  window.fjStopAnalytics=stopGA;
  /* Entscheidung gilt 12 Monate, danach wird einmal neu gefragt (Zustimmung und Ablehnung gleich).
     Ältere Entscheidungen ohne Datum bekommen beim ersten Besuch das heutige Datum. */
  var KEY_AT=KEY+'-at', MAX_AGE=365*24*60*60*1000;
  var stored=null; try{stored=localStorage.getItem(KEY);}catch(e){}
  if(stored==='granted'||stored==='denied'){
    try{
      var at=parseInt(localStorage.getItem(KEY_AT),10);
      if(!at){localStorage.setItem(KEY_AT,String(Date.now()));}
      else if(Date.now()-at>MAX_AGE){localStorage.removeItem(KEY);localStorage.removeItem(KEY_AT);stored=null;stopGA();}
    }catch(e){}
  }
  if(stored==='granted')loadGA(); else if(stored==='denied')window['ga-disable-'+GA_ID]=true;

  var css='.fj-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:1200;max-width:760px;margin:0 auto;background:#fff;color:#20231f;border:1px solid #d9dfda;border-top:3px solid #f45d00;box-shadow:0 18px 50px rgba(20,30,20,.28);padding:22px 24px;font-family:"DM Sans",Arial,sans-serif;display:none;opacity:0;transform:translateY(14px);transition:opacity .4s cubic-bezier(.23,1,.32,1),transform .4s cubic-bezier(.23,1,.32,1)}'
   +'.fj-cc.show{display:block}.fj-cc.in{opacity:1;transform:none}'
   +'.fj-cc p{margin:0 0 16px;font-size:14px;line-height:1.6;color:#20231f}.fj-cc b{font-family:"Instrument Sans",Arial,sans-serif;font-weight:600;font-size:16px;display:block;margin-bottom:4px;color:#20231f}'
   +'.fj-cc b i{font-style:normal;color:#f45d00}.fj-cc a{color:#31513a;text-decoration:underline}'
   +'.fj-cc-btns{display:flex;gap:10px;flex-wrap:wrap}'
   +'.fj-cc button{flex:1 1 180px;min-height:48px;padding:0 18px;border:1px solid #606b55;background:#fff;color:#31513a;font:600 11px "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .2s,color .2s}'
   +'.fj-cc button:hover{background:#eef1ec}.fj-cc button.pri{background:#606b55;border-color:#606b55;color:#fff}.fj-cc button.pri:hover{background:#f45d00;border-color:#f45d00}'
   +'body.fj-intro-on .fj-cc{visibility:hidden}';
  function build(){
    if(document.getElementById('fjCookie'))return document.getElementById('fjCookie');
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var d=document.createElement('div'); d.className='fj-cc'; d.id='fjCookie';
    d.setAttribute('role','dialog'); d.setAttribute('aria-live','polite'); d.setAttribute('aria-label','Cookie-Einwilligung');
    d.innerHTML='<p><b>Kurz gefragt<i>.</i></b>Wir würden gerne anonym messen, wie unsere Seite genutzt wird (Google Analytics). Das ist freiwillig – ohne eure Zustimmung wird nichts geladen und kein Analyse-Cookie gesetzt. Notwendige Speicherungen (z. B. euer Warenkorb) bleiben davon unberührt. Details in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>'
      +'<div class="fj-cc-btns"><button type="button" id="fjCcNo">Nur notwendige</button><button type="button" class="pri" id="fjCcYes">Alle akzeptieren</button></div>';
    document.body.appendChild(d);
    function decide(v){ try{localStorage.setItem(KEY,v);localStorage.setItem(KEY_AT,String(Date.now()));}catch(e){} d.classList.remove('in'); setTimeout(function(){d.classList.remove('show');},400); if(v==='granted'){window['ga-disable-'+GA_ID]=false;loadGA();} else stopGA(); }
    d.querySelector('#fjCcYes').addEventListener('click',function(){decide('granted');});
    d.querySelector('#fjCcNo').addEventListener('click',function(){decide('denied');});
    return d;
  }
  function show(){ var d=build(); d.classList.add('show'); requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('in');});}); }
  window.fjConsentOpen=show;
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href="#cookie-einstellungen"]'); if(!a)return;
    e.preventDefault(); show();
  },true);
  function init(){
    if(stored!=='granted'&&stored!=='denied')show();
    /* Impressum/Datenschutz der App auf die vollständigen Rechtstexte umleiten */
    document.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('button'); if(!b)return;
      var t=(b.textContent||'').trim().toLowerCase(), url=null;
      if(t==='datenschutz'||t==='datenschutzhinweise')url='/datenschutz';
      else if(t==='impressum')url='/impressum';
      if(!url)return;
      e.preventDefault(); e.stopPropagation();
      if(b.closest('[role=dialog]'))window.open(url,'_blank','noopener'); else location.href=url;
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();


  /* Aktions-Pop-up Weihnachtsfeier (-20 % Grundpreis) */
  (function(){
    var END=new Date('2026-10-31T23:59:59+01:00'), KEYP='fj-promo-xmas26';
    if(new Date()>END)return;
    if(/^\/(weihnachtsfeier|gluehwein|datenschutz|impressum)/.test(location.pathname))return;
    try{ if(sessionStorage.getItem(KEYP))return; }catch(e){}
    var css='.fj-pr-bg{position:fixed;inset:0;z-index:1300;overflow:hidden;background:rgba(20,28,20,.62);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .35s}'
      +'.fj-pr-bg.in{opacity:1}'
      +'.fj-pr{position:relative;z-index:1;width:100%;max-width:440px;background:#606b55;color:#fff;border-top:3px solid #f45d00;padding:34px 28px 26px;font-family:"DM Sans",Arial,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.4);opacity:0}'
      +'.fj-pr-bg.in .fj-pr{animation:fjPrPop .9s .15s cubic-bezier(.23,1,.32,1) both}'
      +'@keyframes fjPrPop{0%{opacity:0;transform:translateY(40px) scale(.92)}60%{opacity:1;transform:translateY(-6px) scale(1.01)}100%{opacity:1;transform:none}}'
      +'@keyframes fjPrFall{0%{transform:translateY(-20px) translateX(0);opacity:0}10%{opacity:.9}100%{transform:translateY(105vh) translateX(24px);opacity:.2}}'
      +'@keyframes fjPrPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}'
      +'.fj-pr-flake{position:absolute;top:0;border-radius:50%;background:#fff;pointer-events:none;animation-name:fjPrFall;animation-timing-function:linear;animation-iteration-count:infinite}'
      +'.fj-pr .pct span{display:inline-block;transform-origin:left center;animation:fjPrPulse 2.4s 1.4s ease-in-out infinite}'
      +'@media (prefers-reduced-motion:reduce){.fj-pr-flake{display:none}.fj-pr-bg.in .fj-pr,.fj-pr .pct span{animation:none}}'
      +'.fj-pr small{display:block;font:600 10px "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase;color:#e0e8dc}'
      +'.fj-pr h2{font-family:"Instrument Sans",Arial,sans-serif;font-weight:500;font-size:38px;line-height:1.02;letter-spacing:-.03em;margin:14px 0 0;color:#fff}'
      +'.fj-pr h2 i{font-style:normal;color:#f45d00;margin-left:.07em}'
      +'.fj-pr .pct{font-family:"Instrument Sans",Arial,sans-serif;font-weight:500;font-size:56px;line-height:1;letter-spacing:-.05em;color:#f45d00;margin:18px 0 4px}'
      +'.fj-pr p{margin:8px 0 0;font-size:15px;line-height:1.6;color:#f4f6f2}'
      +'.fj-pr a.go{display:flex;align-items:center;justify-content:space-between;min-height:54px;margin-top:22px;padding:0 20px;background:#fff;color:#32483a;text-decoration:none;font:600 11px "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase}'
      +'.fj-pr a.go:hover{background:#f45d00;color:#fff}'
      +'.fj-pr button.later{display:block;margin:14px auto 0;background:none;border:0;color:#e0e8dc;font:500 12px "DM Sans",Arial,sans-serif;text-decoration:underline;cursor:pointer}'
      +'.fj-pr button.x{position:absolute;top:10px;right:10px;width:40px;height:40px;border:0;background:none;color:#fff;font-size:26px;line-height:1;cursor:pointer}'
      +'.fj-pr a.alt{display:block;margin-top:12px;color:#fff;font-size:13px;text-decoration:underline;text-underline-offset:3px}.fj-pr a.alt:hover{color:#f45d00}'
      +'.fj-pr .fine{font-size:11px;color:#e0e8dc;margin-top:14px}';
    function open(){
      try{ sessionStorage.setItem(KEYP,'1'); }catch(e){}
      var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
      var bg=document.createElement('div'); bg.className='fj-pr-bg';
      bg.innerHTML='<div class="fj-pr" role="dialog" aria-modal="true" aria-labelledby="fjPrT">'
        +'<button type="button" class="x" aria-label="Schließen">×</button>'
        +'<small>Nur bis 31. Oktober</small>'
        +'<h2 id="fjPrT">Weihnachtsfeier?<br>Machen wir<i>.</i></h2>'
        +'<div class="pct"><span>−20 %</span></div>'
        +'<p>auf den Grundpreis für eure Weihnachtsfeier. Bar-Ape und Glühwein – wir kommen zu euch.</p>'
        +'<a class="go" href="/weihnachtsfeier#anfrage">Jetzt Termin sichern <span>↗</span></a>'
        +'<a class="alt" href="/gluehwein">Lieber kurz &amp; kompakt? Glühwein After Work: 1–3 Std. ab 290 € →</a>'
        +'<p class="fine">Gilt für Weihnachtsfeier-Anfragen bis 31.10.2026. Rabatt auf den Grundpreis, nicht auf die Getränkepauschale.</p>'
        +'<button type="button" class="later">Später</button></div>';
      for(var i=0;i<28;i++){ var f=document.createElement('i'); f.className='fj-pr-flake'; var sz=3+(i*7)%6; f.style.cssText='left:'+((i*37)%100)+'%;width:'+sz+'px;height:'+sz+'px;animation-duration:'+(6+(i*13)%7)+'s;animation-delay:'+(-((i*17)%11))+'s'; bg.insertBefore(f,bg.firstChild); }
      document.body.appendChild(bg);
      requestAnimationFrame(function(){requestAnimationFrame(function(){bg.classList.add('in');});});
      function close(){ bg.classList.remove('in'); setTimeout(function(){bg.remove();},350); document.removeEventListener('keydown',esc); }
      function esc(e){ if(e.key==='Escape')close(); }
      document.addEventListener('keydown',esc);
      bg.addEventListener('click',function(e){ if(e.target===bg)close(); });
      bg.querySelector('.x').addEventListener('click',close);
      bg.querySelector('.later').addEventListener('click',close);
    }
    /* erst nach Intro und Cookie-Entscheidung */
    var waited=0;
    (function wait(){
      var intro=document.body&&document.body.classList.contains('fj-intro-on')||document.getElementById('pre');
      var cc=document.querySelector('.fj-cc.show');
      if(!document.body||intro||cc){ waited+=400; if(waited<120000)setTimeout(wait,400); return; }
      setTimeout(open,1500);
    })();
  })();
  /* Headline-Punkte: gleicher Abstand ueberall, Orange nur beim Schlusspunkt von H1/H2 */
  (function(){
    var st=document.createElement('style');
    st.textContent='main h1 .op,main h2 .op,main h3 .op{color:inherit!important}main h1 .op.op-end,main h2 .op.op-end{color:#f45d00!important}.op,.hero .orange-period{display:inline!important;vertical-align:baseline!important;line-height:inherit!important;position:static!important;transform:none!important}';
    document.head.appendChild(st);
    function mark(){
      document.querySelectorAll('main h1,main h2').forEach(function(h){
        var ops=h.querySelectorAll('.op'); if(!ops.length)return;
        var last=ops[ops.length-1], ends=/\.\s*$/.test(h.textContent||'');
        ops.forEach(function(o){ if(o!==last||!ends)o.classList.remove('op-end'); });
        if(ends)last.classList.add('op-end');
      });
    }
    var t=null; function soon(){ clearTimeout(t); t=setTimeout(mark,60); }
    function start(){ mark(); new MutationObserver(soon).observe(document.body,{childList:true,subtree:true}); }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start); else start();
  })();
})();
