import { useMemo } from 'react';

/**
 * Pure-SVG neural-network background.
 *
 * Why SVG instead of Three.js: this lives behind sections that don't need to
 * be GPU-heavy. SVG nodes pulse via CSS, which is essentially free at 60fps.
 */

interface Node {
  id: number;
  x: number;
  y: number;
  layer: number;
}

export function NeuralBackground({ className = '' }: { className?: string }) {
  const { nodes, edges } = useMemo(() => generateGraph(4, [3, 5, 5, 3]), []);

  return (
    <svg
      className={className}
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(167,139,250,0)" />
          <stop offset="50%" stopColor="rgba(167,139,250,0.4)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </linearGradient>
        <radialGradient id="nodeGrad">
          <stop offset="0%" stopColor="rgba(167,139,250,0.9)" />
          <stop offset="60%" stopColor="rgba(124,58,237,0.5)" />
          <stop offset="100%" stopColor="rgba(124,58,237,0)" />
        </radialGradient>
      </defs>

      {edges.map((e, i) => (
        <line
          key={`e${i}`}
          x1={e.from.x}
          y1={e.from.y}
          x2={e.to.x}
          y2={e.to.y}
          stroke="url(#edgeGrad)"
          strokeWidth="0.08"
          opacity={0.6}
        />
      ))}

      {nodes.map((n) => (
        <g key={n.id} style={{ animation: `pulse-glow ${3 + (n.id % 3)}s ease-in-out infinite`, animationDelay: `${(n.id % 5) * 0.4}s` }}>
          <circle cx={n.x} cy={n.y} r="1.2" fill="url(#nodeGrad)" />
          <circle cx={n.x} cy={n.y} r="0.3" fill="#f3efe7" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

function generateGraph(layers: number, perLayer: number[]) {
  const nodes: Node[] = [];
  const edges: { from: Node; to: Node }[] = [];
  let id = 0;

  for (let l = 0; l < layers; l++) {
    const count = perLayer[l] ?? 4;
    const xStep = 100 / (layers + 1);
    const yStep = 60 / (count + 1);
    for (let n = 0; n < count; n++) {
      nodes.push({
        id: id++,
        x: xStep * (l + 1),
        y: yStep * (n + 1),
        layer: l,
      });
    }
  }

  // Fully connect adjacent layers
  for (let l = 0; l < layers - 1; l++) {
    const from = nodes.filter((n) => n.layer === l);
    const to = nodes.filter((n) => n.layer === l + 1);
    for (const f of from) for (const t of to) edges.push({ from: f, to: t });
  }

  return { nodes, edges };
}
