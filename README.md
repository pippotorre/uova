# Uova 🥚

PWA per cuocere l'uovo perfetto e capire se un uovo è ancora fresco.

## Pubblicazione su GitHub Pages
Indirizzo: **https://uova.entratadisicurezza.com** (repository `pippotorre/uova`).

1. **Settings → Pages → Build and deployment → Source:** scegli **GitHub Actions**.
2. **Settings → Pages → Custom domain:** inserisci `uova.entratadisicurezza.com`, salva e, quando il controllo DNS è superato, attiva **Enforce HTTPS**.
3. DNS su Tophost: record `CNAME` da `uova` a `pippotorre.github.io`.
4. Ogni push su `main` pubblica l'app (vedi la scheda **Actions**).

Prima di ogni nuova versione, aumenta `CACHE` in `sw.js` (`uova-v2`, `uova-v3`, …).

## Provarla in locale
Dalla cartella che contiene `uova/`, avvia `python3 -m http.server` e apri `http://localhost:8000/uova/`.
