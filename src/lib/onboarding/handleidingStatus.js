// Onthoudt of de gebruiker de welkomst-/handleiding-modal al heeft gezien,
// zodat hij niet bij elke login opnieuw verschijnt. Zelfde opt-in/opt-out
// patroon als lib/notificaties/deelvoorkeur.js.
const SLEUTEL = 'spuitlogger_handleiding_gezien';

export function isHandleidingGezien() {
  try {
    return localStorage.getItem(SLEUTEL) === 'true';
  } catch {
    return false;
  }
}

export function markeerHandleidingGezien() {
  try {
    localStorage.setItem(SLEUTEL, 'true');
  } catch { /* localStorage niet beschikbaar */ }
}
