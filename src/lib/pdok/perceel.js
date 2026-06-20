// Komt overeen met detecteerPerceel() uit docs/index.html — PDOK Kadastrale
// Kaart WFS, kleine bbox rond het punt, eerste perceel binnen die bbox.
export async function zoekPerceelPDOK(lat, lng) {
  const delta = 0.0002;
  const bbox = `${lat - delta},${lng - delta},${lat + delta},${lng + delta},EPSG:4326`;
  const url = `https://service.pdok.nl/kadaster/kadastralekaart/wfs/v5_0?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=kadastralekaart:Perceel&outputFormat=application/json&srsName=EPSG:4326&BBOX=${bbox}&count=1`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  if (!text.trim().startsWith('{')) return null;

  const data = JSON.parse(text);
  if (!data.features?.length) return null;

  const props = data.features[0].properties;
  const gemeente = props.AKRKadastraleGemeenteCode || props.kadastralegemeentecode || '';
  const sectie = props.sectie || '';
  const nummer = props.perceelnummer || '';
  const perceelId = `${gemeente}${sectie}-${nummer}`.toUpperCase().replace(/^-|-$/g, '');
  return perceelId || null;
}
