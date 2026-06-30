import { useEffect, useRef } from 'react';
import './Lightbox.css';

// React-versie van de lightbox uit docs/index.html (#lightbox + showLightboxItem/
// lightboxNav). `bestanden` zijn opgeloste bestanden met dataUrl (zie
// MeldingDetailModal, dat ontbrekende dataUrls uit IndexedDB haalt).
export function Lightbox({ bestanden, index, onIndexChange, onClose }) {
  const sluitRef = useRef(null);

  useEffect(() => { sluitRef.current?.focus(); }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + bestanden.length) % bestanden.length);
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % bestanden.length);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, bestanden.length, onIndexChange, onClose]);

  const handleTrap = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = e.currentTarget.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };

  if (!bestanden.length) return null;
  const f = bestanden[index];
  const isVideo = f.type?.startsWith('video/');
  const src = f.dataUrl || f.thumbnail;

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Foto weergave" onKeyDown={handleTrap} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button ref={sluitRef} type="button" className="lightbox-close" onClick={onClose} aria-label="Sluiten">✕</button>

      {bestanden.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={() => onIndexChange((index - 1 + bestanden.length) % bestanden.length)}
            aria-label="Vorige"
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={() => onIndexChange((index + 1) % bestanden.length)}
            aria-label="Volgende"
          >
            ›
          </button>
        </>
      )}

      {isVideo
        ? <video className="lightbox-media" src={src} controls autoPlay />
        : <img className="lightbox-media" src={src} alt={f.name || ''} />}

      <div className="lightbox-meta">
        <div className="lightbox-counter">{index + 1} / {bestanden.length}</div>
        <div>{f.name}</div>
      </div>
    </div>
  );
}
