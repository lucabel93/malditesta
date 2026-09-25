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

## Promemoria giornaliero (notifiche)
In *Impostazioni → Notifiche* ogni dispositivo (collegato al cloud) sceglie un orario e si iscrive alle notifiche web push.
Su iPhone funziona solo dall'app aggiunta alla schermata Home, con iOS 16.4 o successivo.

- L'invio lo fa `.github/workflows/promemoria.yml` (GitHub Actions, gratis) ogni 10 minuti con `notify/send.mjs`:
  a ogni dispositivo arriva una notifica al giorno all'orario scelto (anche con qualche minuto di ritardo),
  non arriva se l'episodio del giorno è già segnato.
- I messaggi sono in `notify/messages.json`: uno diverso ogni giorno, in un ordine a sorpresa che li usa tutti prima di ricominciare.
- Secret del repository (Settings → Secrets and variables → Actions):
  `FIREBASE_SERVICE_ACCOUNT` (JSON della chiave dell'account di servizio Firebase) e `VAPID_PRIVATE_KEY`
  (chiave privata abbinata a `VAPID_PUBLIC_KEY` in `index.html` e `notify/send.mjs`).
- GitHub sospende le esecuzioni programmate dopo 60 giorni senza modifiche al repository: in quel caso basta riattivarle da *Actions*.

## Privacy
Il repository è pubblico: **non caricare mai file con dati personali** (`.json` di backup, `.csv`, `.xlsx`).
Il `.gitignore` li esclude già.

## Aggiornamenti
Dopo ogni modifica a `index.html` incrementa `VERSION` in `sw.js` per forzare l'aggiornamento della cache.
