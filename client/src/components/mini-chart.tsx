import { useEffect, useRef } from "react";

interface MiniChartProps {
  data: { date: string; price: number }[];
  trend: 'positive' | 'negative';
  symbol: string;
}

export default function MiniChart({ data, trend, symbol }: MiniChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = svgRef.current;
    const width = 200;
    const height = 60;
    const padding = 5;

    // Clear previous content
    svg.innerHTML = '';

    // Find min/max values for scaling
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Create points for the polyline
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = ((maxPrice - d.price) / priceRange) * (height - 2 * padding) + padding;
      return `${x},${y}`;
    }).join(' ');

    // Create polyline element
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', trend === 'positive' ? '#10B981' : '#EF4444');
    polyline.setAttribute('stroke-width', '2');
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(polyline);
  }, [data, trend]);

  if (!data.length) {
    return (
      <div 
        className="w-full h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm"
        data-testid={`chart-no-data-${symbol}`}
      >
        No chart data
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-16"
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      data-testid={`chart-${symbol}`}
    />
  );
}
