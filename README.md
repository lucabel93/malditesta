# Diario Mal di Testa

Web app personale (PWA) per registrare gli episodi di mal di testa da iPhone.

- Un file solo: `index.html` (HTML + CSS + JS, nessuna dipendenza)
- Dati salvati sul dispositivo (localStorage); facoltativamente sincronizzati nel cloud con Firebase (account Google oppure email + password)
- Funziona offline grazie a `sw.js`
- Backup/ripristino in JSON ed esportazione CSV per Excel dalla schermata Impostazioni
- Report PDF per un periodo a scelta (dal/al) con riepilogo, grafico, tabella mensile, calendario, farmaci, note ed elenco episodi, generato sul telefono senza librerie esterne
- Profilo (nome, cognome, data di nascita, telefono, email): alla creazione del PDF l'app chiede se aggiungerlo in prima pagina

## Installazione su iPhone
1. Apri `https://lucabel93.github.io/malditesta/` con **Safari**
2. Condividi → **Aggiungi alla schermata Home**
3. Apri l'app dalla Home → Impostazioni → *Ripristina / importa backup*

## Sincronizzazione cloud (Firebase)
Facoltativa: dalla scheda *Profilo* si accede con email e password e i dati (episodi, farmaci, note rapide, profilo)
vengono sincronizzati tra tutti i dispositivi collegati allo stesso account, anche offline (le modifiche partono quando torna la rete).

- Configurazione: costante `FIREBASE_CONFIG` in `index.html` (dati dell'app web del progetto Firebase; non sono segreti).
- Regole di sicurezza: `firestore.rules` (ogni utente legge e scrive solo `users/{uid}` e `users/{uid}/episodes/{giorno}`),
  da incollare in Console Firebase → Firestore → Regole.
- `firebase.js` è l'SDK Firebase (solo le funzioni usate) in un unico file, così l'app resta senza build e funziona offline.
  Per rigenerarlo: `npm i firebase esbuild` e poi
  `npx esbuild firebase-entry.js --bundle --format=esm --minify --platform=browser --target=es2020 --outfile=firebase.js`
  (`firebase-entry.js` elenca le funzioni usate in `index.html` come `fb.*`).
- Per l'accesso con Google: provider *Google* attivo in Authentication e `lucabel93.github.io` tra i *Domini autorizzati*.

## Privacy
Il repository è pubblico: **non caricare mai file con dati personali** (`.json` di backup, `.csv`, `.xlsx`).
Il `.gitignore` li esclude già.

## Aggiornamenti
Dopo ogni modifica a `index.html` incrementa `VERSION` in `sw.js` per forzare l'aggiornamento della cache.
