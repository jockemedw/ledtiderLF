// Kopplar slide-posterna i scripts/popular-slides.json till sidans innehåll.
//
// JSON:en bär bara layout, urval och ordning; varje slide pekar med
// `innehall.typ` ut vilken del av lokalforsorjning.html den ska visa.
// Funktionerna nedan returnerar de fält layouten i lib/pptx-builder.js läser
// — all text kommer ordagrant ur sidan (DATA-objektet eller sektionens HTML).

const { lasSida } = require('./sid-innehall');

const hex = f => String(f || '').replace('#', '');

// Spårkortens tidsspann skrivs som på webbsidan (renderSparGrid).
function sparTid(s) {
  const visaIAr = s.maxManader >= 24;
  const enhet = visaIAr ? 'år' : 'månader';
  const komma = n => String(Math.round(n / 12 * 10) / 10).replace('.', ',');
  if (visaIAr && s.minManader < 12) return `${s.minManader} mån–${komma(s.maxManader)} ${enhet}`;
  if (visaIAr) return `${komma(s.minManader)}–${komma(s.maxManader)} ${enhet}`;
  return `${s.minManader}–${s.maxManader} ${enhet}`;
}

const spar = (sida, id) => sida.DATA.spar.find(s => s.id === id);

// "Spår A: " + spårets namn som två runs — den sammansatta rubriken finns
// bara som mall på sidan, delarna finns ordagrant.
const sparTitel = s => [{ text: `Spår ${s.bokstav}: ` }, { text: s.namn }];

const TYPER = {
  intro(cfg, sida) {
    const i = sida.intro;
    return { titel: i.titel, undertitel: i.eyebrow, ingress: i.ingress, tagline: i.tagline };
  },

  sammanfattning(cfg, sida) {
    const s = sida.sammanfattning;
    return {
      titel: s.rubrik,
      underrubrik: s.etikett,
      kort: s.kort,
      callout: s.nycklar[0],
    };
  },

  begrepp(cfg, sida) {
    const nyckel = sida.sammanfattning.nycklar[1];
    return {
      titel: nyckel.ledord,
      underrubrik: sida.sammanfattning.rubrik,
      punkter: nyckel.text.split(' · ').map(t => t.trim()).filter(Boolean),
    };
  },

  sparOversikt(cfg, sida) {
    const o = sida.oversikt;
    return {
      titel: o.rubrik,
      underrubrik: o.etikett,
      sparKort: sida.DATA.spar.map(s => ({
        bokstav: s.bokstav,
        niva: s.niva,
        farg: hex(s.farg),
        namn: s.namn,
        subtitle: s.subtitle,
        tid: sparTid(s),
        forutsattning: s.forutsattning,
        varning: s.varning,
      })),
    };
  },

  hierarki(cfg, sida) {
    const o = sida.oversikt;
    return {
      titel: o.hierarki.rubrik,
      underrubrik: o.hierarki.stamp,
      stycken: [o.ingress, ...o.hierarki.stycken],
    };
  },

  gantt(cfg, sida) {
    const j = sida.jamforelse;
    return {
      titel: j.rubrik,
      underrubrik: j.etikett,
      gantt: sida.DATA.gantt,
      faser: sida.DATA.fasFarger,
      fotnot: j.not,
    };
  },

  referenstal(cfg, sida) {
    const j = sida.jamforelse;
    return {
      titel: j.rubrik,
      underrubrik: j.etikett,
      kort: j.referenser.map(r => ({ siffra: r.tal, text: r.text })),
      callout: { text: j.ingress },
    };
  },

  lokaltyper(cfg, sida) {
    const p = sida.perTyp;
    const alla = sida.DATA.lokaltyper;
    const del = cfg.innehall.del === 2 ? alla.slice(3) : alla.slice(0, 3);
    return {
      titel: p.rubrik,
      underrubrik: p.etikett,
      kort: del.map(t => ({
        namn: t.namn,
        eyebrow: t.eyebrow,
        rader: t.rader.map(r => ({ label: r.etikett, val: r.varde })),
        insikt: t.insikt,
        kalla: t.kalla,
      })),
      fotnot: cfg.innehall.del === 2 ? p.metodnot : p.ingress,
    };
  },

  sparScenarier(cfg, sida) {
    const s = spar(sida, cfg.innehall.spar);
    return {
      titel: sparTitel(s),
      underrubrik: s.subtitle,
      farg: hex(s.farg),
      scenarier: s.scenarios.map(sc => ({
        namn: sc.namn,
        totalText: sc.totalText,
        farg: hex(sc.huvudfarg),
        faser: sc.faser.map(f => ({
          namn: f.namn,
          tid: f.tid,
          kommentar: f.kommentar,
          fas: f.fas,
        })),
      })),
      faser: sida.DATA.fasFarger,
    };
  },

  sparRisker(cfg, sida) {
    const s = spar(sida, cfg.innehall.spar);
    return {
      titel: sparTitel(s),
      underrubrik: s.varning,
      kort: [
        { rubrik: 'Risker och begränsningar', chipFarg: 'risk', punkter: s.begransningar },
        { rubrik: 'När passar detta spår', chipFarg: 'passar', punkter: s.narPassar },
      ],
      callout: { ledord: 'Förutsättning', text: s.forutsattning },
    };
  },

  moduler(cfg, sida) {
    const m = sida.moduler;
    return {
      titel: m.rubrik,
      underrubrik: m.etikett,
      ingress: m.ingress,
      kort: sida.DATA.moduler.map(k => ({ namn: k.titel, rader: k.rader })),
      callout: m.varning,
    };
  },

  provningInledning(cfg, sida) {
    const p = sida.provning;
    return { titel: p.rubrik, underrubrik: p.etikett, stycken: p.inledning };
  },

  provningStats(cfg, sida) {
    const p = sida.provning;
    return {
      titel: p.rubrik,
      underrubrik: p.etikett,
      kort: p.stats.map(s => ({ siffra: s.tal, text: s.etikett })),
    };
  },

  // Momenten går på två slides — hela stegtexten ska rymmas oförkortad.
  provningMoment(cfg, sida) {
    const p = sida.provning;
    const del2 = cfg.innehall.del === 2;
    return {
      titel: p.momentRubrik,
      underrubrik: del2 ? '' : p.rubrik,
      grupper: del2 ? p.grupper.slice(2) : p.grupper.slice(0, 2),
      fotnot: del2 ? p.momentNot : '',
    };
  },

  provningVarfor(cfg, sida) {
    const p = sida.provning;
    return {
      titel: p.varforRubrik,
      underrubrik: p.varforIngress,
      kort: p.varforKort,
      callout: p.slutsats,
    };
  },

  kontext(cfg, sida) {
    const k = sida.kontext;
    const alla = sida.DATA.kontext;
    const del2 = cfg.innehall.del === 2;
    const kort = (del2 ? alla.slice(3) : alla.slice(0, 3)).map(p => ({
      siffra: p.siffra,
      etikett: p.enhet,
      text: p.beskrivning,
      kalla: p.kalla,
    }));
    return {
      titel: k.rubrik,
      underrubrik: k.etikett,
      kort,
      callout: del2 ? { text: k.citat } : { text: k.ingress },
      fotnot: del2 ? k.citatKalla : k.primarkallor,
    };
  },

  kostnadKurva(cfg, sida) {
    const k = sida.kostnad;
    return {
      titel: k.rubrik,
      underrubrik: k.etikett,
      siffra: k.kort[0].siffra,
      siffra_etikett: k.kort[0].etikett,
      punkter: k.kort.map(x => x.rubrik),
      fotnot: k.kurvaNot,
      kurva: {
        skeden: k.skeden,
        serier: (cfg.innehall.varden || []).map((varden, i) => ({
          namn: k.serier[i],
          varden,
        })),
      },
    };
  },

  kostnadKort(cfg, sida) {
    const k = sida.kostnad;
    return {
      titel: k.rubrik,
      underrubrik: k.etikett,
      ingress: k.ingress,
      kort: k.kort.map(x => ({
        namn: x.rubrik,
        eyebrow: x.etikett,
        rader: [],
        insikt: x.text,
        kalla: x.kalla,
      })),
      callout: k.nycklar[0],
    };
  },

  kostnadOmvarld(cfg, sida) {
    const k = sida.kostnad;
    return {
      titel: k.etikett,
      underrubrik: k.rubrik,
      kort: k.nycklar.slice(1).map(n => ({ rubrik: n.ledord, punkter: [n.text] })),
    };
  },

  tidGuide(cfg, sida) {
    const b = sida.beslut;
    return {
      titel: b.rubrik,
      underrubrik: b.ingress,
      kort: sida.DATA.tidGuide.map(t => ({
        siffra: t.tid,
        etikett: t.rek,
        text: t.text,
      })),
    };
  },

  matris(cfg, sida) {
    const b = sida.beslut;
    return {
      titel: b.rubrik,
      underrubrik: b.etikett,
      kolumner: b.matrisKolumner,
      rader: sida.DATA.matris.map(r => [r.kriterium, r.a, r.b, r.c, r.d]),
      fotnot: b.matrisNot,
    };
  },

  beslutForutsattning(cfg, sida) {
    const f = sida.beslut.forutsattning;
    return { titel: f.rubrik, underrubrik: sida.beslut.etikett, stycken: [f.text] };
  },

  kallor(cfg, sida) {
    const k = sida.kallor;
    const del = cfg.innehall.del || 1;
    const grupper = sida.DATA.kallor.slice((del - 1) * 2, del * 2);
    return {
      titel: k.rubrik,
      underrubrik: del === 1 ? k.ingress : k.etikett,
      kort: grupper.map(g => ({
        rubrik: g.grupp,
        punkter: g.kidor.map(x => x.titel),
      })),
    };
  },
};

// Slide-posten ur JSON + sidans innehåll → färdigt slide-objekt för layouten.
function byggSlide(cfg, sida = lasSida()) {
  const typ = cfg.innehall && cfg.innehall.typ;
  const fn = TYPER[typ];
  if (!fn) throw new Error(`Okänd innehållstyp '${typ}' för slide '${cfg.id}'.`);
  return { ...cfg, ...fn(cfg, sida) };
}

module.exports = { byggSlide, TYPER };
