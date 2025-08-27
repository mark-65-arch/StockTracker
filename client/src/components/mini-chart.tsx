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
    const width = 320;
    const height = 96;
    const padding = 12;

    // Clear previous content
    svg.innerHTML = '';

    // Find min/max values for scaling
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Create grid lines for detailed chart
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('stroke', '#e5e7eb');
    gridGroup.setAttribute('stroke-width', '0.5');
    gridGroup.setAttribute('opacity', '0.3');

    // Horizontal grid lines
    for (let i = 0; i <= 3; i++) {
      const y = (i / 3) * (height - 2 * padding) + padding;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padding.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (width - padding).toString());
      line.setAttribute('y2', y.toString());
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
    polyline.setAttribute('stroke-width', '2');
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(polyline);

    // Add data points for detailed view
    points.forEach((point, i) => {
      if (i % Math.ceil(points.length / 15) === 0) { // Show every 15th point
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        circle.setAttribute('cy', point.y.toString());
        circle.setAttribute('r', '2');
        circle.setAttribute('fill', trend === 'positive' ? '#10B981' : '#EF4444');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '1');
        svg.appendChild(circle);
      }
    });

    // Add interactive hover points
    points.forEach((point, i) => {
      const hoverCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hoverCircle.setAttribute('cx', point.x.toString());
      hoverCircle.setAttribute('cy', point.y.toString());
      hoverCircle.setAttribute('r', '3');
      hoverCircle.setAttribute('fill', 'transparent');
      hoverCircle.setAttribute('stroke', 'transparent');
      hoverCircle.style.cursor = 'pointer';
      
      // Add tooltip on hover
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      const date = new Date(data[i].date).toLocaleDateString();
      const price = data[i].price.toFixed(2);
      title.textContent = `${date}: $${price}`;
      hoverCircle.appendChild(title);
      
      // Add hover effects
      hoverCircle.addEventListener('mouseenter', () => {
        hoverCircle.setAttribute('fill', trend === 'positive' ? '#10B981' : '#EF4444');
        hoverCircle.setAttribute('stroke', '#ffffff');
        hoverCircle.setAttribute('stroke-width', '2');
        hoverCircle.setAttribute('r', '4');
      });
      
      hoverCircle.addEventListener('mouseleave', () => {
        hoverCircle.setAttribute('fill', 'transparent');
        hoverCircle.setAttribute('stroke', 'transparent');
        hoverCircle.setAttribute('r', '3');
      });
      
      svg.appendChild(hoverCircle);
    });

    // Add price labels for detailed view
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('font-family', 'Inter, sans-serif');
    labelGroup.setAttribute('font-size', '10');
    labelGroup.setAttribute('fill', '#6b7280');

    // Max price label
    const maxLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maxLabel.setAttribute('x', '8');
    maxLabel.setAttribute('y', (padding + 3).toString());
    maxLabel.textContent = `$${maxPrice.toFixed(2)}`;
    labelGroup.appendChild(maxLabel);

    // Min price label
    const minLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    minLabel.setAttribute('x', '8');
    minLabel.setAttribute('y', (height - padding - 2).toString());
    minLabel.textContent = `$${minPrice.toFixed(2)}`;
    labelGroup.appendChild(minLabel);

    svg.appendChild(labelGroup);
  }, [data, trend, symbol]);

  if (!data.length) {
    return (
      <div 
        className="w-full h-24 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm"
        data-testid={`chart-no-data-${symbol}`}
      >
        No chart data available
      </div>
    );
  }

  return (
    <div className="w-full h-24">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 320 96"
        preserveAspectRatio="xMidYMid meet"
        data-testid={`chart-${symbol}`}
      />
    </div>
  );
}
