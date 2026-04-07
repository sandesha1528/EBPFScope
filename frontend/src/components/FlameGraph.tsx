import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlameGraphNode } from '../types';
import { useFlameGraph } from '../hooks/useFlameGraph';

interface FlameGraphProps {
  data?: FlameGraphNode;
  height?: number;
}

export function FlameGraph({ data, height = 320 }: FlameGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentRoot, zoomPath, zoomTo, resetZoom } = useFlameGraph(data);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!currentRoot || !containerRef.current) return;
    
    d3.select(containerRef.current).select('svg').remove();

    const width = containerRef.current.clientWidth;
    
    const root = d3.hierarchy<FlameGraphNode>(currentRoot)
      .sum(d => {
        const childrenSum = d.children ? d.children.reduce((acc, c) => acc + c.value, 0) : 0;
        return Math.max(0, d.value - childrenSum);
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const partition = d3.partition<FlameGraphNode>()
      .size([width, height - 30])
      .padding(1);

    partition(root);

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'var(--font-sans)');

    svgRef.current = svg.node();

    const colorMap: Record<string, string> = {
      kernel: 'var(--color-kernel)',
      user: 'var(--color-user)',
      inlined: 'var(--color-inlined)',
      root: '#24292f'
    };

    const cell = svg.selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.x0},${height - 30 - d.y1})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        zoomTo(d.data);
      });

    cell.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => colorMap[d.data.type] || colorMap['user'])
      .attr('rx', 2)
      .style('transition', 'all 300ms ease')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).style('opacity', 0.8);
        const tooltip = d3.select('#fg-tooltip');
        tooltip.style('opacity', 1)
          .html(`
            <div class="font-bold">${d.data.name}</div>
            <div>Samples: ${d.value || 0}</div>
            <div class="text-xs text-gray-400 font-mono mt-1">${d.data.type.toUpperCase()}</div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).style('opacity', 1);
        d3.select('#fg-tooltip').style('opacity', 0);
      });

    cell.append('text')
      .attr('x', 4)
      .attr('y', 13)
      .attr('fill', '#ffffff')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .text(d => {
        const textWidth = d.x1 - d.x0;
        if (textWidth < 30) return '';
        return d.data.name.length * 6 > textWidth 
          ? d.data.name.substring(0, textWidth / 7) + '...'
          : d.data.name;
      });

  }, [currentRoot, height, zoomTo]);

  if (!data) return <div className="h-full flex items-center justify-center text-gray-500 font-mono bg-background border border-border m-4 rounded">No CPU Profile Data Available</div>;

  return (
    <div className="flex flex-col w-full bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-border/20 text-sm border-b border-border">
        <button 
          onClick={resetZoom}
          className="text-gray-400 hover:text-white transition-colors"
        >
          [root]
        </button>
        {zoomPath.map((node, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-gray-500">/</span>
            <button 
              onClick={() => zoomTo(node)}
              className="text-gray-300 hover:text-white transition-colors truncate max-w-[200px]"
            >
              {node.name}
            </button>
          </span>
        ))}
      </div>
      <div ref={containerRef} className="flex-1 w-full relative p-4">
        <div id="fg-tooltip" className="d3-flame-tooltip" />
      </div>
    </div>
  );
}
