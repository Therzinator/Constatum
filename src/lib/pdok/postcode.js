// Coordinatie & Admin systeem — provincie/gemeente-filter via PDOK
// Locatieserver reverse-lookup.
//
// Geen `type=adres`: agrarische percelen hebben vaak geen adres in de buurt,
// waardoor die filter lege docs geeft. Zonder type-filter geeft de
// Locatieserver het dichtstbijzijnde object terug, altijd met gemeentenaam.
// `fl=` beperkt de response tot de velden die we nodig hebben.
async function pdokReverseEenKeer(lat, lng) {
  const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse?lat=${lat}&lon=${lng}&rows=1&fl=gemeentenaam,provincienaam,woonplaatsnaam`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.response?.docs?.[0];
    if (!doc) return null;
    return { gemeente: doc.gemeentenaam || null, provincie: doc.provincienaam || null };
  } finally {
    clearTimeout(timer);
  }
}

export async function zoekGemeenteProvinciePDOK(lat, lng) {
  try {
    const resultaat = await pdokReverseEenKeer(lat, lng);
    if (resultaat) return resultaat;
    // 1 retry bij lege response of netwerk-timeout
    return await pdokReverseEenKeer(lat, lng);
  } catch {
    try {
      return await pdokReverseEenKeer(lat, lng);
    } catch {
      return null;
    }
  }
}
