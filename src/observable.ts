export function createObservable<T>(initial: T) {
  type Observer = (state: T) => void
  type Unobserve = () => void

  let state: T = initial;
  let observers: readonly Observer[] = [];
  function observe(observer: Observer): Unobserve {
    observers = [...observers, observer];
    observer(state);
    return () => {
      observers = observers.filter(o => o !== observer);
    }
  }
  function set(next: T) {
    state = next;
    for (const o of observers) {
      o(state);
    }
  }
  const get = () => state;
  return {
    observe,
    set,
    get,
  }
}
