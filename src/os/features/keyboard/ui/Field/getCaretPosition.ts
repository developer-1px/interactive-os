/**
 * Gets the current caret position relative to the element.
 */
export const getCaretPosition = (element: HTMLElement): number => {
  let position = 0;
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    position = preCaretRange.toString().length;
  }
  return position;
};

/**
 * Sets the caret position relative to the element.
 * Handles nested text nodes recursively.
 */
export const setCaretPosition = (element: HTMLElement, position: number) => {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  let currentPos = 0;
  let found = false;

  const traverse = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length || 0;
      if (currentPos + len >= position) {
        range.setStart(node, position - currentPos);
        range.collapse(true);
        return true;
      }
      currentPos += len;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) return true;
      }
    }
    return false;
  };

  found = traverse(element);

  if (!found) {
    // If not found (e.g., position > length, or empty), set to end
    range.selectNodeContents(element);
    range.collapse(false);
  }

  selection.removeAllRanges();
  selection.addRange(range);
};
