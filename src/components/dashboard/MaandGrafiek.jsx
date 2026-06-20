import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { maandelijkseAantallen } from '../../lib/meldingen/statistieken.js';

// Komt overeen met het maand-staafdiagram uit renderCharts() in
// docs/index.html — ref-based net als de Leaflet-kaarten elders in de app.
export function MaandGrafiek({ meldingen }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const { labels, aantallen } = maandelijkseAantallen(meldingen);

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: aantallen,
          backgroundColor: 'rgba(0,212,170,0.3)',
          borderColor: '#00d4aa',
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7a90b0', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#1e2d45' } },
          y: { ticks: { color: '#7a90b0', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#1e2d45' } }
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [meldingen]);

  return (
    <div style={{ position: 'relative', height: 180 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
