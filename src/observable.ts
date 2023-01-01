import { useEffect, useState } from "react";

type Observer<T> = (state: T) => void;
type Observe<T> = (observer: Observer<T>) => Unobserve;
type Unobserve = () => void;

type ObservableValue<T> = {
  observe: Observe<T>,
  set: Observer<T>,
  get: () => T,
}

export function createObservable<T>(initial: T) {
  type Unobserve = () => void

  let state: T = initial;
  let observers: readonly Observer<T>[] = [];
  function observe(observer: Observer<T>): Unobserve {
    observers = [...observers, observer];
    observer(state);
    return () => {
      observers = observers.filter(o => o !== observer);
    }
  }
  function set(next: T) {
    state = next;
    for (const observe of observers) {
      observe(state);
    }
  }
  const get = () => state;
  return {
    observe,
    set,
    get,
  }
}

export function makeUseOf<T>(observable: ObservableValue<T>) {
  function useObservableValue() {
    const [state, setState] = useState<T>(() => observable.get());
    useEffect(() => {
      const {observe} = observable;
      const cancel = observe(next => {
        setState(next);
      });
      return cancel;
    }, [])
    return state;
  }
  return useObservableValue;
}