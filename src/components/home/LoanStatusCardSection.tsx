import React from 'react';
import { LoanStatusCard } from './LoanStatusCard';
import type { ImageSourcePropType } from 'react-native';
import type { FlowJourneySummary } from '@/src/utils/flowProgress';
import type { FlowPhase } from '@/src/config/flowSteps';

export interface LoanStatusCardSectionProps {
  status: 'in_progress' | 'completed';
  title: string;
  heading: string;
  description: string;
  journey?: FlowJourneySummary;
  passedPhases?: Record<FlowPhase, boolean>;
  passedSubsteps?: Record<string, boolean>;
  actionLabel: string;
  onActionPress?: () => void;
  disableAction?: boolean;
  /** When 'warning', title is shown as amber under-review badge */
  titleBadgeVariant?: 'warning';
  /** When true, hides CTA and progress stepper */
  hideAction?: boolean;
  hideProgressStepper?: boolean;
  actionMessage?: string;
  illustrationSource?: ImageSourcePropType;
  /** Optional pill badge (e.g. "Active Loan") for ACTIVE_LOAN_DASHBOARD stage */
  statusPill?: string;
  /** Optional strip pill label for CBL/REJECTED card style. */
  stripLabel?: string;
  /** When 'overdue', pill uses error styling; used with ACTIVE_LOAN_DASHBOARD. */
  statusPillVariant?: 'active' | 'overdue';
  /** Optional application number from active loan payload */
  applicationNumber?: string;
  /** Optional loan/offered amount to show in the card (from offer or get-existing-active-loan) */
  amount?: number;
  /** Under-review card only: fetch latest active loan/application state */
  onRefreshPress?: () => void;
  /** Refresh state for post-offer/under-review cards */
  isRefreshing?: boolean;
  /** PreOfferCard only: backend still resolving stage (retryStage) — show loader instead of CTA */
  isCheckingEligibility?: boolean;
}

/**
 * Wraps LoanStatusCard for the home screen. Keeps home.tsx clean by isolating
 * the loan status (journey) card section.
 */
export function LoanStatusCardSection(props: LoanStatusCardSectionProps) {
  return <LoanStatusCard {...props} />;
}
