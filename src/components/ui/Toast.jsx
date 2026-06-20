import { useEffect, useState } from 'react';
import './Toast.css';

// Generieke toast-melding (komt overeen met toast() uit docs/index.html).
// `melding` is { id, tekst, type } | null — een nieuwe `id` toont de toast
// opnieuw, ook als de tekst gelijk is aan de vorige.
export function Toast({ melding, duurMs = 2500 }) {
  const [zichtbaar, setZichtbaar] = useState(false);
  const [getoondId, setGetoondId] = useState(null);

  if (melding && melding.id !== getoondId) {
    setGetoondId(melding.id);
    setZichtbaar(true);
  }

  useEffect(() => {
    if (!zichtbaar) return;
    const timer = setTimeout(() => setZichtbaar(false), duurMs);
    return () => clearTimeout(timer);
  }, [zichtbaar, getoondId, duurMs]);

  if (!zichtbaar || !melding) return null;

  return (
    <div className={`toast ${melding.type || ''}`}>
      {melding.tekst}
    </div>
  );
}
