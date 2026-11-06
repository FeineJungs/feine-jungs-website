# feine-jungs-website – Stand der Vercel-Produktion vom 05.11.2026

Dieses Repository enthält den **ausgelieferten Stand** der Website feinejungs.de, so wie er am 05.11.2026 (22:03 UTC)
auf Vercel deployt wurde (Projekt `feinejungs-website`, Upload per CLI/API ohne Git-Anbindung).

Es handelt sich um **gebaute Dateien** (fertiges HTML, minifiziertes Preact-Bundle in `src/public/j/`, Tailwind-CSS in
`src/public/c/`), **nicht** um den Quellcode (TSX, Build-Konfiguration). Der Quellcode liegt im Manus-Projekt der Website.

Jede Datei ist byteidentisch mit der Vercel-Deployment: Die SHA-1-Summe jeder Datei entspricht der Datei-ID, die Vercel
im Dateibaum der Deployment führt (`src/build.js`, `src/public/**`, `vercel.json`).

Dateien: `vercel.json` (Rewrites/Headers), `src/build.js`, `src/public/*.html`, `src/public/checkout.js`,
`src/public/anfrage.js`, `src/public/consent*.js`, `src/public/c/00–04.txt`, `src/public/j/00–03.txt`.

Zweck: versionierte Basis für Vergleiche und für den Wagyu-Checkout v2 (siehe Entwurfsdokumentation 07).
