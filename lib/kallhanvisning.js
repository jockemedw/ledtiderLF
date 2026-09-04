// Källhänvisningar per påstående.
//
// Ett element i lokalforsorjning.html / detaljplan.html märks med
// data-kalla="<id> <id> …". Varje id är antingen ett käll-id ur
// data/kallregister.json eller ett nyckeltal-id ur data/siffror.json —
// nyckeltalet expanderas då till sina kalla_ids. Resultatet renderas som
// små länkar till /kallregister#<id> intill påståendet.

export function kortEtikett(kalla) {
  if (!kalla) return '';
  if (kalla.kort) return kalla.kort;
  const org = String(kalla.organisation || '');
  // Förkortning i parentes ("Sveriges Kommuner och Regioner (SKR)") vinner.
  const forkortning = org.match(/\(([A-ZÅÄÖ][A-ZÅÄÖa-zåäö&]{1,7})\)/);
  let namn = forkortning ? forkortning[1] : org.split(/[,(/·]|\s+—\s+/)[0].trim();
  namn = namn.replace(/\s+(AB|KF|I\/S|\(publ\))$/i, '').trim();
  if (!namn) namn = String(kalla.titel || kalla.id || '').split(/\s+/).slice(0, 3).join(' ');
  if (namn.length > 32) namn = namn.split(/\s+/).slice(0, 3).join(' ');
  const ar = String(kalla.datum || '').match(/\d{4}/);
  return ar ? `${namn} ${ar[0]}` : namn;
}

// Kompakt index som skickas till klienten (hela registret är ~150 kB).
export function byggKallindex(register, siffror) {
  const kallor = {};
  for (const k of (register?.kallor || [])) {
    kallor[k.id] = {
      id: k.id,
      etikett: kortEtikett(k),
      titel: k.titel,
      organisation: k.organisation,
      datum: k.datum,
      status: k.hardkontroll?.status || '',
    };
  }
  const nyckeltal = {};
  for (const n of (siffror?.nyckeltal || [])) {
    nyckeltal[n.id] = {
      id: n.id,
      etikett: n.etikett,
      varde: n.varde,
      verifiering: n.verifiering,
      kalla_ids: n.kalla_ids || [],
    };
  }
  return { kallor, nyckeltal };
}

export function parseIds(varde) {
  return String(varde || '').split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
}

const HK_TEXT = {
  godkand: 'hårdkontroll godkänd',
  anmarkning: 'hårdkontroll: anmärkning',
  underkand: 'hårdkontroll: underkänd',
  'ej-kontrollerbar': 'ej kontrollerbar',
};

const VERIFIERING_TEXT = {
  verifierad: 'verifierad',
  preliminar: 'preliminär',
  falsk: 'falsk — ska uppdateras',
  'ej-verifierbar': 'ej verifierbar',
};

// Löser upp id-listan till en ordnad, dubblettfri lista av hänvisningar.
// Okända id:n returneras med saknas: true så att de syns i stället för att
// tyst försvinna (testet i lib/__tests__ fångar dem redan i bygget).
export function slaUppKallor(ids, index) {
  const kallor = index?.kallor || {};
  const nyckeltal = index?.nyckeltal || {};
  const ut = [];
  const sedda = new Set();

  const lagg = (id, viaNyckeltal) => {
    if (sedda.has(id)) return;
    sedda.add(id);
    const k = kallor[id];
    if (!k) {
      ut.push({ id, etikett: id, saknas: true, titel: `Okänt käll-id: ${id}` });
      return;
    }
    const delar = [k.titel, k.organisation, k.datum];
    if (k.status) delar.push(HK_TEXT[k.status] || k.status);
    if (viaNyckeltal) {
      delar.unshift(`${viaNyckeltal.etikett}: ${viaNyckeltal.varde} (${VERIFIERING_TEXT[viaNyckeltal.verifiering] || viaNyckeltal.verifiering})`);
    }
    ut.push({ id: k.id, etikett: k.etikett, status: k.status, titel: delar.filter(Boolean).join(' · ') });
  };

  for (const id of parseIds(ids)) {
    const n = nyckeltal[id];
    if (n) {
      if (n.kalla_ids.length === 0) {
        if (sedda.has(id)) continue;
        sedda.add(id);
        ut.push({
          id,
          etikett: 'ej källbelagd',
          nyckeltal: true,
          saknar_kalla: true,
          titel: `${n.etikett}: ${n.varde} — ${VERIFIERING_TEXT[n.verifiering] || n.verifiering}, primärkälla saknas`,
        });
        continue;
      }
      for (const kid of n.kalla_ids) lagg(kid, n);
      continue;
    }
    lagg(id, null);
  }
  return ut;
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Markup som injiceras i DOM:en av components/Kallhanvisningar.jsx.
export function refMarkup(ids, index) {
  const refs = slaUppKallor(ids, index);
  if (refs.length === 0) return '';
  const lankar = refs.map(r => {
    const href = r.saknar_kalla ? `/nyckeltal#${encodeURIComponent(r.id)}` : `/kallregister#${encodeURIComponent(r.id)}`;
    const klass = ['kall-ref-lank'];
    if (r.status) klass.push(`is-${r.status}`);
    if (r.saknas || r.saknar_kalla) klass.push('is-saknas');
    return `<a class="${klass.join(' ')}" href="${href}" title="${escapeHtml(r.titel)}">${escapeHtml(r.etikett)}</a>`;
  }).join('');
  return `<span class="kall-ref" data-kall-ref="1"><span class="kall-ref-etikett">Källa</span>${lankar}</span>`;
}
