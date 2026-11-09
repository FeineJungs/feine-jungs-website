# feine-jungs-website

Quelle der Website **feinejungs.de** (FEINE JUNGS GmbH). Dieses Repository ist der maßgebliche Stand: Was auf `main` liegt, ist live.

## Veröffentlichen

- Vercel-Projekt `feinejungs-website` (Framework „Other“, **kein Build-Schritt**). Vercel liefert den Ordner `public/` als
  Website-Wurzel aus und wendet `vercel.json` an (Rewrites, Header). `build.js` gibt nur eine Zeile aus.
- **Jeder Merge auf `main` wird automatisch als Produktion bereitgestellt** und auf feinejungs.de und www.feinejungs.de gelegt.
- Jeder andere Zweig bekommt eine Vorschau-Adresse
  (`feinejungs-website-git-<zweig>-feinejungs-projects.vercel.app`, Zugriff nur mit Vercel-Anmeldung oder Freigabelink).
- Arbeitsweise: Änderung auf einem Zweig (bisher `wagyu-v3-vorschau`) → Vorschau prüfen → Pull Request → Merge → feinejungs.de prüfen.
- Zurück: In Vercel unter *Deployments* die vorige Produktions-Bereitstellung wählen → *Instant Rollback*.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `public/index.html` | Startseite: lädt das kompilierte Preact-Bundle (`j/`) und das CSS (`c/`), enthält kleine CSS-Ergänzungen im `<style>`-Block |
| `public/j/00–03.txt` | Startseiten-Bundle (minifiziertes JavaScript), in 4 Teile zerlegt; der Lader in `index.html` setzt sie zusammen |
| `public/c/00–04.txt` | Tailwind-CSS der Startseite, ebenfalls zerlegt |
| `public/wagyu.html` | Eventseite **feinejungs.de/wagyu** (`/wagyu-x-champagne` leitet dorthin weiter): wird von `tools/wagyu-page.js` aus `index.html` erzeugt, gleiches Bundle (Route `/wagyu`), zeigt nur den Wagyu-Abschnitt; Buchung direkt auf der Seite, Direktlink zum Dialog: `/wagyu?event=2026-12-17` bzw. `…-18` |
| `public/*.html` | Unterseiten: `weihnachtsfeier`, `gluehwein` (auch `/afterwork`), `eventagentur`, `einloesen`, `widerruf`, `agb`, `impressum`, `datenschutz` |
| `public/consent.js`, `consent-base.js` | Cookie-Einwilligung, Fußbereich und Feinschliff der Unterseiten (u. a. Tanz-am-Berg-Bilder, KI-Hinweis) |
| `public/checkout.js`, `anfrage.js` | Gutschein-/Warenkorb-Kasse und Anfrageformular |
| `public/wagyu-checkout.js` | Wagyu-Kasse v3 (Plätze für „wagyu × champagne“, Zahlung über Mollie) |
| `public/wagyu/` | Wagyu-Abschnitt im Event-Stil: `wagyu-event.css`, `wagyu-theme.js` (Kaufdialoge im Wagyu-Stil), Schriften, Bildmarke |
| `public/fonts/` | Schriften lokal (keine Google-Fonts-Anfragen) |
| `public/media/` | Bilder und Videos lokal (Logos, Stall, Tanz am Berg, ehemalige Manus-CDN-Dateien) |

Es gibt **keinen TSX-Quellcode** der Startseite in diesem Repository; Änderungen an der Startseite werden direkt im Bundle gemacht.

## Startseite ändern (Bundle)

1. `public/j/00–03.txt` der Reihe nach zu einer Datei zusammenfügen.
2. Gezielt ersetzen (Text oder Element-Aufruf `t("…",{…})`); jede Fundstelle muss **genau einmal** vorkommen.
3. Wieder in 4 etwa gleich große Teile zerlegen und mit `node --check` die zusammengefügte Datei prüfen.
4. In `public/index.html` die Version im Lader hochzählen (`?v=local-N`), sonst liefern Browser-Caches den alten Stand.
5. **Danach immer `node tools/wagyu-page.js` ausführen**, damit die Eventseite `public/wagyu.html` denselben Stand hat.
6. Bei geänderten CSS/JS-Dateien unter `public/wagyu/` bzw. `wagyu-checkout.js` ebenso den `?v=`-Parameter in `index.html` erhöhen.

## Kasse und Backend

- Backend ist Supabase (Edge Functions, Datenbank); Zahlungen laufen über Mollie. Schlüssel liegen **nicht** in diesem Repository.
- `wagyu-checkout.js`: Auf feinejungs.de/www spricht die Kasse mit der Produktion (`LIVE_ENABLED = true`).
  Auf Vorschau-Adressen und `localhost` spricht sie mit dem Supabase-**Testprojekt** ohne Zahlungsanbieter
  (Hinweis „Vorschau / Testsystem“ im Dialog) – dort entsteht keine Bezahlseite und kein echter Kauf.
- `/widerruf`: elektronische Widerrufsfunktion nach § 356a BGB (Edge Function `public-withdrawal`, Eingangsbestätigung per Mail).

## Prüfen nach dem Merge

- Startseite und alle Unterseiten laden (HTTP 200), keine JavaScript-Fehler in der Konsole.
- Wagyu-Dialog öffnet, Platzzähler zeigt Werte für 17.12. und 18.12., Warenkorb und Kassenformular erscheinen.
- Kein Testkauf auf feinejungs.de ohne ausdrückliche Freigabe.

## Rechtliches

Impressum, AGB (inkl. Widerrufsbelehrung) und Datenschutzerklärung liegen als eigene Seiten unter `public/`.
Einzelne Bilder und Grafiken sind mit KI erstellt; der Hinweis steht im Fußbereich jeder Seite und im Impressum.
