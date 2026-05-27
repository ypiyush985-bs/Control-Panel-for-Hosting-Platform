import { useState } from 'react';

function TreeNode({ node, selectedId, onSelect, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0);
  const isDir = node.type === 'directory';

  function handleClick() {
    if (isDir) {
      setOpen((v) => !v);
      onSelect(node);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          paddingLeft: `${0.5 + depth * 1}rem`,
          paddingTop: '0.3rem',
          paddingBottom: '0.3rem',
          paddingRight: '0.75rem',
          width: '100%',
          background: selectedId === node.id ? 'var(--accent-bg)' : 'none',
          border: 'none',
          cursor: isDir ? 'pointer' : 'default',
          color: selectedId === node.id ? 'var(--accent)' : 'var(--text)',
          fontSize: '0.85rem',
          textAlign: 'left',
          borderRadius: '4px',
        }}
        aria-expanded={isDir ? open : undefined}
      >
        <span>{isDir ? (open ? '📂' : '📁') : '📄'}</span>
        <span>{node.name}</span>
      </button>
      {isDir && open && node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

/**
 * DirectoryTree — recursive file tree.
 * Requirements: 4.1, 4.2
 */
export default function DirectoryTree({ tree, selectedNode, onSelect }) {
  return (
    <div style={{ borderRight: '1px solid var(--border)', minWidth: 200, padding: '0.5rem 0', overflowY: 'auto' }}>
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} selectedId={selectedNode?.id} onSelect={onSelect} />
      ))}
    </div>
  );
}
