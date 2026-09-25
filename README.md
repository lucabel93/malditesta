# Diario Mal di Testa

Web app personale (PWA) per registrare gli episodi di mal di testa da iPhone.

- Un file solo: `index.html` (HTML + CSS + JS, nessuna dipendenza)
- Dati salvati solo sul dispositivo (localStorage), mai inviati a server
- Funziona offline grazie a `sw.js`
- Backup/ripristino in JSON ed esportazione CSV per Excel dalla schermata Impostazioni

## Installazione su iPhone
1. Apri `https://lucabel93.github.io/malditesta/` con **Safari**
2. Condividi → **Aggiungi alla schermata Home**
3. Apri l'app dalla Home → Impostazioni → *Ripristina / importa backup*

## Privacy
Il repository è pubblico: **non caricare mai file con dati personali** (`.json` di backup, `.csv`, `.xlsx`).
Il `.gitignore` li esclude già.

## Aggiornamenti
Dopo ogni modifica a `index.html` incrementa `VERSION` in `sw.js` per forzare l'aggiornamento della cache.
