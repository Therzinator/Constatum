import { useEffect } from 'react';
import './Lightbox.css';

// React-versie van de lightbox uit docs/index.html (#lightbox + showLightboxItem/
// lightboxNav). `bestanden` zijn opgeloste bestanden met dataUrl (zie
// MeldingDetailModal, dat ontbrekende dataUrls uit IndexedDB haalt).
export function Lightbox({ bestanden, index, onIndexChange, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + bestanden.length) % bestanden.length);
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % bestanden.length);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, bestanden.length, onIndexChange, onClose]);

  if (!bestanden.length) return null;
  const f = bestanden[index];
  const isVideo = f.type?.startsWith('video/');
  const src = f.dataUrl || f.thumbnail;

  return (
    <div className="lightbox-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Sluiten">✕</button>

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
