import { useCallback, useRef, useState } from "react";

export function usePanel(initialWidth = 480) {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const isResizing = useRef(false);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(
        Math.max(window.innerWidth - ev.clientX, 280),
        window.innerWidth * 0.8,
      );
      setPanelWidth(newWidth);
    };
    const onMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return { panelWidth, onResizeMouseDown };
}
