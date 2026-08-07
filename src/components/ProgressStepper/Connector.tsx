/**
 * Connector - Line between step circles in the progress stepper.
 * Supports filled, partial fill, or hidden states.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/src/theme';

const CONNECTOR_HEIGHT = 2;

export interface ConnectorProps {
  filled: boolean;
  partialFill?: number; // 0..1
  hidden?: boolean;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, 1));
}

export function Connector({ filled, partialFill, hidden }: ConnectorProps) {
  if (hidden) {
    return <View style={[styles.connector, styles.connectorHidden]} />;
  }

  const fill = partialFill === undefined ? 0 : clamp01(partialFill);
  const showPartial = !filled && fill > 0;

  // Keep percent stable (avoid 0.333333333333%)
  const percent = Math.round(fill * 1000) / 10; // 1 decimal precision

  return (
    <View style={[styles.connector, filled && styles.connectorFilled]}>
      {showPartial && (
        <View style={[styles.connectorProgress, { width: `${percent}%` }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  connector: {
    flex: 1,
    height: CONNECTOR_HEIGHT,
    backgroundColor: colors.primary.main,
    overflow: 'hidden',
  },
  connectorHidden: {
    backgroundColor: 'transparent',
  },
  connectorFilled: {
    backgroundColor: colors.primary.main,
  },
  connectorProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
  },
});
