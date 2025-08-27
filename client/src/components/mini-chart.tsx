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
    const width = 120;
    const height = 48;
    const padding = 4;

    // Clear previous content
    svg.innerHTML = '';

    // Find min/max values for scaling
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Skip grid lines for compact view

    // Create gradient fill area under the line
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', `gradient-${symbol}`);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', trend === 'positive' ? '#10B981' : '#EF4444');
    stop1.setAttribute('stop-opacity', '0.3');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', trend === 'positive' ? '#10B981' : '#EF4444');
    stop2.setAttribute('stop-opacity', '0.05');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Create points for the line
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = ((maxPrice - d.price) / priceRange) * (height - 2 * padding) + padding;
      return { x, y };
    });

    // Create area path
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let areaD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      areaD += ` L ${points[i].x} ${points[i].y}`;
    }
    areaD += ` L ${points[points.length - 1].x} ${height - padding}`;
    areaD += ` L ${points[0].x} ${height - padding} Z`;
    
    areaPath.setAttribute('d', areaD);
    areaPath.setAttribute('fill', `url(#gradient-${symbol})`);
    svg.appendChild(areaPath);

    // Create main line
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
    polyline.setAttribute('points', pointsStr);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', trend === 'positive' ? '#10B981' : '#EF4444');
    polyline.setAttribute('stroke-width', '2.5');
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(polyline);

    // Skip visible data points for compact view

    // Simplified hover for compact view
    const hoverRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hoverRect.setAttribute('x', '0');
    hoverRect.setAttribute('y', '0');
    hoverRect.setAttribute('width', width.toString());
    hoverRect.setAttribute('height', height.toString());
    hoverRect.setAttribute('fill', 'transparent');
    hoverRect.style.cursor = 'pointer';
    
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    const firstDate = new Date(data[0].date).toLocaleDateString();
    const lastDate = new Date(data[data.length - 1].date).toLocaleDateString();
    const firstPrice = data[0].price.toFixed(2);
    const lastPrice = data[data.length - 1].price.toFixed(2);
    title.textContent = `${firstDate} - ${lastDate}: $${firstPrice} → $${lastPrice}`;
    hoverRect.appendChild(title);
    
    svg.appendChild(hoverRect);

    // Skip price labels for compact view
  }, [data, trend, symbol]);

  if (!data.length) {
    return (
      <div 
        className="w-full h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs"
        data-testid={`chart-no-data-${symbol}`}
      >
        No data
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-12"
      viewBox="0 0 120 48"
      preserveAspectRatio="none"
      data-testid={`chart-${symbol}`}
    />
  );
}
