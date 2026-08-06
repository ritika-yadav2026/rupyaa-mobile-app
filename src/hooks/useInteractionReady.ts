import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

type UseInteractionReadyOptions = {
  enabled?: boolean;
};

/**
 * Returns true once current UI interactions/animations have settled.
 * Useful to defer expensive work (e.g. API calls) until screen transition completes.
 */
export function useInteractionReady(options: UseInteractionReadyOptions = {}): boolean {
  const { enabled = true } = options;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    let isDisposed = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isDisposed) {
        setIsReady(true);
      }
    });

    return () => {
      isDisposed = true;
      task.cancel();
    };
  }, [enabled]);

  return isReady;
}
