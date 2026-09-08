import { readAnchorText } from './anchor.js';

// Applicering av overlay-dokumentet i runtime. Ren logik för DATA-overrides
// (enhetstestbar) plus DOM-hjälpare för textredigeringar. Allt tål att en
// gantt-rad, ett spår eller ett ankar-id saknas — då hoppas posten tyst.

function isNum(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

// Gantt: matcha rad på "label|sublabel". Overridet lagrar MÅNADER per segment
// plus förskede; totalManader härleds som summan och andel = man/total.
function applyGanttOverrides(DATA, gantt) {
  if (!gantt || typeof gantt !== 'object' || !Array.isArray(DATA?.gantt)) return;
  for (const rad of DATA.gantt) {
    const ov = gantt[`${rad.label}|${rad.sublabel}`];
    if (!ov || typeof ov !== 'object') continue;
    if (isNum(ov.forskedeMan)) rad.forskedeMan = ov.forskedeMan;
    if (Array.isArray(ov.segment) && ov.segment.length) {
      const segs = ov.segment.filter((s) => s && typeof s.fas === 'string' && isNum(s.man));
      const total = segs.reduce((sum, s) => sum + s.man, 0);
      if (segs.length && total > 0) {
        rad.totalManader = total;
        rad.segment = segs.map((s) => ({ fas: s.fas, andel: s.man / total }));
      }
    }
  }
}

// Spår: matcha på id och scenario-index, sätt totalText och per fas tid
// (fas matchas på namn).
function applySparOverrides(DATA, spar) {
  if (!spar || typeof spar !== 'object' || !Array.isArray(DATA?.spar)) return;
  for (const s of DATA.spar) {
    const ov = spar[s.id];
    if (!ov || !Array.isArray(ov.scenarios)) continue;
    ov.scenarios.forEach((scOv, i) => {
      const sc = s.scenarios?.[i];
      if (!sc || !scOv || typeof scOv !== 'object') return;
      if (typeof scOv.totalText === 'string') sc.totalText = scOv.totalText;
      if (Array.isArray(scOv.faser)) {
        for (const fOv of scOv.faser) {
          if (!fOv || typeof fOv.namn !== 'string' || typeof fOv.tid !== 'string') continue;
          const f = sc.faser?.find((x) => x.namn === fOv.namn);
          if (f) f.tid = fOv.tid;
        }
      }
    });
  }
}

// Muterar DATA på plats utifrån data-overridet. Anropas på window.__ledtiderDATA
// följt av window.__ledtiderRenderData().
export function applyDataOverrides(DATA, data) {
  if (!DATA || !data || typeof data !== 'object') return DATA;
  applyGanttOverrides(DATA, data.gantt);
  applySparOverrides(DATA, data.spar);
  return DATA;
}

function cssEsc(s) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/["\\]/g, '\\$&');
}

// Plockar fram elementen som ett text-override pekar på. Saknade ankare och
// icke-strängvärden hoppas tyst. Ren nog att testas mot en fejk-root.
export function collectTextTargets(root, textMap) {
  const out = [];
  if (!root || typeof root.querySelector !== 'function') return out;
  if (!textMap || typeof textMap !== 'object') return out;
  for (const [anchor, value] of Object.entries(textMap)) {
    if (typeof anchor !== 'string' || !anchor) continue;
    if (typeof value !== 'string') continue;
    let el = null;
    try {
      el = root.querySelector(`[data-comment-anchor="${cssEsc(anchor)}"]`);
    } catch {
      el = null;
    }
    if (!el) continue;
    out.push({ anchor, el, value });
  }
  return out;
}

// Sätter elementets text men bevarar kommentarslagrets inline-UI (bubblor) så
// att de inte försvinner vid applicering.
export function setLeafText(el, value) {
  const ui = [];
  for (const n of Array.from(el.childNodes || [])) {
    if (
      n.nodeType === 1 &&
      (n.getAttribute?.('data-comment-ui') || n.classList?.contains?.('comment-inline-bubble'))
    ) {
      ui.push(n);
    }
  }
  el.textContent = value;
  for (const n of ui) el.appendChild(n);
}

// Applicerar text-overrides på DOM. Sätter bara om texten skiljer sig (så att
// kommentarslagrets MutationObserver inte triggas i onödan).
export function applyTextOverrides(root, textMap) {
  const targets = collectTextTargets(root, textMap);
  for (const { el, value } of targets) {
    if (readAnchorText(el) === value) continue;
    setLeafText(el, value);
  }
  return targets.length;
}
