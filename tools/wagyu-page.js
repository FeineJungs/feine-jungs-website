/* Erzeugt public/wagyu.html (Eventseite feinejungs.de/wagyu) aus public/index.html.
   Nach JEDER Änderung an public/index.html erneut ausführen:  node tools/wagyu-page.js
   Die Seite nutzt dasselbe Bundle wie die Startseite (Route "/wagyu"); über die Klasse
   html.fj-wagyu-page blendet wagyu-event.css alle Abschnitte außer „Erlebnisse“ aus.
   Kauf, Warenkorb und Kasse laufen damit unverändert direkt auf der Eventseite. */
const fs = require('fs'), path = require('path')
const root = path.join(__dirname, '..', 'public')
let h = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

function swap(re, to, label) {
  const n = (h.match(re) || []).length
  if (n !== 1) throw new Error(`wagyu-page: „${label}“ ${n}× gefunden statt 1×`)
  h = h.replace(re, to)
}

const TITLE = 'wagyu × champagne – 17. & 18.12.2026 im InfoTurm Stuttgart | feine jungs'
const DESC = 'Fünf Wagyu-Gänge aus 100 % Fullblood Wagyu, fünf prickelnde Begleiter. Fleischsommelier Luz meets feine jungs im InfoTurm Stuttgart – Do 17.12. mit Champagner (390 €), Fr 18.12. mit Champagner & Schaumwein (350 €). Plätze direkt online buchen.'
const URL = 'https://feinejungs.de/wagyu'
const IMG = 'https://feinejungs.de/media/og-wagyu.jpg'

swap(/<html lang="de">/, '<html lang="de" class="fj-wagyu-page">', 'html')
swap(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${DESC}" />`, 'description')
swap(/<meta name="theme-color" content="[^"]*" \/>/, '<meta name="theme-color" content="#341031" />', 'theme-color')
swap(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>
<link rel="canonical" href="${URL}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="feine jungs" />
<meta property="og:locale" content="de_DE" />
<meta property="og:url" content="${URL}" />
<meta property="og:title" content="wagyu × champagne – 17. & 18. Dezember 2026, InfoTurm Stuttgart" />
<meta property="og:description" content="Fünf Wagyu-Gänge, fünf prickelnde Begleiter. Plätze ab 350 € pro Person – direkt online buchen." />
<meta property="og:image" content="${IMG}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="wagyu × champagne" />
<meta name="twitter:card" content="summary_large_image" />`, 'title')
// Kein Start-Intro auf der Eventseite: direkt zum Event.
swap(/<link rel="preload" as="image" href="[^"]*" \/>\n/, '', 'preload')
swap(/<div id="fj-intro" aria-hidden="true">[\s\S]*?<\/div>\n<script>/, '<script>', 'intro')
// Inhalt für Suchmaschinen / ohne JavaScript
swap(/<div id="root">[\s\S]*<\/div><\/div>\n<\/body>/, `<div id="root"><div style="max-width:860px;margin:0 auto;padding:40px 20px;font-family:Arial,sans-serif;color:#fef5e3;background:#341031;line-height:1.6">
<h1>wagyu × champagne – Wagyu trifft Perlage.</h1>
<p>Fünf Wagyu-Gänge aus 100 % Fullblood Wagyu, fünf prickelnde Begleiter. Fleischsommelier Luz meets feine jungs im InfoTurm Stuttgart.</p>
<ul>
<li><strong>Donnerstag, 17.12.2026</strong> – mit Champagner: 390 € pro Person</li>
<li><strong>Freitag, 18.12.2026</strong> – mit einer Kuration aus Champagner und Schaumweinen: 350 € pro Person</li>
</ul>
<p>Preise inkl. MwSt. Plätze direkt online buchen und sicher bezahlen – die Bestätigung kommt per E-Mail. Auch als Geschenk buchbar.</p>
<p>Eine Veranstaltung von LUZ SELECTION × FEINE JUNGS · <a href="/" style="color:#fef5e3">feinejungs.de</a> · <a href="/impressum" style="color:#fef5e3">Impressum</a> · <a href="/agb" style="color:#fef5e3">AGB</a> · <a href="/datenschutz" style="color:#fef5e3">Datenschutz</a></p>
</div></div>
</body>`, 'root')

fs.writeFileSync(path.join(root, 'wagyu.html'), h)
console.log('public/wagyu.html geschrieben (' + h.length + ' Zeichen)')
