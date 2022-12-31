import { useEffect, useRef, useState } from "react";

export type Dimensions = {
  readonly width: number,
  readonly height: number,
}

export function useDimensions<T extends Element>(): [Dimensions | undefined, React.RefObject<T>] {
  const refObj = useRef<T>(null);
  const [dimensions, setDimensions] = useState<Dimensions>()
  useEffect(() => {
    const parent = refObj.current?.parentElement;
    if (parent) {
      const observer = new ResizeObserver(() => {
        const element = refObj.current;
        if (!element) {
          return;
        }
        setDimensions({
          width: element.clientWidth,
          height: element.clientHeight
        })
      });
      observer.observe(parent);
      return () => {
        observer.disconnect();
      }
    }
  }, [])

  return [dimensions, refObj];
}

