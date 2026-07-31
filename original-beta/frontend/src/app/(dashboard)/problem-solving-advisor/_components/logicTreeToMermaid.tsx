/**
 * ロジックツリーのテキストをMermaid記法に変換する
 */
export function convertLogicTreeToMermaid(logicTreeText: string): string {
  // テキストを行に分割
  const lines = logicTreeText.trim().split('\n');

  // 空の行を除去
  const filteredLines = lines.filter((line) => line.trim() !== '');

  if (filteredLines.length === 0) {
    return 'graph LR\n  A[データがありません]';
  }

  // LR (左から右) 方向を維持
  let mermaidCode = 'graph LR\n';
  let nodeId = 0;
  const nodeMap = new Map<string, string>();

  // 最初の行をルートノードとして追加 - スタイルを強調
  const rootNode = filteredLines[0].trim();
  nodeMap.set(rootNode, `node${nodeId}`);
  // ルートノードを強調表示（課題を明確に）- 可変幅スタイルを適用
  mermaidCode += `  node${nodeId}["<div style='font-size:15px;padding:8px;text-align:left;width:auto;max-width:1500px;height:auto;white-space:nowrap;line-height:1.3'>${escapeQuotes(rootNode)}</div>"]\n`;
  nodeId++;

  // 階層構造を検出してノードとエッジを追加
  let prevLevel = 0;
  let prevNodeIds: string[] = [nodeMap.get(rootNode) || 'node0'];

  for (let i = 1; i < filteredLines.length; i++) {
    const line = filteredLines[i];

    // インデントレベルを検出（改良版）
    let currentLevel = 0;
    let text = line;

    // インデントまたはリスト記号を処理（より柔軟に）
    if (line.match(/^\s*[-*•]\s/)) {
      const match = line.match(/^(\s*)[-*•]\s/);
      if (match) {
        currentLevel = match[1].length / 2 + 1;
        text = line.substring(match[0].length);
      }
    } else if (line.match(/^\s+/)) {
      const match = line.match(/^(\s+)/);
      if (match) {
        currentLevel = match[1].length / 2;
        text = line.substring(match[0].length);
      }
    }

    text = text.trim();

    // 番号付きリストを処理
    if (text.match(/^\d+\.\s/)) {
      text = text.replace(/^\d+\.\s/, '');
    }

    // 新しいノードの作成 - レベルに応じてスタイルを変更
    const currentNodeId = `node${nodeId}`;
    nodeMap.set(text, currentNodeId);

    // レベルに応じたスタイル設定 - すべてのレベルに可変幅スタイルを適用
    const formattedText = escapeQuotes(text).replace(/】/g, '】<br/>');

    // 共通のスタイルベース - 高さと幅を自動調整
    const baseStyle =
      'font-size:15px;padding:6px;text-align:left;min-width:150px;height:auto;white-space:nowrap;line-height:1.3';

    if (currentLevel === 1) {
      // 第1レベル（主要原因）
      mermaidCode += `  ${currentNodeId}["<div style='${baseStyle};max-width:1500px'>${formattedText}</div>"]\n`;
    } else if (currentLevel === 2) {
      // 第2レベル（深掘り原因）も少し強調
      mermaidCode += `  ${currentNodeId}["<div style='${baseStyle};max-width:1500px'>${formattedText}</div>"]\n`;
    } else {
      // さらに深いレベル
      mermaidCode += `  ${currentNodeId}["<div style='${baseStyle};max-width:1500px'>${formattedText}</div>"]\n`;
    }
    nodeId++;

    // エッジを追加（親ノードと現在のノードを接続）
    const parentLevel = Math.max(0, currentLevel - 1);
    const parentIndex = Math.min(parentLevel, prevNodeIds.length - 1);
    const parentNodeId = prevNodeIds[parentIndex];

    mermaidCode += `  ${parentNodeId} --> ${currentNodeId}\n`;

    // prevNodeIdsを更新（任意の深さに対応）
    if (currentLevel > prevLevel) {
      prevNodeIds.push(currentNodeId);
    } else if (currentLevel < prevLevel) {
      prevNodeIds = prevNodeIds.slice(0, currentLevel + 1);
      prevNodeIds[currentLevel] = currentNodeId;
    } else {
      prevNodeIds[currentLevel] = currentNodeId;
    }

    prevLevel = currentLevel;
  }

  // 大きなツリーでもレイアウトを調整
  mermaidCode += `\n  %% レイアウト設定\n  classDef default fill:#f9f9f9,stroke:#ccc,stroke-width:1px;\n`;

  return mermaidCode;
}

/**
 * Mermaid記法で問題になる引用符をエスケープする
 */
function escapeQuotes(text: string): string {
  return text.replace(/"/g, '&quot;');
}
