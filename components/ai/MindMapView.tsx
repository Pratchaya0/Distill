'use client';

interface MindMapNode {
  text: string;
  level: number; // 1=root, 2=branch, 3=leaf
  children: MindMapNode[];
}

function parseMarkdownOutline(markdown: string): MindMapNode[] {
  const lines = markdown.split('\n').filter((l) => l.trim());
  const roots: MindMapNode[] = [];
  const stack: MindMapNode[] = [];

  for (const line of lines) {
    let level = 0;
    let text = '';

    if (line.startsWith('# ')) { level = 1; text = line.slice(2).trim(); }
    else if (line.startsWith('## ')) { level = 2; text = line.slice(3).trim(); }
    else if (line.startsWith('### ')) { level = 3; text = line.slice(4).trim(); }
    else if (line.match(/^[-*] /)) { level = 3; text = line.slice(2).trim(); }
    else continue;

    const node: MindMapNode = { text, level, children: [] };

    if (level === 1) {
      roots.push(node);
      stack.length = 0;
      stack.push(node);
    } else {
      // Find the closest ancestor with a lower level
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (parent) parent.children.push(node);
      else roots.push(node);
      stack.push(node);
    }
  }

  return roots;
}

function NodeTree({ nodes, depth = 0 }: { nodes: MindMapNode[]; depth?: number }) {
  if (nodes.length === 0) return null;

  return (
    <ul className={depth === 0 ? '' : 'ml-5 mt-1 space-y-1 border-l border-border pl-4'}>
      {nodes.map((node, i) => (
        <li key={i} className="relative">
          <div
            className={
              node.level === 1
                ? 'inline-block font-semibold text-sm px-2 py-1 rounded-lg bg-primary/10 text-primary mb-2'
                : node.level === 2
                ? 'inline-block font-medium text-sm px-1.5 py-0.5 rounded-md bg-muted text-foreground'
                : 'text-sm text-muted-foreground'
            }
          >
            {node.text}
          </div>
          <NodeTree nodes={node.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

export function MindMapView({ markdown }: { markdown: string }) {
  const nodes = parseMarkdownOutline(markdown);

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">Could not parse mind map.</p>;
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-card/50 overflow-auto">
      <NodeTree nodes={nodes} />
    </div>
  );
}
