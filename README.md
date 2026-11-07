# feine-jungs-website – Stand der Vercel-Produktion vom 05.11.2026

Dieses Repository enthält den **ausgelieferten Stand** der Website feinejungs.de, so wie er am 05.11.2026 (22:03 UTC)
auf Vercel deployt wurde (Projekt `feinejungs-website`, Upload per CLI/API ohne Git-Anbindung).

Es handelt sich um **gebaute Dateien** (fertiges HTML, minifiziertes Preact-Bundle in `src/public/j/`, Tailwind-CSS in
`src/public/c/`), **nicht** um den Quellcode (TSX, Build-Konfiguration). Der Quellcode liegt im Manus-Projekt der Website.

Jede Datei ist byteidentisch mit der Vercel-Deployment: Die SHA-1-Summe jeder Datei entspricht der Datei-ID, die Vercel
im Dateibaum der Deployment führt (`public/**`, `vercel.json`; `src/build.js` entfernt, es tat nichts).

Dateien: `vercel.json` (Rewrites/Headers), `public/*.html`, `public/checkout.js`, `public/anfrage.js`, `public/consent*.js`,
`public/c/00–04.txt`, `public/j/00–03.txt`.

**Layout für Git-Deployments:** Vercel (Framework „Other“, kein Build) liefert den Ordner `public/` als Website-Wurzel aus und wendet
`vercel.json` an. Der ursprüngliche CLI-Upload hatte die Dateien unter `src/public/`; ein Git-Deployment dieser Struktur lieferte nur 404
(06.11.2026, zurückgerollt). Deshalb liegen die Dateien hier direkt unter `public/`.

Zweck: versionierte Basis für Vergleiche und für den Wagyu-Checkout v2 (siehe Entwurfsdokumentation 07).

## Zweig `wagyu-v3-vorschau` (nur Vorschau, nicht für `main` ohne Freigabe)

Wagyu-Kasse v3 nach Vertrag „Website v3“: neue Datei `public/wagyu-checkout.js`, kleine Weiche im Bundle (`public/j/*`, nur
Warenkörbe mit Wagyu-Plätzen), Skript-Einbindung in `public/index.html`. Reine Gutscheinkäufe, Eventservice und alte
Rückkehrlinks bleiben unverändert. Auf feinejungs.de bleibt der alte Weg aktiv, solange in `wagyu-checkout.js`
`LIVE_ENABLED = false` steht (Umschalten erst beim genehmigten Umstieg). Auf der Vorschau spricht die Kasse nur mit dem
Supabase-**Testprojekt** (kein echtes Geld, keine echten Mails).
