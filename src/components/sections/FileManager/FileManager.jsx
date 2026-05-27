import { useState } from 'react';
import { MOCK_FILE_TREE } from '../../../data/mockData';
import DirectoryTree from './DirectoryTree';
import FileListPanel from './FileListPanel';
import UploadZone    from './UploadZone';

/**
 * FileManager section — tree + file list + upload zone.
 * Requirements: 4.1–4.12
 */
export default function FileManager() {
  const [tree, setTree]           = useState(MOCK_FILE_TREE);
  const [selectedNode, setSelectedNode] = useState(null);

  // Get children of selected directory node from the live tree
  function getChildren(nodeId) {
    function find(nodes) {
      for (const n of nodes) {
        if (n.id === nodeId) return n.children ?? [];
        if (n.children?.length) {
          const found = find(n.children);
          if (found !== null) return found;
        }
      }
      return null;
    }
    return find(tree) ?? [];
  }

  // Update children of a node in the tree
  function updateChildren(nodeId, newChildren) {
    function update(nodes) {
      return nodes.map((n) => {
        if (n.id === nodeId) return { ...n, children: newChildren };
        if (n.children?.length) return { ...n, children: update(n.children) };
        return n;
      });
    }
    setTree(update(tree));
  }

  const currentChildren = selectedNode ? getChildren(selectedNode.id) : null;

  function handleFileAdded(newFile) {
    if (!selectedNode) return;
    const updated = [...(currentChildren ?? []), newFile];
    updateChildren(selectedNode.id, updated);
  }

  return (
    <div className="section-page">
      <div className="section-page__header">
        <h2 className="section-page__title">File Manager</h2>
      </div>
      <div className="card" style={{ padding: 0, display: 'flex', minHeight: 400 }}>
        <DirectoryTree tree={tree} selectedNode={selectedNode} onSelect={setSelectedNode} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <FileListPanel
            nodes={currentChildren}
            onUpdate={(updated) => selectedNode && updateChildren(selectedNode.id, updated)}
          />
          {selectedNode && (
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <UploadZone onFileAdded={handleFileAdded} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
