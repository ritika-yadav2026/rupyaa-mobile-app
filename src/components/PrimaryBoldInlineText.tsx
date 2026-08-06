import { AppText } from "./AppText";

type PrimaryBoldInlineTextProps = {
	children: React.ReactNode;
};

export const PrimaryBoldInlineText = ({ children }: PrimaryBoldInlineTextProps): React.JSX.Element => {
	return (
		<AppText variant="body" weight="bold" color="primary">
			{children}
		</AppText>
	);
};