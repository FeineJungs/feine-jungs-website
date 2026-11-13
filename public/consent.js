/* feine jungs – Lader: Cookie-Einwilligung/Rechtstexte (consent-base.js) + Kasse (checkout.js) + Anfrage (anfrage.js) */
(function(){
  var add=function(src){var s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s)};
  add('/consent-base.js');
  if(!/^\/(agb|impressum|datenschutz|einloesen)/.test(location.pathname)){add('/checkout.js?v=3');add('/anfrage.js?v=3')}
  /* Footer der statischen Seiten: Links umbrechen statt zerreißen, AGB-Link ergänzen */
  var st=document.createElement('style');st.textContent='footer .links{flex-wrap:wrap!important;row-gap:10px}footer .links a{white-space:nowrap}html,body,button,a,input,select,textarea,label,[role=button],[role=dialog]{touch-action:manipulation}';document.head.appendChild(st);
  var ft=function(){var l=document.querySelector('footer .links');if(!l||l.querySelector('a[href="/agb"]'))return;var a=document.createElement('a');a.href='/agb';a.textContent='AGB';var d=l.querySelector('a[href="/datenschutz"]');l.insertBefore(a,d||null)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ft);else ft();
  var ck=function(){var l=document.querySelector('footer .links');if(!l||l.querySelector('a[href="#cookie-einstellungen"]'))return;var a=document.createElement('a');a.href='#cookie-einstellungen';a.textContent='Cookie-Einstellungen';l.appendChild(a)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ck);else ck();
  /* KI-Hinweis im Fußbereich der statischen Unterseiten (Startseite hat ihn im Bundle) */
  var ki=function(){if(document.getElementById('root'))return;var f=document.querySelector('footer');if(!f||f.querySelector('.fj-ai-note'))return;var p=document.createElement('p');p.className='wrap fj-ai-note';p.style.cssText='margin-top:18px;margin-bottom:0;font-size:11px;line-height:1.5;color:var(--muted,#5f6259)!important;opacity:1';p.textContent='Hinweis: Einzelne Bilder und Grafiken auf dieser Website wurden mit KI erstellt.';f.appendChild(p)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ki);else ki();
  /* Helles Farbschema fuer die statischen Unterseiten (Startseite hat es bereits in index.html) */
  if(!document.getElementById('root')){
    document.documentElement.classList.add('fj-light');
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#ffffff');
    var L='html.fj-light ';
    var css=[
      L+'{--muted:#5f6259;--rule:#e3e5df}',
      L+'body{background:#fff;color:#20231f}',
      L+'main.wrap p,'+L+'main.wrap li{color:#33362f}',
      L+'.facts strong,'+L+'.quota{color:#20231f}',
      L+'.quota-bar{background:#e3e5df}',
      L+'.tile{background:#f3f4f1;border-color:#e3e5df}',
      L+'.tile.white{background:#fff;border-color:#e3e5df}',
      L+'.tile.dark{background:#606b55;border-color:#606b55;color:#fff}',
      L+'.tile.dark span,'+L+'.tile.dark p{color:#e0e8dc}',
      L+'.tags span{border-color:#c9cdc3}',
      L+'.deal{background:#fff}',
      L+'.btn{background:#606b55;color:#fff;border-color:#606b55}',
      L+'.btn:hover{background:var(--orange);color:#fff;border-color:var(--orange)}',
      L+'.btn.ghost{background:transparent;color:#20231f;border:1px solid #20231f80}',
      L+'.btn.ghost:hover{background:#606b55;color:#fff;border-color:#606b55}',
      L+'.back:hover{color:#606b55}',
      /* Anfrage-/Konfigurator-Bereich bleibt als olivgruener Block, wie auf der Startseite */
      L+'#anfrage{--muted:#e0e8dc;--rule:#ffffff47;background:#606b55;color:#fff}',
      L+'#anfrage .btn{background:#fff;color:#32483a;border-color:#fff}',
      L+'#anfrage .btn:hover{background:var(--orange);color:#fff;border-color:var(--orange)}',
      L+'#anfrage .msg.ok{color:#32483a}'
    ].join('');
    var s2=document.createElement('style');s2.id='fj-light-theme';s2.textContent=css;document.head.appendChild(s2);
  }

  /* ===== Pflege-Automatik (alle Seiten) ===== */
  /* 1) Texte vereinheitlichen: Ort nur Stuttgart, Anfahrt einheitlich 50 km / 1 EUR je km */
  var FIX=[
    [/GMBH · RENNINGEN/g,'GMBH · STUTTGART'],
    [/Anfahrt bis 25 km ab Renningen inklusive, danach 1,20 € je km\./g,'Anfahrt bis 50 km inklusive, danach 1 € je km.'],
    [/ ab Renningen inklusive/g,' inklusive']
  ];
  var fixText=function(root){
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;
    while(n=w.nextNode()){var v=n.nodeValue,o=v;for(var i=0;i<FIX.length;i++)v=v.replace(FIX[i][0],FIX[i][1]);if(v!==o)n.nodeValue=v}
  };
  /* 2) Vergangene Termine im Eventkalender automatisch ausblenden (bei Zeitraeumen zaehlt der letzte Tag) */
  var hidePast=function(){
    var t=new Date();t.setHours(0,0,0,0);
    document.querySelectorAll('.dates-list > div').forEach(function(row){
      var tm=row.querySelector('time[datetime]');if(!tm)return;
      var d=new Date(tm.getAttribute('datetime')+'T00:00:00');if(isNaN(d))return;
      var r=/^\s*(\d{1,2})\.?\s*[–-]\s*(\d{1,2})/.exec(tm.textContent||'');
      if(r&&Number(r[2])>=Number(r[1]))d.setDate(Number(r[2]));
      row.style.display=d<t?'none':'';
    });
  };
  /* 3) Rechtstexte: statt des eingebauten Kurz-Fensters immer die vollstaendigen Seiten oeffnen */
  var legal=function(){
    var dlg=document.querySelector('.legal-dialog');if(!dlg)return;
    var h=dlg.querySelector('[data-slot=dialog-title]');var title=h?h.textContent:'';
    location.href=/Impressum/i.test(title)?'/impressum':'/datenschutz';
  };
  /* 4) Tanz am Berg: Referenz auf /eventagentur, Foto auf /gluehwein, Nennung auf der Startseite */
  var IMG='/media/tanz-am-berg/';   // eigene Fotos, lokal ausgeliefert (vorher fehlende Dateien im Speicher)
  var tab=function(){
    var p=location.pathname;
    if(/^\/eventagentur/.test(p)&&!document.getElementById('referenz')){
      var anchor=document.getElementById('anfrage');if(!anchor)return;
      var s=document.createElement('section');s.id='referenz';
      s.innerHTML='<div class="wrap"><span class="label">Referenz · Oktober 2026</span><h2>Tanz am Berg<span class="op">.</span></h2>'
      +'<div class="two"><div><p class="lead">Ein Abend elektronische Musik am Bergwald Renningen – Konzept, Planung und Durchführung von feine jungs, in Kooperation mit der Stadt Renningen. DJs, Licht, zwei Bars und die Glühwein-Ape: alles aus einer Hand, bei freiem Eintritt.</p>'
      +'<div class="facts"><span><strong>6</strong> DJs</span><span><strong>3</strong> Ausschankstationen</span><span><strong>11–22 Uhr</strong> mit Kinderprogramm</span><span><strong>2027</strong> geht es weiter</span></div></div>'
      +'<div class="ref-grid"><img src="'+IMG+'dj.webp" alt="DJ-Set in der blau beleuchteten Bergwaldhalle" loading="lazy"><img src="'+IMG+'wald.webp" alt="Grün angestrahlte Bäume über den Gästen" loading="lazy"><img src="'+IMG+'gluehwein.webp" alt="Glühwein-Station an der Ape mit Lichterketten" loading="lazy" style="object-position:50% 40%"><img src="'+IMG+'bar.webp" alt="Bar mit Spritz, Gin und frischen Früchten am Nachmittag" loading="lazy" style="object-position:40% 50%"></div></div></div>';
      anchor.parentNode.insertBefore(s,anchor);
      var st2=document.createElement('style');st2.textContent='.ref-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ref-grid img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block;background:#e6e8e3}#referenz .facts{margin-top:26px}';document.head.appendChild(st2);
    }
    if(/^\/gluehwein/.test(p)&&!document.getElementById('gw-foto')){
      var a2=document.getElementById('angebot');if(!a2)return;
      var f=document.createElement('section');f.id='gw-foto';
      f.innerHTML='<div class="wrap"><figure style="margin:0"><img src="'+IMG+'gluehwein.webp" alt="Glühwein-Station an der Ape mit Lichterketten bei Tanz am Berg" loading="lazy" style="width:100%;aspect-ratio:16/10;object-fit:cover;object-position:50% 35%;display:block;background:#e6e8e3"><figcaption class="note" style="margin-top:12px">Unsere Glühwein-Ape im Einsatz · Tanz am Berg, Oktober 2026</figcaption></figure></div>';
      a2.parentNode.insertBefore(f,a2);
    }
    if(p==='/'||p===''){
      var refs=document.querySelector('.references');
      if(refs&&!refs.querySelector('[data-tab]')){var sp=document.createElement('span');sp.setAttribute('data-tab','1');sp.textContent='Tanz am Berg';refs.appendChild(sp)}
    }
  };
  var run=function(){fixText(document.body);hidePast();legal();tab()};
  var queued=false;
  var start=function(){
    run();
    new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;run()})}).observe(document.body,{childList:true,subtree:true,characterData:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
