import { haversineAfstand } from '../geo/haversine.js';

const MAX_TIJDms = 8 * 60 * 60 * 1000; // 8 uur
const MAX_AFSTAND = 300; // meter, voor meldingen zonder perceelnummer

// Groepeert meldingen op: zelfde perceel (of GPS-radius 300m) + tijdvenster 8u —
// komt overeen met clusterMeldingen() uit docs/index.html.
export function clusterMeldingen(meldingen) {
  const gesorteerd = [...meldingen].sort(
    (a, b) => new Date(a.timestamp_local) - new Date(b.timestamp_local)
  );

  const clusters = [];

  gesorteerd.forEach((melding) => {
    const cluster = clusters.find((c) => {
      const laatsteMst = new Date(c.meldingen[c.meldingen.length - 1].timestamp_local).getTime();
      const huidigeMst = new Date(melding.timestamp_local).getTime();
      if (huidigeMst - laatsteMst > MAX_TIJDms) return false;

      if (c.perceelnummer && melding.perceelnummer) {
        return c.perceelnummer === melding.perceelnummer;
      }
      if (c.lat && c.lng && melding.gps?.lat && melding.gps?.lng) {
        return haversineAfstand(c.lat, c.lng, melding.gps.lat, melding.gps.lng) <= MAX_AFSTAND;
      }
      return false;
    });

    if (cluster) {
      cluster.meldingen.push(melding);
      cluster.eindTijd = melding.timestamp_local;
      const melders = new Set(cluster.meldingen.map((m) => m.melder_email).filter(Boolean));
      cluster.aantalMelders = melders.size || 1;
      if (melding.gps?.lat) {
        cluster.lat = melding.gps.lat;
        cluster.lng = melding.gps.lng;
      }
    } else {
      clusters.push({
        id: `cluster-${melding.id}`,
        perceelnummer: melding.perceelnummer || null,
        lat: melding.gps?.lat || null,
        lng: melding.gps?.lng || null,
        beginTijd: melding.timestamp_local,
        eindTijd: melding.timestamp_local,
        aantalMelders: 1,
        meldingen: [melding]
      });
    }
  });

  return clusters.sort((a, b) => new Date(b.beginTijd) - new Date(a.beginTijd));
}

export function clusterDuur(cluster) {
  const ms = new Date(cluster.eindTijd) - new Date(cluster.beginTijd);
  if (ms < 60000) return null; // < 1 min = één melding
  const uren = Math.floor(ms / 3600000);
  const minuten = Math.floor((ms % 3600000) / 60000);
  return uren > 0 ? `${uren}u${minuten > 0 ? minuten + 'm' : ''}` : `${minuten}m`;
}
