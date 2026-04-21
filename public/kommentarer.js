/* ═══════════════════════════════════════════════════════════════════
   KOMMENTARSWIDGET för Lokalförsörjningsguiden
   - Högerklick (eller lång tryckning på mobil) öppnar kommentarsruta
   - Sparar till /api/kommentarer (Vercel KV)
   - Alla kommentarer synliga för alla som öppnar sidan
   ═══════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Cache av alla kommentarer {sektionsId: [kommentarer]}
  let allaKommentarer = {};
  let aktivtElement = null;

  // ── STIL (injiceras dynamiskt) ─────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* Markering av kommenterbara element */
    [data-kommentar-id] {
      position: relative;
    }
    [data-kommentar-id].har-kommentar::after {
      content: attr(data-antal-kommentarer);
      position: absolute;
      top: -8px;
      right: -8px;
      background: #D4A04C;
      color: #1A2345;
      font-family: 'Jost', sans-serif;
      font-size: 11px;
      font-weight: 700;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      z-index: 10;
      cursor: pointer;
    }
    [data-kommentar-id]:hover {
      outline: 2px dashed rgba(212, 160, 76, 0.5);
      outline-offset: 3px;
    }

    /* Modal */
    .komm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: komm-fade 0.15s ease-out;
    }
    @keyframes komm-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .komm-modal {
      background: #fff;
      border-radius: 12px;
      max-width: 520px;
      width: 100%;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      font-family: 'Jost', sans-serif;
    }
    .komm-header {
      padding: 18px 22px;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1A2345;
      color: #fff;
    }
    .komm-header h3 {
      margin: 0;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.3rem;
      font-weight: 700;
    }
    .komm-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      opacity: 0.8;
    }
    .komm-close:hover { opacity: 1; }

    .komm-body {
      padding: 18px 22px;
      overflow-y: auto;
      flex: 1;
    }

    .komm-lista {
      margin-bottom: 16px;
    }
    .komm-lista:empty::before {
      content: 'Inga kommentarer än. Var först med att lämna en!';
      display: block;
      color: #9CA3AF;
      font-style: italic;
      padding: 20px 0;
      text-align: center;
      font-size: 0.9rem;
    }
    .komm-item {
      padding: 12px 14px;
      background: #F9F7F2;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 3px solid #D4A04C;
      position: relative;
    }
    .komm-item-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
      font-size: 0.82rem;
    }
    .komm-namn {
      font-weight: 600;
      color: #1A2345;
    }
    .komm-datum {
      color: #9CA3AF;
      font-size: 0.75rem;
    }
    .komm-text {
      font-size: 0.92rem;
      line-height: 1.5;
      color: #374151;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .komm-ta-bort {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #9CA3AF;
      font-size: 14px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .komm-ta-bort:hover {
      background: #FEE2E2;
      color: #DC2626;
    }

    .komm-form {
      border-top: 1px solid #E5E7EB;
      padding-top: 14px;
    }
    .komm-form label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #1A2345;
      margin-bottom: 5px;
    }
    .komm-form input,
    .komm-form textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      font-family: 'Jost', sans-serif;
      font-size: 0.9rem;
      margin-bottom: 10px;
      resize: vertical;
      box-sizing: border-box;
    }
    .komm-form input:focus,
    .komm-form textarea:focus {
      outline: 2px solid #D4A04C;
      outline-offset: -1px;
      border-color: #D4A04C;
    }
    .komm-form textarea {
      min-height: 80px;
      font-family: inherit;
    }
    .komm-spara {
      background: #1A2345;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Jost', sans-serif;
      font-size: 0.9rem;
    }
    .komm-spara:hover { background: #2a3a6a; }
    .komm-spara:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .komm-status {
      font-size: 0.8rem;
      color: #6B7280;
      margin-top: 8px;
    }
    .komm-status.fel { color: #DC2626; }
    .komm-status.ok { color: #059669; }

    /* Hjälpknapp (flytkapsel) */
    .komm-hjalp {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1A2345;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 12px 20px;
      font-family: 'Jost', sans-serif;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .komm-hjalp:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    @media print {
      .komm-hjalp, .komm-overlay,
      [data-kommentar-id].har-kommentar::after,
      [data-kommentar-id]:hover { 
        display: none !important;
        outline: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // ── MARKERING AV KOMMENTERBARA ELEMENT ────────
  // Alla sektioner + kontextkort + typ-kort + exempel-par + spar-kort
  function markeraElement() {
    const selektorer = [
      'section',
      '.kontext-kort',
      '.typ-kort',
      '.exempel-par',
      '.spar-kort',
      '.modul-kort',
      '.behov-pika',
      '.gantt-wrap',
    ];
    selektorer.forEach(selektor => {
      document.querySelectorAll(selektor).forEach((el, i) => {
        if (el.dataset.kommentarId) return;
        // Generera stabilt ID från selektor + section-id eller index
        const sektionId = el.id || el.closest('section')?.id || 'okänd';
        const lokaltId = el.className.split(' ')[0] || 'el';
        const unique = el.id || `${sektionId}-${lokaltId}-${i}`;
        el.dataset.kommentarId = unique;
      });
    });
  }

  // ── HÄMTA KOMMENTARER ─────────────────────────
  async function hamtaKommentarer() {
    try {
      const res = await fetch('/api/kommentarer');
      if (!res.ok) throw new Error('API-fel: ' + res.status);
      allaKommentarer = await res.json();
      uppdateraMarkeringar();
    } catch (err) {
      console.error('Kunde inte hämta kommentarer:', err);
    }
  }

  function uppdateraMarkeringar() {
    document.querySelectorAll('[data-kommentar-id]').forEach(el => {
      const id = el.dataset.kommentarId;
      const antal = (allaKommentarer[id] || []).length;
      if (antal > 0) {
        el.classList.add('har-kommentar');
        el.setAttribute('data-antal-kommentarer', antal);
      } else {
        el.classList.remove('har-kommentar');
        el.removeAttribute('data-antal-kommentarer');
      }
    });
  }

  // ── NAMN (sparas i localStorage) ──────────────
  function hamtaNamn() {
    return localStorage.getItem('lokal-komm-namn') || '';
  }
  function sparaNamn(namn) {
    localStorage.setItem('lokal-komm-namn', namn);
  }

  // ── MODAL ─────────────────────────────────────
  function oppnaModal(element) {
    const id = element.dataset.kommentarId;
    if (!id) return;

    // Läs rubrik från elementet
    let rubrik = '';
    const h = element.querySelector('h2, h3, h4, .siffra, .exempel-titel, .typ-header h3');
    if (h) rubrik = h.textContent.trim();
    else rubrik = id;
    if (rubrik.length > 50) rubrik = rubrik.slice(0, 50) + '…';

    const kommentarer = allaKommentarer[id] || [];

    const overlay = document.createElement('div');
    overlay.className = 'komm-overlay';
    overlay.innerHTML = `
      <div class="komm-modal" role="dialog" aria-modal="true">
        <div class="komm-header">
          <h3>Kommentarer: ${escapeHtml(rubrik)}</h3>
          <button class="komm-close" aria-label="Stäng">&times;</button>
        </div>
        <div class="komm-body">
          <div class="komm-lista" id="komm-lista-${id}"></div>
          <form class="komm-form" id="komm-form-${id}">
            <label for="komm-namn">Ditt namn</label>
            <input type="text" id="komm-namn" placeholder="Förnamn" required maxlength="60">
            <label for="komm-text">Kommentar</label>
            <textarea id="komm-text" placeholder="Skriv din kommentar, fråga eller förbättringsförslag..." required maxlength="2000"></textarea>
            <button type="submit" class="komm-spara">Spara kommentar</button>
            <div class="komm-status" id="komm-status"></div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const listEl = overlay.querySelector(`#komm-lista-${id}`);
    listEl.innerHTML = kommentarer.map(k => `
      <div class="komm-item" data-komm-id="${k.id}">
        <div class="komm-item-head">
          <span class="komm-namn">${escapeHtml(k.namn)}</span>
          <span class="komm-datum">${formateraDatum(k.datum)}</span>
        </div>
        <div class="komm-text">${escapeHtml(k.text)}</div>
        <button class="komm-ta-bort" data-komm-id="${k.id}" title="Ta bort">✕</button>
      </div>
    `).join('');

    // Fyll i namn
    overlay.querySelector('#komm-namn').value = hamtaNamn();

    // Stäng
    const stang = () => overlay.remove();
    overlay.querySelector('.komm-close').addEventListener('click', stang);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) stang();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') {
        stang();
        document.removeEventListener('keydown', esc);
      }
    });

    // Ta bort
    overlay.querySelectorAll('.komm-ta-bort').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Ta bort denna kommentar?')) return;
        const kommId = btn.dataset.kommId;
        try {
          const res = await fetch('/api/kommentarer', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sektionsId: id, id: kommId }),
          });
          if (!res.ok) throw new Error('Kunde inte ta bort');
          btn.closest('.komm-item').remove();
          allaKommentarer[id] = (allaKommentarer[id] || []).filter(k => k.id !== kommId);
          uppdateraMarkeringar();
        } catch (err) {
          alert('Kunde inte ta bort: ' + err.message);
        }
      });
    });

    // Spara kommentar
    const form = overlay.querySelector(`#komm-form-${id}`);
    const status = overlay.querySelector('#komm-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const namn = form.querySelector('#komm-namn').value.trim();
      const text = form.querySelector('#komm-text').value.trim();
      if (!namn || !text) return;
      sparaNamn(namn);
      
      const knapp = form.querySelector('.komm-spara');
      knapp.disabled = true;
      status.className = 'komm-status';
      status.textContent = 'Sparar...';
      
      try {
        const res = await fetch('/api/kommentarer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sektionsId: id, namn, text }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.fel || 'API-fel ' + res.status);
        }
        const nyK = await res.json();
        if (!allaKommentarer[id]) allaKommentarer[id] = [];
        allaKommentarer[id].push(nyK);
        status.className = 'komm-status ok';
        status.textContent = 'Sparad!';
        
        // Lägg till i listan direkt
        listEl.insertAdjacentHTML('beforeend', `
          <div class="komm-item" data-komm-id="${nyK.id}">
            <div class="komm-item-head">
              <span class="komm-namn">${escapeHtml(nyK.namn)}</span>
              <span class="komm-datum">${formateraDatum(nyK.datum)}</span>
            </div>
            <div class="komm-text">${escapeHtml(nyK.text)}</div>
            <button class="komm-ta-bort" data-komm-id="${nyK.id}" title="Ta bort">✕</button>
          </div>
        `);
        form.querySelector('#komm-text').value = '';
        uppdateraMarkeringar();
        
        setTimeout(() => {
          status.textContent = '';
          knapp.disabled = false;
        }, 1500);
      } catch (err) {
        status.className = 'komm-status fel';
        status.textContent = 'Fel: ' + err.message;
        knapp.disabled = false;
      }
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formateraDatum(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('sv-SE', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }

  // ── EVENT LISTENERS ───────────────────────────
  function hittaKommenterbartElement(target) {
    let el = target;
    while (el && el !== document.body) {
      if (el.dataset && el.dataset.kommentarId) return el;
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener('contextmenu', (e) => {
    const el = hittaKommenterbartElement(e.target);
    if (el) {
      e.preventDefault();
      oppnaModal(el);
    }
  });

  // Klick på kommentar-badge
  document.addEventListener('click', (e) => {
    const target = e.target;
    // Klick på ::after-indikator (vi fångar via elementets bounding box)
    if (target.dataset && target.dataset.kommentarId && target.classList.contains('har-kommentar')) {
      const rect = target.getBoundingClientRect();
      // Klick i övre högra hörnet = badge
      if (e.clientX > rect.right - 30 && e.clientY < rect.top + 20) {
        e.preventDefault();
        oppnaModal(target);
      }
    }
  });

  // Long-press på mobil
  let longPressTimer;
  document.addEventListener('touchstart', (e) => {
    const el = hittaKommenterbartElement(e.target);
    if (!el) return;
    longPressTimer = setTimeout(() => {
      oppnaModal(el);
    }, 600);
  }, { passive: true });
  document.addEventListener('touchend', () => clearTimeout(longPressTimer));
  document.addEventListener('touchmove', () => clearTimeout(longPressTimer));

  // ── HJÄLPKNAPP ────────────────────────────────
  const hjalpBtn = document.createElement('button');
  hjalpBtn.className = 'komm-hjalp';
  hjalpBtn.innerHTML = '<span>💬</span><span>Högerklicka för kommentar</span>';
  hjalpBtn.title = 'Klicka för info om hur kommentarsfunktionen fungerar';
  hjalpBtn.addEventListener('click', () => {
    alert(
      'Kommentarsfunktion\n\n' +
      '• Högerklicka på valfri sektion, kort eller element för att öppna kommentarsrutan\n' +
      '• På mobil: tryck och håll i ~0,6 sekunder\n' +
      '• Gul siffra i hörnet visar antal kommentarer på en sektion\n' +
      '• Alla som öppnar sidan ser samma kommentarer\n' +
      '• Namn sparas lokalt i din webbläsare'
    );
  });
  
  // ── INIT ──────────────────────────────────────
  function init() {
    markeraElement();
    hamtaKommentarer();
    document.body.appendChild(hjalpBtn);
    // Polla var 30 sekund för att se andras kommentarer
    setInterval(hamtaKommentarer, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Vänta på att den ordinarie DOMContentLoaded-handlern hinner rendera
    setTimeout(init, 100);
  }
})();
