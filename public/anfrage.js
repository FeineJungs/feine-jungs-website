/* feine jungs – „Anfrage starten" neben der Direktbuchung (Richtpreis ohne Sofortkauf-Rabatt).
   Erweitert window.fjCheckout (checkout.js): open() mit window.fjMode==='inquiry' öffnet die Anfrage. */
(function(){
if(window.fjAnfrage)return;window.fjAnfrage=1;
var API='https://yarzxemodteevfodhstl.supabase.co/functions/v1';
var eur=function(n){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:n%1?2:0}).format(n)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var deDate=function(d){var p=String(d).split('-');return p[2]+'.'+p[1]+'.'+p[0]};
var wday=function(d){return['So','Mo','Di','Mi','Do','Fr','Sa'][new Date(d+'T12:00:00').getDay()]};
var LABEL={wagyufirma:'Wagyu × Champagner (Firma)',barabend:'Bar-Abend',sektempfang:'Sektempfang',corporate:'Firmenevent',private:'Privates Fest',weihnacht:'Weihnachtsfeier',gluehwein:'Glühwein After Work',jga:'JGA',tasting:'Tasting',saturdays:'Saturdays'};
var PKG={tasting:'tasting',jga:'jga',corporate:'corporate',private:'private'};
var TEL='<a href="tel:+491777753688">0177 775 36 88</a>';

var css='.fjq{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;background:rgba(20,30,24,.6);overflow-y:auto;font-family:"DM Sans",Arial,sans-serif}'
+'.fjq *{box-sizing:border-box}.fjq-b{position:relative;width:100%;max-width:640px;background:#fff;color:#1e2a21;border-top:4px solid #f45d00;box-shadow:0 24px 60px rgba(0,0,0,.3);padding:34px 28px 28px;margin:auto 0}'
+'.fjq-x{position:absolute;top:10px;right:12px;background:none;border:0;font-size:28px;line-height:1;color:#647069;cursor:pointer;padding:6px}'
+'.fjq h2{font-family:"Instrument Sans",Arial,sans-serif;font-weight:500;font-size:32px;line-height:1.05;margin:0 0 8px;letter-spacing:-.02em;color:#1e2a21}.fjq h2 i{font-style:normal;color:#f45d00}'
+'.fjq .sum{font-size:14px;color:#647069;margin:0 0 22px}.fjq .sum b{color:#1e2a21}'
+'.fjq h3{font-size:10px;letter-spacing:.16em;font-weight:500;color:#647069;margin:22px 0 10px;text-transform:uppercase;font-family:"DM Sans",Arial,sans-serif}'
+'.fjq .g{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fjq .w{grid-column:1/-1}'
+'.fjq label.f{display:flex;flex-direction:column;gap:6px;font-size:10px;letter-spacing:.12em;font-weight:500;color:#647069;text-transform:uppercase;min-width:0}'
+'.fjq input[type=text],.fjq input[type=email],.fjq input[type=tel],.fjq textarea{width:100%;height:48px;padding:0 14px;border:1px solid #a9b5a6;background:#fff;color:#1e2a21;font:400 16px "DM Sans",Arial,sans-serif;border-radius:0;letter-spacing:0;text-transform:none}'
+'.fjq textarea{height:auto;min-height:76px;padding:12px 14px;resize:vertical}.fjq input:focus,.fjq textarea:focus{outline:none;border-color:#1e3b2a}'
+'.fjq .chk{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;margin:14px 0 0;cursor:pointer;color:#1e2a21;text-transform:none;letter-spacing:0}.fjq .chk input{width:18px;height:18px;margin:2px 0 0;flex:none;accent-color:#f45d00}.fjq .chk a{color:#31513a}'
+'.fjq .bill{background:#f4f6f2;padding:16px 18px;margin:24px 0 0}.fjq .ln{display:flex;justify-content:space-between;align-items:center;gap:14px;font-size:14px;padding:6px 0}.fjq .ln span{color:#3b4a40}.fjq .ln b{font-weight:500;white-space:nowrap}'
+'.fjq .ln.dc span{color:#15803d}.fjq .ln.tot{border-top:1px solid #d9dfda;margin-top:6px;padding-top:12px;font-size:16px}.fjq .ln.tot b{font-family:"Instrument Sans",Arial,sans-serif;font-size:26px;font-weight:500;color:#f45d00}.fjq .ln.muted span{color:#647069}'
+'.fjq .buy{background:none;border:0;padding:0;color:#f45d00;font:600 12px "DM Sans",Arial,sans-serif;letter-spacing:.08em;cursor:pointer;text-decoration:underline}'
+'.fjq .go{width:100%;min-height:56px;margin-top:18px;border:0;background:#1e3b2a;color:#fff;font:600 13px "DM Sans",Arial,sans-serif;letter-spacing:.12em;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0 22px}.fjq .go:disabled{opacity:.55;cursor:default}'
+'.fjq .msg{margin:14px 0 0;padding:12px 14px;font-size:14px;color:#8a2716;border:1px solid #e8b6aa}.fjq small{display:block;color:#647069;font-size:12px;line-height:1.5;margin-top:12px}'
+'.fjq .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}'
+'@media (max-width:560px){.fjq{padding:0}.fjq-b{padding:30px 18px 22px;min-height:100%;border-top-width:3px}.fjq .g{grid-template-columns:1fr}.fjq h2{font-size:28px}}';
var styled=false;function ensureCss(){if(styled)return;styled=true;var s=document.createElement('style');s.textContent=css;document.head.appendChild(s)}

var root=null,cfg=null,quote=null;
function $(id){return root.querySelector('#'+id)}
function val(id){var e=root&&$(id);return e?e.value.trim():''}
function close(){if(root){root.remove();root=null;document.documentElement.style.overflow=''}}
function showErr(t){$('qErr').innerHTML=t?'<p class="msg" role="alert">'+t+'</p>':''}

function inquire(c){
 ensureCss();close();if(window.fjCheckout)window.fjCheckout.close();cfg=c||{};quote=null;
 var k=cfg.config||{},ct=cfg.contact||{},firma=k.customer_type==='firma',title=LABEL[k.pkg]||'Event';
 root=document.createElement('div');root.className='fjq';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','fjqH');
 root.innerHTML='<div class="fjq-b"><button type="button" class="fjq-x" aria-label="Schließen">×</button><div id="qBody">'
 +'<h2 id="fjqH">Anfrage<i>.</i></h2><p class="sum"><b>'+esc(title)+'</b> · '+wday(k.date)+', '+deDate(k.date)+' · '+esc(k.time)+' Uhr · '+k.people+' Gäste</p>'
 +'<form id="qForm" novalidate><h3>Kontakt</h3><div class="g">'
 +(firma?'<label class="f w">Firma *<input type="text" id="qCompany" autocomplete="organization" required></label>':'')
 +'<label class="f">Vorname *<input type="text" id="qFirst" autocomplete="given-name" required></label><label class="f">Nachname *<input type="text" id="qLast" autocomplete="family-name" required></label>'
 +'<label class="f">E-Mail *<input type="email" id="qEmail" autocomplete="email" required></label><label class="f">Telefon *<input type="tel" id="qPhone" autocomplete="tel" required></label>'
 +'<label class="f w">Veranstaltungsort (optional)<input type="text" id="qPlace" placeholder="z. B. Firmengelände, 71272 Renningen"></label></div>'
 +'<h3>Wünsche &amp; Fragen (optional)</h3><textarea id="qMsg" rows="3" aria-label="Wünsche und Fragen" placeholder="Anlass, Ablauf, Fragen – alles, was hilft …"></textarea>'
 +'<div class="bill" id="qBill" aria-live="polite"><div class="ln muted"><span>Richtpreis wird berechnet …</span><b></b></div></div>'
 +'<label class="chk"><input type="checkbox" id="qPriv" required><span>Ich habe die <a href="/datenschutz" target="_blank" rel="noopener">Datenschutzhinweise</a> gelesen und bin einverstanden, dass ihr mich zu meiner Anfrage kontaktiert.</span></label>'
 +'<label class="hp" aria-hidden="true">Bitte leer lassen<input type="text" id="qHp" tabindex="-1" autocomplete="off"></label>'
 +'<div id="qErr"></div><button type="submit" class="go" id="qGo">UNVERBINDLICH ANFRAGEN</button>'
 +'<small>Wir melden uns innerhalb von 24 Stunden mit einem Angebot. Die Anfrage reserviert den Termin noch nicht – verbindlich wird er erst mit der Buchung.</small>'
 +'</form></div></div>';
 document.body.appendChild(root);document.documentElement.style.overflow='hidden';
 var set=function(id,v){var e=$(id);if(e&&v)e.value=v};
 set('qFirst',ct.first_name);set('qLast',ct.last_name);set('qEmail',ct.email);set('qPhone',ct.phone);set('qCompany',ct.company);set('qPlace',cfg.location);set('qMsg',cfg.message);
 root.addEventListener('click',function(e){
  if(e.target===root||e.target.closest('.fjq-x,[data-close]')){close();return}
  if(e.target.closest('[data-buy]')){var c2={config:cfg.config,contact:{first_name:val('qFirst'),last_name:val('qLast'),email:val('qEmail'),phone:val('qPhone'),company:val('qCompany'),vat_id:ct.vat_id||''},location:val('qPlace'),message:val('qMsg'),mode:'buy'};close();window.fjCheckout&&window.fjCheckout.open(c2)}
 });
 root.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
 $('qForm').addEventListener('submit',send);
 if(k.pkg==='wagyufirma'){$('qBill').innerHTML='<div class="ln"><span>Preis</span><b>individuelles Angebot</b></div><div class="ln muted"><span>Wir kalkulieren passend zu Gästezahl und Termin und melden uns innerhalb von 24 Stunden.</span><b></b></div>'}else fetch(API+'/service-quote'+(k.pkg==='barabend'||k.pkg==='sektempfang'?'-v2':''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({config:k})}).then(function(r){return r.json()}).then(function(j){
  if(!root)return;var b=$('qBill');
  if(!j.ok){b.innerHTML='<div class="ln muted"><span>Richtpreis gerade nicht abrufbar – wir nennen ihn euch im Angebot.</span><b></b></div>';return}
  quote=j;var h='';j.lines.forEach(function(l){h+='<div class="ln"><span>'+esc(l.label)+'</span><b>'+eur(l.amount)+'</b></div>'});
  h+='<div class="ln tot"><span>Richtpreis inkl. MwSt. <span style="font-size:12px;color:#647069">(zzgl. Anfahrt über 30 km)</span></span><b>'+eur(j.subtotal)+'</b></div>';
  var lo=(k.pkg==='corporate'||k.pkg==='weihnacht')&&j.subtotal<2000;if(lo)h+='<div class="ln muted" style="margin-top:6px"><span>Online buchbar ab 2.000 € Auftragswert. Für kleinere Runden bekommt ihr von uns ein individuelles Angebot.</span><b></b></div>';if(!lo&&j.discount&&j.discount.amount>0)h+='<div class="ln dc" style="margin-top:6px"><span>Direkt gebucht nur '+eur(j.service_total)+' ('+esc(j.discount.label)+')</span><b><button type="button" class="buy" data-buy>DIREKT BUCHEN</button></b></div>';
  b.innerHTML=h}).catch(function(){if(root)$('qBill').innerHTML='<div class="ln muted"><span>Richtpreis gerade nicht abrufbar.</span><b></b></div>'});
 setTimeout(function(){try{root.querySelector('input[required]').focus({preventScroll:true})}catch(e){}},50);
}

function send(e){
 e.preventDefault();showErr('');var f=$('qForm');if($('qHp').value)return;
 if(!f.checkValidity()){f.reportValidity();return}
 var k=cfg.config||{},firma=k.customer_type==='firma',lab=LABEL[k.pkg]||'Event',occ=k.occasion&&k.occasion!==lab?lab+' · '+k.occasion:lab;
 var ex=[];if(k.drinks)ex.push('Getränkepauschale');if(k.tasting_champagne)ex.push('Champagner-Tasting');if(k.jga_champagne)ex.push('Champagner');if(k.oysters)ex.push(k.oysters+' Austern');if(k.punsch)ex.push('Kinderpunsch');
 var msg=['Format: '+occ+' · '+deDate(k.date)+' · '+k.time+' Uhr · '+k.people+' Gäste'+(k.duration&&k.pkg!=='gluehwein'&&k.pkg!=='wagyufirma'?' · '+k.duration+' Std'+(k.extra_hours?' (+'+k.extra_hours+')':''):''),ex.length?'Extras: '+ex.join(', '):'',val('qPlace')?'Veranstaltungsort: '+val('qPlace'):'',val('qMsg')?'\n'+val('qMsg'):''].filter(Boolean).join('\n');
 var go=$('qGo');go.disabled=true;go.textContent='WIRD GESENDET …';
 var body={contact:{name:val('qFirst')+' '+val('qLast'),email:val('qEmail'),phone:val('qPhone'),company:val('qCompany'),message:msg},
  config:{package:PKG[k.pkg]||(firma?'corporate':'private'),duration:k.duration||'1-3',people:k.people,extra_hours:k.extra_hours||0,preferred_date:k.date,preferred_time:k.time,estimated_price:quote?quote.subtotal:null,occasion:occ},honeypot:''};
 fetch(API+'/public-inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})}).then(function(x){
  if(!x.ok||!x.j.ok)throw new Error(x.j.error||'fail');
  $('qBody').innerHTML='<p class="sum" style="letter-spacing:.16em;font-size:10px;margin:0 0 10px">ANFRAGE '+esc(x.j.event_number||'')+'</p><h2>Danke für eure Anfrage<i>.</i></h2><p style="font-size:15px;line-height:1.55">Wir haben alles bekommen und melden uns innerhalb von 24 Stunden mit einem Angebot. Eine Bestätigung liegt in eurem Postfach.</p><button type="button" class="go" data-close>SCHLIESSEN</button>';
 }).catch(function(err){go.disabled=false;go.textContent='UNVERBINDLICH ANFRAGEN';var m=String(err&&err.message||'');
  showErr(m==='too_many_requests'?'Zu viele Anfragen – bitte später nochmal oder ruft uns an: '+TEL+'.':m==='invalid_email'?'Bitte die E-Mail-Adresse prüfen.':'Das hat noch nicht geklappt. Bitte nochmal versuchen oder ruft uns an: '+TEL+'.')});
}

/* window.fjCheckout.open um den Anfrage-Modus erweitern */
function patch(){
 var fc=window.fjCheckout;if(!fc||fc.__inq)return;
 var orig=fc.open;
 fc.open=function(c){var m=(c&&c.mode)||window.fjMode||'buy';window.fjMode='';if(m==='inquiry')return inquire(c);return orig(c)};
 fc.inquire=inquire;fc.__inq=1;
}
patch();

/* Statische Seiten /weihnachtsfeier und /gluehwein: zweiter Button, Anfrage abfangen */
function hookStatic(){
 var f=document.getElementById('wf'),send=document.getElementById('send');if(!f||!send||f.__fjq)return;f.__fjq=1;
 var gw=/gluehwein|afterwork/.test(location.pathname)||!!document.getElementById('punsch');
 var g=function(id){return document.getElementById(id)};
 var sel=function(grp){var b=f.querySelector('[data-group="'+grp+'"] .selected');return b?b.getAttribute('data-value'):null};
 if(send.firstChild&&send.firstChild.nodeType===3)send.firstChild.textContent='Jetzt buchen & sparen ';
 send.addEventListener('click',function(){window.fjMode='buy'});
 var iq=document.createElement('button');iq.type='submit';iq.id='fjInq';iq.className=send.className;iq.innerHTML='Anfrage starten <span aria-hidden="true">→</span>';
 iq.style.cssText='width:100%;margin-top:10px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);cursor:pointer';
 iq.addEventListener('click',function(){window.fjMode='inquiry'});
 send.insertAdjacentElement('afterend',iq);
 var mg=g('msg'),note=f.querySelector('.note');
 if(mg)iq.insertAdjacentElement('afterend',mg);
 if(note){note.textContent+=' Unverbindliche Anfrage: Richtpreis ohne Rabatt.';(mg||iq).insertAdjacentElement('afterend',note)}
 window.addEventListener('submit',function(e){
  if(e.target!==f||window.fjMode!=='inquiry')return;
  if(g('hp')&&g('hp').value)return;
  if(!g('date').value||!g('time').value||!f.checkValidity()){window.fjMode='';return}
  e.preventDefault();e.stopImmediatePropagation();window.fjMode='';
  var type=sel('type')||'firma',v=function(id){var x=g(id);return x?x.value.trim():''},people=Number(v('people'))||0;
  var config=gw?{pkg:'gluehwein',customer_type:type,people:Math.min(500,Math.max(20,people||20)),date:v('date'),time:v('time'),punsch:!!(g('punsch')&&g('punsch').checked),occasion:'Glühwein After Work'}
   :{pkg:'weihnacht',customer_type:type,duration:sel('duration')||'1-3',extra_hours:(sel('duration')==='8+')?Math.max(1,Number(v('extra'))||1):0,people:Math.min(500,Math.max(8,people||8)),date:v('date'),time:v('time'),drinks:!!(g('drinks')&&g('drinks').checked),occasion:'Weihnachtsfeier'};
  inquire({config:config,contact:{first_name:v('firstName'),last_name:v('lastName'),email:v('email'),phone:v('phone'),company:type==='firma'?v('company'):''},location:v('location'),message:v('message')});
 },true);
}
function init(){patch();hookStatic()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
