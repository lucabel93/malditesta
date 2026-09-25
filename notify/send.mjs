// Promemoria giornaliero: gira ogni 10 minuti su GitHub Actions (.github/workflows/promemoria.yml).
// Per ogni dispositivo iscritto (users/{uid}/devices/{id} in Firestore) invia una notifica web push
// all'orario scelto, una volta al giorno, con un messaggio diverso ogni giorno.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const VAPID_PUBLIC_KEY = 'BAamDvCPVPcKSv2PplHika5hMfFs7t8VyT27fhCYWo8FLdobKe59o-QUhCWlGzlbsFBzywfaZ3rBZvQ_44CP6vY';
export const MESSAGES = JSON.parse(readFileSync(new URL('./messages.json', import.meta.url), 'utf8'));
const TITLE = 'Diario Mal di Testa';
const LATE_LIMIT_MIN = 180; // se GitHub è in ritardo di oltre 3 ore, quel giorno si salta

// ordine "a sorpresa" ma fisso: si passano tutti i messaggi prima di ricominciare, mai lo stesso due giorni di fila
function shuffledOrder(n, seed = 20260925) {
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const ORDER = shuffledOrder(MESSAGES.length);
export function messageFor(date) {
  const [y, m, d] = date.split('-').map(Number);
  const day = Math.round(Date.UTC(y, m - 1, d) / 864e5);
  return MESSAGES[ORDER[day % ORDER.length]];
}

// data (AAAA-MM-GG) e minuti dalla mezzanotte nel fuso orario del dispositivo
export function localNow(tz, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(now);
  const get = t => parts.find(p => p.type === t).value;
  return {date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute'))};
}

// È ora di mandare la notifica a questo dispositivo? Restituisce la data locale, oppure null.
export function dueDate(dev, now = new Date()) {
  if (!dev.enabled || !dev.subscription || !/^\d\d:\d\d$/.test(dev.time || '')) return null;
  let local;
  try { local = localNow(dev.tz || 'Europe/Rome', now); } catch { local = localNow('Europe/Rome', now); }
  const [h, m] = dev.time.split(':').map(Number);
  const late = local.minutes - (h * 60 + m);
  if (dev.lastSent === local.date || late < 0 || late > LATE_LIMIT_MIN) return null;
  return local.date;
}

export async function run({db, send, now = new Date(), log = console.log}) {
  const snap = await db.collectionGroup('devices').get();
  const stats = {devices: snap.size, sent: 0, skipped: 0, removed: 0, errors: 0};
  for (const d of snap.docs) {
    const dev = d.data(), date = dueDate(dev, now);
    if (!date) continue;
    const uid = d.ref.parent.parent.id;
    // se l'episodio di oggi è già segnato, niente promemoria
    if ((await db.doc(`users/${uid}/episodes/${date}`).get()).exists) {
      await d.ref.update({lastSent: date, lastResult: 'episodio già segnato'}); stats.skipped++; continue;
    }
    const body = messageFor(date);
    try {
      await send(dev.subscription, JSON.stringify({title: TITLE, body}));
      await d.ref.update({lastSent: date, lastResult: 'inviata'}); stats.sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { await d.ref.delete(); stats.removed++; } // iscrizione scaduta
      else { stats.errors++; log(`Errore invio a ${d.ref.path}: ${e.statusCode || ''} ${e.body || e.message}`); }
    }
  }
  log(`Dispositivi: ${stats.devices} · inviate: ${stats.sent} · già segnati: ${stats.skipped} · rimossi: ${stats.removed} · errori: ${stats.errors}`);
  return stats;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const {FIREBASE_SERVICE_ACCOUNT: sa, VAPID_PRIVATE_KEY: vapidPrivate} = process.env;
  if (!sa || !vapidPrivate) {
    console.log('Promemoria non ancora configurati: mancano i secret FIREBASE_SERVICE_ACCOUNT e/o VAPID_PRIVATE_KEY.');
    process.exit(0);
  }
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const webpush = (await import('web-push')).default;
  initializeApp({credential: cert(JSON.parse(sa))});
  webpush.setVapidDetails('https://lucabel93.github.io/malditesta/', VAPID_PUBLIC_KEY, vapidPrivate);
  const stats = await run({db: getFirestore(), send: (sub, payload) => webpush.sendNotification(sub, payload, {TTL: 3 * 3600})});
  if (stats.errors) process.exitCode = 1;
}
