import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * Tracks keyboard height across iOS and Android.
 * Returns 0 when keyboard is hidden.
 */
export function useKeyboardHeight(enabled = true): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    // Handles cases like autoFocus where keyboard can already be visible
    // before listeners are attached.
    const keyboardMetrics = Keyboard.metrics?.();
    if (Keyboard.isVisible?.() && keyboardMetrics?.height) {
      setKeyboardHeight(keyboardMetrics.height);
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [enabled]);

  return keyboardHeight;
}
