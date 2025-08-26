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
    const width = 600;
    const height = 200;
    const padding = 20;

    // Clear previous content
    svg.innerHTML = '';

    // Find min/max values for scaling
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Create grid lines
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('stroke', '#e5e7eb');
    gridGroup.setAttribute('stroke-width', '0.5');
    gridGroup.setAttribute('opacity', '0.5');

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * (height - 2 * padding) + padding;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padding.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (width - padding).toString());
      line.setAttribute('y2', y.toString());
      gridGroup.appendChild(line);
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = (i / 6) * (width - 2 * padding) + padding;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', padding.toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', (height - padding).toString());
      gridGroup.appendChild(line);
    }

    svg.appendChild(gridGroup);

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

    // Add data points
    points.forEach((point, i) => {
      if (i % Math.ceil(points.length / 10) === 0) { // Show every 10th point
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', trend === 'positive' ? '#10B981' : '#EF4444');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
      }
    });

    // Add price labels
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('font-family', 'Inter, sans-serif');
    labelGroup.setAttribute('font-size', '11');
    labelGroup.setAttribute('fill', '#6b7280');

    // Max price label
    const maxLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maxLabel.setAttribute('x', '5');
    maxLabel.setAttribute('y', (padding + 4).toString());
    maxLabel.textContent = `$${maxPrice.toFixed(2)}`;
    labelGroup.appendChild(maxLabel);

    // Min price label
    const minLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    minLabel.setAttribute('x', '5');
    minLabel.setAttribute('y', (height - padding - 4).toString());
    minLabel.textContent = `$${minPrice.toFixed(2)}`;
    labelGroup.appendChild(minLabel);

    svg.appendChild(labelGroup);
  }, [data, trend, symbol]);

  if (!data.length) {
    return (
      <div 
        className="w-full h-48 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm"
        data-testid={`chart-no-data-${symbol}`}
      >
        No chart data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        className="w-full h-48"
        viewBox="0 0 600 200"
        preserveAspectRatio="xMidYMid meet"
        data-testid={`chart-${symbol}`}
      />
    </div>
  );
}
