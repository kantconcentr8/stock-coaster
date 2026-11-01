import type { GameEvent, GameEventType } from './types';

type Listener<T extends GameEventType> = (event: Extract<GameEvent, { type: T }>) => void;

export interface EventBus {
  on<T extends GameEventType>(type: T, fn: Listener<T>): () => void;
  emit(event: GameEvent): void;
}

/** Listener exceptions are caught and logged so one failing subscriber never breaks gameplay. */
export function createEventBus(): EventBus {
  const listeners = new Map<GameEventType, Set<(e: never) => void>>();

  return {
    on(type, fn) {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(fn as (e: never) => void);
      return () => {
        set.delete(fn as (e: never) => void);
      };
    },
    emit(event) {
      const set = listeners.get(event.type);
      if (!set) return;
      for (const fn of [...set]) {
        try {
          (fn as (e: GameEvent) => void)(event);
        } catch (err) {
          console.error(`Listener for "${event.type}" failed`, err);
        }
      }
    },
  };
}
