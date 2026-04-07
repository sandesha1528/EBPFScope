import { useState, useCallback } from 'react';
import { FlameGraphNode } from '../types';

export function useFlameGraph(rootNode: FlameGraphNode | undefined) {
  const [zoomPath, setZoomPath] = useState<FlameGraphNode[]>([]);

  const zoomTo = useCallback((node: FlameGraphNode) => {
    setZoomPath(prev => {
      const idx = prev.findIndex(n => n.name === node.name);
      if (idx >= 0) {
        return prev.slice(0, idx + 1);
      }
      return [...prev, node];
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomPath([]);
  }, []);

  const currentRoot = zoomPath.length > 0 ? zoomPath[zoomPath.length - 1] : rootNode;

  return { currentRoot, zoomPath, zoomTo, resetZoom };
}
