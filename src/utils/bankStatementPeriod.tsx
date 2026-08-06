import React from 'react';
import { AppText } from '@/src/components/AppText';
import { colors } from '@/src/theme';

/**
 * Manual bank-statement upload window: local calendar, start = 1st of month (M−3),
 * end = yesterday. Used for the "last 3 months" hint on bank connect.
 */

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Format a date as "D Mon" or "D Mon YYYY" for the statement range line.
 */
export function formatStatementRangeDayMonth(date: Date, includeYear: boolean): string {
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  if (includeYear) {
    return `${day} ${month} ${date.getFullYear()}`;
  }
  return `${day} ${month}`;
}

/**
 * Inclusive date range for manual upload copy (local timezone).
 * Returns null if `now` is invalid or the computed range is inconsistent.
 */
export function getManualUploadStatementRange(now: Date): { start: Date; end: Date } | null {
  const ref = new Date(now);
  if (Number.isNaN(ref.getTime())) {
    return null;
  }

  ref.setHours(12, 0, 0, 0);

  const start = new Date(ref.getFullYear(), ref.getMonth() - 3, 1);
  start.setHours(12, 0, 0, 0);

  const end = new Date(ref);
  end.setDate(end.getDate() - 1);
  end.setHours(12, 0, 0, 0);

  if (end.getTime() < start.getTime()) {
    return null;
  }

  return { start, end };
}

export type ManualUploadStatementRangeLabels = {
  startLabel: string;
  endLabel: string;
};

/**
 * Labels for the green date segment; omits year when start/end share a year.
 */
export function formatManualUploadStatementRangeLabel(
  now: Date = new Date()
): ManualUploadStatementRangeLabels | null {
  const range = getManualUploadStatementRange(now);
  if (range == null) {
    return null;
  }

  const { start, end } = range;
  const includeYear = start.getFullYear() !== end.getFullYear();

  return {
    startLabel: formatStatementRangeDayMonth(start, includeYear),
    endLabel: formatStatementRangeDayMonth(end, includeYear),
  };
}

/**
 * One-line copy for manual-upload prompts (e.g. ActionCard subtext).
 * Uses the same date window as the bank-connect manual upload hint.
 * Date range is bold to match emphasis on the required window.
 */
export function getManualUploadStatementRangeDescription(now: Date = new Date()): React.ReactNode {
  const labels = formatManualUploadStatementRangeLabel(now);
  if (labels == null) {
    return 'Upload last 3 months salary-account statement';
  }
  const rangeText = `${labels.startLabel} – ${labels.endLabel}`;
  return (
    <>
      Upload last 3 months including{' '}
      <AppText
        variant="captionSmall"
        weight="bold"
        style={{ color: colors.text.black, lineHeight: 18 }}
      >
        {rangeText}
      </AppText>
      {' '}salary-account statement
    </>
  );
}
