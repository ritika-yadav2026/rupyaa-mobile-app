import React from 'react';
import { LimitHeroCard } from './LimitHeroCard';

interface ApplicationNotApprovedCardProps {
  footerMessage: string;
  stripLabel?: string;
  onCreditReportPress?: () => void;
}

export function ApplicationNotApprovedCard({
  footerMessage,
  stripLabel = 'Stay tuned',
  onCreditReportPress,
}: ApplicationNotApprovedCardProps): React.JSX.Element {
  const footerText = footerMessage.replace(/^please\s+/i, '');

  return (
    <LimitHeroCard
      actionLabel="Check Credit Report"
      onActionPress={onCreditReportPress}
      badgeLabel={stripLabel}
      eyebrow="Better Loan Options"
      title="COMING SOON..."
      caption="We're working on better loan options for you."
      footerText={footerText}
      animatedArrow={false}
    />
  );
}
