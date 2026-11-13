/* feine jungs – Kasse für Direktbuchungen (Events, Weihnachtsfeier, Glühwein After Work …)
   window.fjCheckout.open({config, contact, message}) öffnet die Kasse.
   Hängt sich außerdem an die Formulare auf /weihnachtsfeier und /gluehwein und zeigt nach der
   Rückkehr von Mollie (?buchung=…&ref=…) die Buchungsbestätigung. */
(function(){
if(window.fjCheckout)return;
var API='https://yarzxemodteevfodhstl.supabase.co/functions/v1';
var eur=function(n){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:n%1?2:0}).format(n)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var deDate=function(d){var p=String(d).split('-');return p[2]+'.'+p[1]+'.'+p[0]};
var wday=function(d){return['So','Mo','Di','Mi','Do','Fr','Sa'][new Date(d+'T12:00:00').getDay()]};
var LABEL={corporate:'Firmenevent',private:'Privates Fest',weihnacht:'Weihnachtsfeier',gluehwein:'Glühwein After Work',jga:'JGA',tasting:'Tasting',saturdays:'Saturdays',barabend:'Bar-Abend',sektempfang:'Sektempfang'};function fjV2(){var k=(cfg&&cfg.config)||{};return k.pkg==='barabend'||k.pkg==='sektempfang'?'-v2':''}var fjUnused={};
var ERR={termin_belegt:'Dieser Termin ist leider gerade vergeben – bitte wählt einen anderen Tag.',dezember_ausgebucht:'Im Dezember sind leider alle Weihnachtsfeier-Termine vergeben.',vorlauf_zu_kurz:'Für diesen Termin ist der Vorlauf zu kurz – bitte einen späteren Tag wählen.',wochentag_nicht_moeglich:'An diesem Wochentag ist das Format nicht buchbar.',uhrzeit_nicht_moeglich:'Diese Uhrzeit ist für das Format nicht buchbar.',gaestezahl_ungueltig:'Bitte prüft die Gästezahl.',gutschein_ungueltig:'Der Gutschein-Code ist ungültig oder bereits eingelöst.',adresse_unbekannt:'Wir finden die Adresse des Veranstaltungsorts nicht – bitte Straße, PLZ und Ort prüfen.',anschrift_unvollstaendig:'Bitte die Anschrift vollständig ausfüllen.',veranstaltungsort_unvollstaendig:'Bitte die Adresse des Veranstaltungsorts vollständig ausfüllen.',kontakt_unvollstaendig:'Bitte Name, E-Mail und Telefon ausfüllen.',firma_fehlt:'Bitte den Firmennamen angeben.',too_many_requests:'Zu viele Versuche – bitte später nochmal oder ruft uns an.',zahlung_nicht_verfuegbar:'Die Bezahlseite ist gerade nicht erreichbar – bitte gleich nochmal versuchen.'};

var css='.fjk{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;background:rgba(20,30,24,.6);overflow-y:auto;font-family:"DM Sans",Arial,sans-serif;-webkit-overflow-scrolling:touch}'
+'.fjk *{box-sizing:border-box}.fjk-b{position:relative;width:100%;max-width:640px;background:#fff;color:#1e2a21;border-top:4px solid #f45d00;box-shadow:0 24px 60px rgba(0,0,0,.3);padding:34px 28px 28px;margin:auto 0}'
+'.fjk-x{position:absolute;top:10px;right:12px;background:none;border:0;font-size:28px;line-height:1;color:#647069;cursor:pointer;padding:6px}'
+'.fjk h2{font-family:"Instrument Sans",Arial,sans-serif;font-weight:500;font-size:32px;line-height:1.05;margin:0 0 8px;letter-spacing:-.02em}.fjk h2 i{font-style:normal;color:#f45d00}'
+'.fjk .sum{font-size:14px;color:#647069;margin:0 0 22px}.fjk .sum b{color:#1e2a21}'
+'.fjk h3{font-size:10px;letter-spacing:.16em;font-weight:500;color:#647069;margin:22px 0 10px;text-transform:uppercase}'
+'.fjk .g{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fjk .g .w{grid-column:1/-1}.fjk .g3{grid-template-columns:120px 1fr}'
+'.fjk label.f{display:flex;flex-direction:column;gap:6px;font-size:10px;letter-spacing:.12em;font-weight:500;color:#647069;text-transform:uppercase;min-width:0}'
+'.fjk input[type=text],.fjk input[type=email],.fjk input[type=tel],.fjk textarea{width:100%;height:48px;padding:0 14px;border:1px solid #a9b5a6;background:#fff;color:#1e2a21;font:400 16px "DM Sans",Arial,sans-serif;border-radius:0;letter-spacing:0;text-transform:none}'
+'.fjk textarea{height:auto;min-height:76px;padding:12px 14px;resize:vertical}.fjk input:focus,.fjk textarea:focus{outline:none;border-color:#1e3b2a}'
+'.fjk .chk{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;margin:14px 0 0;cursor:pointer}.fjk .chk input{width:18px;height:18px;margin:2px 0 0;flex:none;accent-color:#f45d00}.fjk .chk a{color:#31513a}'
+'.fjk .vc{display:flex;gap:8px}.fjk .vc input{flex:1;min-width:0;text-transform:uppercase}.fjk .vc button{height:48px;padding:0 16px;border:0;background:#1e3b2a;color:#fff;font:500 11px "DM Sans",Arial,sans-serif;letter-spacing:.12em;cursor:pointer}'
+'.fjk .ok{color:#15803d;font-size:13px;margin:6px 0 0}.fjk .er{color:#8a2716;font-size:13px;margin:6px 0 0}'
+'.fjk .bill{background:#f4f6f2;padding:16px 18px;margin:24px 0 0}.fjk .ln{display:flex;justify-content:space-between;gap:14px;font-size:14px;padding:6px 0}.fjk .ln span{color:#3b4a40}.fjk .ln b{font-weight:500;white-space:nowrap}'
+'.fjk .ln.dc b,.fjk .ln.dc span{color:#15803d}.fjk .ln.tot{border-top:1px solid #d9dfda;margin-top:6px;padding-top:12px;font-size:16px}.fjk .ln.tot b{font-family:"Instrument Sans",Arial,sans-serif;font-size:26px;font-weight:500;color:#f45d00}.fjk .ln.muted span,.fjk .ln.muted b{color:#647069;font-weight:400}'
+'.fjk .go{width:100%;min-height:56px;margin-top:18px;border:0;background:#f45d00;color:#fff;font:600 13px "DM Sans",Arial,sans-serif;letter-spacing:.12em;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:0 22px}.fjk .go:disabled{opacity:.55;cursor:default}'
+'.fjk .msg{margin:14px 0 0;padding:12px 14px;font-size:14px;color:#8a2716;border:1px solid #e8b6aa}.fjk small{display:block;color:#647069;font-size:12px;line-height:1.5;margin-top:12px}'
+'.fjk .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}'
+'.fjk.fjk-r{padding:16px;align-items:center}.fjk.fjk-r .fjk-b{min-height:0}'
+'@media (max-width:560px){.fjk{padding:0}.fjk-b{padding:30px 18px 22px;min-height:100%;border-top-width:3px}.fjk .g{grid-template-columns:1fr}.fjk .g3{grid-template-columns:110px 1fr}.fjk h2{font-size:28px}.fjk.fjk-r{padding:16px}.fjk.fjk-r .fjk-b{min-height:0}}';

var st=null;function ensureCss(){if(st)return;st=document.createElement('style');st.textContent=css;document.head.appendChild(st)}

var root=null,cfg=null,quote=null,voucher=null,qTimer=null,qSeq=0;
function $(id){return root.querySelector('#'+id)}
function val(id){var e=$(id);return e?e.value.trim():''}
function addrOf(p){return{street:val(p+'Street'),zip:val(p+'Zip'),city:val(p+'City')}}
function complete(a){return a.street.length>=3&&/^\d{4,5}$/.test(a.zip)&&a.city.length>=2}
function venueAddr(){return $('kDiff').checked?addrOf('kV'):addrOf('kB')}
function close(){if(root){root.remove();root=null;document.documentElement.style.overflow=''}}

function open(c){
 ensureCss();close();cfg=c||{};quote=null;voucher=null;
 var k=cfg.config||{},ct=cfg.contact||{},firma=k.customer_type==='firma';
 var title=LABEL[k.pkg]||'Event';
 root=document.createElement('div');root.className='fjk';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','fjkH');
 root.innerHTML='<div class="fjk-b"><button type="button" class="fjk-x" aria-label="Schließen">×</button>'
 +'<h2 id="fjkH">Kasse<i>.</i></h2><p class="sum"><b>'+esc(title)+'</b> · '+wday(k.date)+', '+deDate(k.date)+' · '+esc(k.time)+' Uhr · '+k.people+' Gäste</p>'
 +'<form id="kForm" novalidate>'
 +'<h3>Rechnungsanschrift</h3><div class="g">'
 +(firma?'<label class="f">Firma *<input type="text" id="kCompany" autocomplete="organization" required></label><label class="f">USt-IdNr. (optional)<input type="text" id="kVat"></label>':'')
 +'<label class="f">Vorname *<input type="text" id="kFirst" autocomplete="given-name" required></label><label class="f">Nachname *<input type="text" id="kLast" autocomplete="family-name" required></label>'
 +'<label class="f">E-Mail *<input type="email" id="kEmail" autocomplete="email" required></label><label class="f">Telefon *<input type="tel" id="kPhone" autocomplete="tel" required></label>'
 +'<label class="f w">Straße &amp; Hausnummer *<input type="text" id="kBStreet" autocomplete="street-address" required></label></div>'
 +'<div class="g g3" style="margin-top:10px"><label class="f">PLZ *<input type="text" id="kBZip" inputmode="numeric" autocomplete="postal-code" maxlength="5" required></label><label class="f">Ort *<input type="text" id="kBCity" autocomplete="address-level2" required></label></div>'
 +'<h3>Veranstaltungsort</h3><label class="chk"><input type="checkbox" id="kDiff"><span>Die Veranstaltung findet an einer anderen Adresse statt (z. B. Location, Büro, Halle)</span></label>'
 +'<div id="kVenue" hidden><div class="g" style="margin-top:12px"><label class="f w">Name der Location (optional)<input type="text" id="kVName" placeholder="z. B. Firmengelände, Vereinsheim"></label><label class="f w">Straße &amp; Hausnummer *<input type="text" id="kVStreet"></label></div>'
 +'<div class="g g3" style="margin-top:10px"><label class="f">PLZ *<input type="text" id="kVZip" inputmode="numeric" maxlength="5"></label><label class="f">Ort *<input type="text" id="kVCity"></label></div></div>'
 +'<h3>Hinweise (optional)</h3><label class="f w"><span style="position:absolute;left:-9999px">Hinweise</span><textarea id="kMsg" rows="3" placeholder="Stellplatz, Strom, Zufahrt, Anlass – alles, was hilft …"></textarea></label>'
 +'<h3>Gutschein</h3><div class="vc"><input type="text" id="kCode" placeholder="FJ-XXXX-XXXX" autocomplete="off" aria-label="Gutschein-Code"><button type="button" id="kCodeBtn">EINLÖSEN</button></div><div id="kCodeMsg"></div>'
 +'<div class="bill" id="kBill" aria-live="polite"></div>'
 +'<label class="chk"><input type="checkbox" id="kAgb" required><span>Ich buche verbindlich und akzeptiere die <a href="/agb" target="_blank" rel="noopener">AGB</a> inkl. Stornobedingungen (bis 30 Tage vorher kostenfrei, 29–14 Tage vorher 50 %, ab 13 Tagen 100 %) und habe die <a href="/datenschutz" target="_blank" rel="noopener">Datenschutzhinweise</a> gelesen.</span></label>'
 +'<label class="hp" aria-hidden="true">Bitte leer lassen<input type="text" id="kHp" tabindex="-1" autocomplete="off"></label>'
 +'<div id="kErr"></div><button type="submit" class="go" id="kGo"><span>ZAHLUNGSPFLICHTIG BUCHEN</span><span id="kGoAmt"></span></button>'
 +'<small>Sichere Zahlung per Karte, Klarna oder Überweisung über Mollie. Verbindlich wird die Buchung mit Zahlungseingang; die Bestätigung kommt per E-Mail.</small>'
 +'</form></div>';
 document.body.appendChild(root);document.documentElement.style.overflow='hidden';
 var set=function(id,v){var e=$(id);if(e&&v)e.value=v};
 set('kFirst',ct.first_name);set('kLast',ct.last_name);set('kEmail',ct.email);set('kPhone',ct.phone);set('kCompany',ct.company);set('kVat',ct.vat_id);
 set('kMsg',[cfg.location?'Veranstaltungsort laut Formular: '+cfg.location:'',cfg.message||''].filter(Boolean).join('\n'));
 root.addEventListener('click',function(e){if(e.target===root||e.target.closest('.fjk-x'))close()});
 root.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
 $('kDiff').addEventListener('change',function(){$('kVenue').hidden=!this.checked;['kVStreet','kVZip','kVCity'].forEach(function(i){$(i).required=$('kDiff').checked});schedule()});
 ['kBStreet','kBZip','kBCity','kVStreet','kVZip','kVCity'].forEach(function(i){$(i).addEventListener('input',schedule);$(i).addEventListener('change',schedule)});
 $('kCode').addEventListener('input',function(){voucher=null;$('kCodeMsg').innerHTML='';render()});
 $('kCode').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();checkCode()}});
 $('kCodeBtn').addEventListener('click',checkCode);
 $('kForm').addEventListener('submit',submit);
 render();fetchQuote();
 setTimeout(function(){var f=root&&root.querySelector('input:not([type=checkbox]):placeholder-shown, input[required]');try{(root.querySelector('#kBStreet')||f).focus({preventScroll:true})}catch(e){}},50);
}

function schedule(){clearTimeout(qTimer);qTimer=setTimeout(fetchQuote,650)}
function fetchQuote(){
 var a=venueAddr(),body={config:cfg.config};if(complete(a))body.address=a;
 var seq=++qSeq;quote&&(quote.loading=!!body.address);render();
 fetch(API+'/service-quote'+fjV2(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()}).then(function(j){if(seq!==qSeq||!root)return;quote=j.ok?j:{error:j.error||'server_error'};quote.hasAddr=!!body.address;render()}).catch(function(){if(seq===qSeq&&root){quote={error:'netz'};render()}});
}
function checkCode(){
 var c=$('kCode').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(c.length===8)c='FJ'+c;if(c.length===10)c=c.slice(0,2)+'-'+c.slice(2,6)+'-'+c.slice(6);$('kCode').value=c;
 var m=$('kCodeMsg');voucher=null;
 if(!/^FJ-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)){m.innerHTML='<p class="er">Bitte den Code im Format FJ-XXXX-XXXX eingeben.</p>';render();return}
 $('kCodeBtn').disabled=true;m.innerHTML='<p class="ok" style="color:#647069">Prüfe …</p>';
 fetch(API+'/voucher-redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'check',code:c})}).then(function(r){return r.json()}).then(function(j){
  if(!root)return;$('kCodeBtn').disabled=false;
  if(j.ok&&j.usable){voucher={code:j.code,balance:Number(j.balance)};m.innerHTML=''}
  else m.innerHTML='<p class="er">'+(j.ok?(j.expired?'Dieser Gutschein ist abgelaufen.':j.balance<=0?'Dieser Gutschein ist bereits eingelöst.':'Dieser Gutschein ist noch nicht aktiv.'):j.error==='too_many_requests'?'Zu viele Versuche – bitte später nochmal.':'Diesen Gutschein-Code kennen wir leider nicht.')+'</p>';
  render()}).catch(function(){if(root){$('kCodeBtn').disabled=false;m.innerHTML='<p class="er">Prüfung gerade nicht möglich.</p>'}});
}
function amounts(){
 if(!quote||quote.error||quote.lines==null)return null;
 var travel=quote.travel,total=quote.service_total+(travel?travel.fee:0),v=voucher?Math.min(voucher.balance,total):0;
 return{total:total,v:v,pay:Math.round((total-v)*100)/100,travel:travel};
}
function render(){
 if(!root)return;var b=$('kBill'),a=amounts(),h='';
 if(!quote){b.innerHTML='<div class="ln muted"><span>Preis wird berechnet …</span><b></b></div>';$('kGoAmt').textContent='';return}
 if(quote.error){b.innerHTML='<div class="ln muted"><span>'+(ERR[quote.error]||'Preis gerade nicht abrufbar – bitte später nochmal oder ruft uns an: 0177 775 36 88.')+'</span><b></b></div>';$('kGoAmt').textContent='';return}
 quote.lines.forEach(function(l){h+='<div class="ln"><span>'+esc(l.label)+'</span><b>'+eur(l.amount)+'</b></div>'});
 if(quote.discount&&quote.discount.amount)h+='<div class="ln dc"><span>'+esc(quote.discount.label)+'</span><b>−'+eur(quote.discount.amount)+'</b></div>';
 var tr=a.travel,addrErr=quote.address_error;
 h+='<div class="ln'+(tr?'':' muted')+'"><span>Anfahrt'+(tr?' ('+String(tr.km).replace('.',',')+' km einfach · 50 km inkl.)':'')+'</span><b>'+(quote.loading?'berechne …':tr?(tr.fee?eur(tr.fee):'inklusive'):addrErr==='adresse_unbekannt'?'Adresse prüfen':'nach Eingabe der Adresse')+'</b></div>';
 if(addrErr==='adresse_unbekannt')h+='<p class="er" style="margin:0 0 6px">Wir finden die Adresse nicht – bitte Straße, PLZ und Ort prüfen.</p>';
 h+='<div class="ln tot"><span>Gesamt inkl. MwSt.'+(tr?'':' <span style="font-size:12px;color:#647069">(zzgl. Anfahrt über 50 km)</span>')+'</span><b>'+eur(a.total)+'</b></div>';
 if(a.v)h+='<div class="ln dc"><span>Gutschein '+esc(voucher.code)+'</span><b>−'+eur(a.v)+'</b></div><div class="ln tot"><span>Zu zahlen</span><b>'+eur(a.pay)+'</b></div>';
 b.innerHTML=h;$('kGoAmt').textContent=tr?(a.pay<=0?'MIT GUTSCHEIN':eur(a.pay)):'';
}
function showErr(t){$('kErr').innerHTML=t?'<p class="msg" role="alert">'+t+'</p>':''}
function submit(e){
 e.preventDefault();showErr('');var f=$('kForm');
 if($('kHp').value)return;
 if(!f.checkValidity()){f.reportValidity();return}
 var bill=addrOf('kB');if(!complete(bill)){showErr('Bitte die Anschrift vollständig ausfüllen (PLZ fünfstellig).');return}
 if($('kDiff').checked&&!complete(addrOf('kV'))){showErr('Bitte die Adresse des Veranstaltungsorts vollständig ausfüllen.');return}
 var a=amounts();
 if(cfg.config&&cfg.config.pkg==='corporate'&&quote&&quote.subtotal<2000){showErr('Das Firmenevent ist online ab 2.000 € Auftragswert buchbar. Für kleinere Runden schickt uns bitte eine Anfrage – wir machen euch ein Angebot.');return}
 if(!a||!a.travel){if(quote&&quote.address_error==='adresse_unbekannt'){showErr(ERR.adresse_unbekannt);return}fetchQuote();showErr('Einen Moment – die Anfahrt wird noch berechnet. Bitte gleich nochmal klicken.');return}
 var go=$('kGo');go.disabled=true;go.firstChild.textContent='WIRD VORBEREITET …';
 var body={config:cfg.config,contact:{first_name:val('kFirst'),last_name:val('kLast'),email:val('kEmail'),phone:val('kPhone'),company:val('kCompany'),vat_id:val('kVat')},billing:bill,
  venue:{differs:$('kDiff').checked,name:val('kVName'),street:val('kVStreet'),zip:val('kVZip'),city:val('kVCity')},message:val('kMsg'),voucher_code:voucher?voucher.code:'',agb:$('kAgb').checked,honeypot:''};
 fetch(API+'/public-booking'+fjV2(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})}).then(function(x){
  var j=x.j||{};if(!x.ok||!j.ok)throw new Error(j.error||'fail');
  if(j.payment_url){go.firstChild.textContent='WEITER ZUR ZAHLUNG …';window.location.assign(j.payment_url);return}
  window.location.assign('/?buchung='+encodeURIComponent(j.order_number)+'&ref='+j.ref);
 }).catch(function(err){go.disabled=false;go.firstChild.textContent='ZAHLUNGSPFLICHTIG BUCHEN';var m=String(err&&err.message||'');if(m==='gutschein_ungueltig'){voucher=null;render()}showErr(ERR[m]||'Das hat noch nicht geklappt. Bitte nochmal versuchen oder ruft uns an: <a href="tel:+491777753688">0177 775 36 88</a>.')});
}
window.fjCheckout={open:open,close:close};

/* ── Statische Seiten /weihnachtsfeier und /gluehwein ── */
function hookStatic(){
 var f=document.getElementById('wf');if(!f||f.__fj)return;f.__fj=1;
 var gw=/gluehwein|afterwork/.test(location.pathname)||!!document.getElementById('punsch');
 var g=function(id){return document.getElementById(id)};
 var sel=function(grp){var b=f.querySelector('[data-group="'+grp+'"] .selected');return b?b.getAttribute('data-value'):null};
 var send=g('send');if(send&&send.firstChild&&send.firstChild.nodeType===3)send.firstChild.textContent='Weiter zur Kasse ';
 var note=f.querySelector('.note');if(note)note.textContent=gw?'Direkt buchbar mit 10 % Sofortkauf-Rabatt. Anfahrt bis 50 km inklusive, danach 1 € je km – wird in der Kasse berechnet.':'Direkt buchbar: −10 % Sofortkauf-Rabatt oder bis 31.10. −20 % Frühbucher auf den Grundpreis – es gilt der höhere Rabatt. Anfahrt bis 50 km inklusive, danach 1 € je km.';
 var lg=f.querySelector('legend');if(lg&&/Anfrage als/.test(lg.textContent))lg.textContent='Buchung als';
 var tl=f.querySelector('.card .total span');if(tl)tl.textContent='Preis inkl. MwSt.';
 var card=f.querySelector('.card');if(card&&!card.querySelector('.fj-sk')){var p=document.createElement('p');p.className='fj-sk';p.style.cssText='margin:12px 0 0;padding:10px 12px;background:rgba(244,93,0,.12);color:inherit;font-size:13px;line-height:1.5';p.innerHTML='<strong style="color:#f45d00">−10 % bei Sofortbuchung.</strong> In der Kasse gebt ihr Anschrift und Veranstaltungsort an und bezahlt direkt online.';card.appendChild(p)}
 // Button orange unter den Preis in der Karte, Rabatt in der Karte anzeigen
 if(card&&send){var tot=card.querySelector('.total');send.style.cssText='width:100%;margin-top:18px;background:#f45d00;color:#fff;border:0;cursor:pointer';(tot||card).insertAdjacentElement('afterend',send);var mg=g('msg');if(mg)send.insertAdjacentElement('afterend',mg);if(note){note.style.cssText='color:#e0e8dc;font-size:13px;margin:12px 0 0';(mg||send).insertAdjacentElement('afterend',note)}var sk=card.querySelector('.fj-sk');if(sk)sk.remove()}
 var DUR={'1-3':27,'4-5':40,'6-8':60,'8+':60},BF={'1-3':490,'4-5':690,'6-8':890,'8+':890},BP={'1-3':390,'4-5':490,'6-8':590,'8+':590},PROMO=new Date()<=new Date('2026-10-31T23:59:59+01:00');
 var fmt0=function(n){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n)};
 function recalc(){var pe=Number((g('people')||{}).value)||0,sub,promo=0,base=0;
  if(gw){pe=Math.min(500,Math.max(20,pe||20));sub=290+12*pe}
  else{var ty=sel('type')||'firma',du=sel('duration')||'1-3',ex=du==='8+'?Math.max(1,Number((g('extra')||{}).value)||1):0;pe=Math.min(500,Math.max(8,pe||8));base=(ty==='firma'?BF:BP)[du];sub=base+ex*120+((g('drinks')||{}).checked?pe*DUR[du]:0);promo=PROMO?Math.round(base*.2):0;
   if(Math.round(sub*.1)>=promo&&g('sBase')){g('sBase').textContent=fmt0(base+ex*120);if(g('sBaseLabel'))g('sBaseLabel').textContent='Grundpreis'}}
  var sof=Math.round(sub*.1),usePromo=promo>sof,disc=usePromo?promo:sof;
  var pr=card&&card.querySelector('.price'),row=g('fjDiscRow');
  if(pr&&!row){row=document.createElement('div');row.id='fjDiscRow';row.innerHTML='<span></span><strong></strong>';pr.appendChild(row)}
  if(row){row.style.display=usePromo?'none':'';row.firstChild.textContent='Sofortkauf-Rabatt −10 %';row.lastChild.textContent='−'+fmt0(sof)}
  var st=g('sTotal');if(st)st.textContent=fmt0(sub-disc)}
 recalc();f.addEventListener('input',function(){setTimeout(recalc,0)});f.addEventListener('click',function(){setTimeout(recalc,0)});f.addEventListener('change',function(){setTimeout(recalc,0)});
 f.querySelectorAll('.cal-hint').forEach(function(h){h.textContent=h.textContent.replace('Ein Wunschtermin ist noch keine bestätigte Buchung.','Verbindlich wird der Termin mit der Zahlung.').replace('Anfragen mit mindestens','Buchbar mit mindestens').replace(' Längere Zeiten auf Anfrage.','')});
 document.addEventListener('submit',function(e){
  if(e.target!==f)return;
  if(g('hp')&&g('hp').value)return;
  if(!g('date').value||!g('time').value||!f.checkValidity())return; // Original-Handler zeigt die Hinweise
  e.preventDefault();e.stopImmediatePropagation();
  var type=sel('type')||'firma',v=function(id){var x=g(id);return x?x.value.trim():''};
  var people=Number(v('people'))||0;
  var config=gw?{pkg:'gluehwein',customer_type:type,people:Math.min(500,Math.max(20,people||20)),date:v('date'),time:v('time'),punsch:!!(g('punsch')&&g('punsch').checked),occasion:'Glühwein After Work'}
   :{pkg:'weihnacht',customer_type:type,duration:sel('duration')||'1-3',extra_hours:(sel('duration')==='8+')?Math.max(1,Number(v('extra'))||1):0,people:Math.min(500,Math.max(8,people||8)),date:v('date'),time:v('time'),drinks:!!(g('drinks')&&g('drinks').checked),occasion:'Weihnachtsfeier'};
  open({config:config,contact:{first_name:v('firstName'),last_name:v('lastName'),email:v('email'),phone:v('phone'),company:type==='firma'?v('company'):''},location:v('location'),message:v('message')});
 },true);
}

/* ── Rückkehr von Mollie: ?buchung=…&ref=… ── */
function returnPopup(){
 var q=new URLSearchParams(location.search),nr=q.get('buchung'),ref=q.get('ref');if(!nr||!ref)return;
 try{history.replaceState(null,'',location.pathname+location.hash)}catch(e){}
 try{sessionStorage.setItem('fj-promo-xmas26','1')}catch(e){}
 var kp=function(){document.querySelectorAll('.fj-pr-bg').forEach(function(x){x.remove()})};kp();var kpi=setInterval(kp,500);setTimeout(function(){clearInterval(kpi)},15000);
 ensureCss();
 var r=document.createElement('div');r.className='fjk fjk-r';r.setAttribute('role','dialog');r.setAttribute('aria-modal','true');
 r.innerHTML='<div class="fjk-b" style="max-width:500px"><button type="button" class="fjk-x" aria-label="Schließen">×</button><div class="c"></div></div>';
 document.body.appendChild(r);
 var shut=function(){r.remove();document.removeEventListener('keydown',esck)},esck=function(e){if(e.key==='Escape')shut()};
 r.addEventListener('click',function(e){if(e.target===r||e.target.closest('.fjk-x,[data-close]'))shut()});document.addEventListener('keydown',esck);
 var put=function(h){r.querySelector('.c').innerHTML='<p class="sum" style="letter-spacing:.16em;font-size:10px;margin:0 0 10px">BUCHUNG '+esc(nr)+'</p>'+h};
 var item=function(it){return '<div class="bill" style="margin:16px 0"><div class="ln" style="font-size:15px"><span><b style="font-weight:600">'+esc(it.title)+'</b><br>'+wday(it.date)+', '+deDate(it.date)+' · '+esc(it.time)+' Uhr · '+it.people+' Gäste'+(it.place?'<br><span style="color:#647069">'+esc(it.place)+'</span>':'')+'</span></div></div>'};
 var btn='<button type="button" class="go" data-close style="justify-content:center;background:#1e3b2a">WEITER ZUR SEITE</button>';
 put('<h2>Einen Moment<i>.</i></h2><p class="sum">Wir prüfen gerade eure Zahlung …</p>');
 var tries=0;
 (function poll(){fetch(API+'/order-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_number:nr,ref:ref})}).then(function(x){return x.json()}).then(function(d){
  if(!d||!d.ok){shut();return}
  var it=(d.items||[]).filter(function(i){return i.type==='service'})[0];
  if(d.paid)return put('<h2>Vielen Dank für eure Buchung<i>.</i></h2><p style="font-size:15px;line-height:1.55">Euer Event ist verbindlich gebucht. Die Buchungsbestätigung liegt in eurem Postfach'+(d.email_hint?' (<strong>'+esc(d.email_hint)+'</strong>)':'')+'. Wir melden uns in den nächsten Tagen, um die Details abzustimmen.</p>'+(it?item(it):'')+'<small>Nichts angekommen? Schaut kurz im Spam-Ordner nach oder schreibt an <a href="mailto:hello@feinejungs.de" style="color:#f45d00">hello@feinejungs.de</a>.</small>'+btn);
  if(d.status==='cancelled')return put('<h2>Zahlung abgebrochen<i>.</i></h2><p style="font-size:15px;line-height:1.55">Die Buchung wurde nicht bezahlt und ist damit nicht zustande gekommen. Ihr könnt jederzeit neu buchen – oder ruft uns an: <a href="tel:+491777753688" style="color:#f45d00">0177 775 36 88</a>.</p>'+btn);
  if(++tries<12)return setTimeout(poll,tries<4?2500:5000);
  put('<h2>Fast geschafft<i>.</i></h2><p style="font-size:15px;line-height:1.55">Eure Zahlung ist noch nicht bestätigt. Bei Überweisung kann das ein paar Tage dauern – sobald sie eingeht, kommt die Buchungsbestätigung per E-Mail'+(d.email_hint?' an <strong>'+esc(d.email_hint)+'</strong>':'')+'.</p>'+(it?item(it):'')+(d.payment_url?'<a class="go" style="text-decoration:none;justify-content:center" href="'+esc(d.payment_url)+'">ZAHLUNG ABSCHLIESSEN · '+eur(d.total)+'</a>':'')+btn);
 }).catch(function(){if(++tries<12)setTimeout(poll,5000);else shut()})})();
}

function init(){hookStatic();returnPopup()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
