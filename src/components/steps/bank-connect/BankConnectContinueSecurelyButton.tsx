import React from 'react';
import { Button } from '@/src/components/Button';
import { BANK_CONNECT_MANUAL_PAIR_MIN_HEIGHT } from './bankConnectManualPairLayout';

type BankConnectContinueSecurelyButtonProps = {
  mobile: string;
  isConnectPending: boolean;
  onPress: () => void;
  /** When an ActionCard sits below on Bank Connect mobile, stretch the tap target to match card height. */
  matchManualUploadActionCardHeight?: boolean;
};

export function BankConnectContinueSecurelyButton({
  mobile,
  isConnectPending,
  onPress,
  matchManualUploadActionCardHeight = false,
}: BankConnectContinueSecurelyButtonProps): React.JSX.Element {
  return (
    <Button
      variant="primary"
      size="large"
      fullWidth
      disabled={mobile.length !== 10 || isConnectPending}
      loading={isConnectPending}
      onPress={onPress}
      style={
        matchManualUploadActionCardHeight
          ? { minHeight: BANK_CONNECT_MANUAL_PAIR_MIN_HEIGHT }
          : undefined
      }
    >
      Securely Fetch Statement
    </Button>
  );
}
