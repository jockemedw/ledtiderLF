import { useEffect } from 'react';
import { refMarkup } from '../lib/kallhanvisning.js';

// Renderar källhänvisningar för varje element med data-kalla i det statiska
// HTML-innehållet. Kör om vid DOM-ändringar eftersom stora delar av sidan
// (spår, per-typ, kontext, moduler) renderas av det inbäddade skriptet först
// efter att React monterat.
//
// De injicerade noderna märks med data-comment-ui så att kommentarslagret
// hoppar över dem — annars ändras ankartexten och sparade kommentarer
// hamnar bland de föräldralösa.
export default function Kallhanvisningar({ index }) {
  useEffect(() => {
    if (!index) return;

    let planerad = false;

    function rendera() {
      planerad = false;
      const element = document.querySelectorAll('[data-kalla]:not([data-kall-ref-klar])');
      for (const el of element) {
        el.setAttribute('data-kall-ref-klar', '1');
        const markup = refMarkup(el.getAttribute('data-kalla'), index);
        if (!markup) continue;
        const holk = document.createElement('span');
        holk.innerHTML = markup;
        const ref = holk.firstElementChild;
        ref.setAttribute('data-comment-ui', 'true');
        // Hänvisningen läggs sist i elementet: i ett tomt <cite> blir den
        // hela citatet, i ett stycke eller kort hamnar den efter texten.
        el.appendChild(ref);
      }
    }

    function planera() {
      if (planerad) return;
      planerad = true;
      requestAnimationFrame(rendera);
    }

    rendera();

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type !== 'childList' || m.addedNodes.length === 0) continue;
        const egna = Array.from(m.addedNodes).every(
          (n) => n.nodeType === 1 && n.hasAttribute?.('data-comment-ui')
        );
        if (egna) continue;
        planera();
        return;
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, [index]);

  return null;
}
