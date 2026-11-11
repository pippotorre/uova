# Uova – diario di sviluppo

## Scopo
PWA che calcola il tempo di cottura per l'uovo perfetto in base ad alcuni parametri e mostra, con grafiche interattive, come verificare se un uovo è fresco.

## Scelte
- **Stack:** HTML/CSS/JS puro, senza build. Le grafiche sono SVG generati in JavaScript.
- **Hosting:** GitHub Pages, repository `pippotorre/uova`, pubblicato da GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`.
- **Dominio:** `https://uova.entratadisicurezza.com`, con record CNAME su Tophost (`uova` → `pippotorre.github.io`), file `CNAME` nel repository e dominio personalizzato impostato in Settings → Pages.
- **Dati:** nessun backend e nessun dato salvato: tutti i calcoli si fanno nel browser.
- **Stile:** «caldo da cucina», con crema, giallo tuorlo e arancio.
- **PWA:** installabile (manifest e icone, comprese la maskable e quella per iOS) e utilizzabile offline (service worker con cache `uova-vN`).

## Funzionalità
### Cottura
- [x] Parametri regolabili con preset e slider: grado di cottura (temperatura finale del tuorlo, 62–84 °C), peso (40–85 g, classi S/M/L/XL), temperatura iniziale (2–28 °C, frigo/ambiente) e altitudine (0–4000 m).
- [x] Calcolo del tempo con il modello di Charles D. H. Williams: `t = 0,451 · M^(2/3) · ln(0,76 · (T_uovo − T_acqua)/(T_tuorlo − T_acqua))`. Il punto di ebollizione scende di circa 1 °C ogni 300 m.
- [x] Sezione dell'uovo animata: la parte liquida del tuorlo si riduce con il grado di cottura, l'albume è traslucido per la cottura alla coque, compare l'anello verdastro se l'uovo è troppo cotto, e la dimensione segue il peso.
- [x] Termometro e montagna interattivi.
- [x] Timer con pentola animata, anello di avanzamento, pausa, suono (Web Audio), vibrazione, notifica se l'app è in background e schermo tenuto acceso (Wake Lock).
- [x] Consigli di cottura.
- [x] Idee e ricette diverse per coque, barzotto e sodo.

### Freschezza
- [x] Bicchiere animato per il test del galleggiamento: l'uovo si inclina, si mette in piedi e galleggia; la camera d'aria è disegnata e indicata da un'etichetta.
- [x] Cinque posizioni da toccare («cosa vedi nel bicchiere?»), ognuna con il suo verdetto.
- [x] Slider dei giorni dalla deposizione e scelta tra conservazione in frigo o a temperatura ambiente. A temperatura ambiente l'invecchiamento è stimato 2,5 volte più rapido.
- [x] Barra dell'altezza della camera d'aria (stima indicativa).
- [x] Calcolo dell'età dalla data «da consumarsi preferibilmente entro» (deposizione + 28 giorni).
- [x] Prova del piatto, collegata allo slider dei giorni.
- [x] Altri controlli: odore, guscio, sciabordio, codice sul guscio, dicitura «extra».

### Da fare / idee
- [ ] Ricordare le ultime scelte (non richiesto per ora).
- [ ] Icona definitiva (quella attuale è provvisoria, generata automaticamente).
- [ ] Più uova con timer diversi in parallelo.

## Note tecniche
- A ogni rilascio va aumentata la costante `CACHE` in `sw.js`: compare il banner «Nuova versione disponibile – Aggiorna».
- Tutti i percorsi sono relativi (`./`), quindi l'app funziona sotto `/uova/`.
- I modelli della freschezza (angolo, camera d'aria, galleggiamento) sono approssimazioni didattiche, non misure.

## Registro
- **2026-11-11** – Prima versione (v1): sezioni Cottura e Freschezza, timer, funzionamento offline, installazione e workflow di pubblicazione. Verificata in Chrome headless sotto `/uova/`, anche offline.
- **2026-11-11** – Primo commit su `pippotorre/uova`, con il file `CNAME` per il dominio `uova.entratadisicurezza.com`. Il record CNAME su Tophost è stato creato dall'utente.
