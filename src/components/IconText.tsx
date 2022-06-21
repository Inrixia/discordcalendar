import { CSSProperties, ReactNode } from "react";

export const IconText = ({ text, icon, style }: { text: ReactNode; icon: ReactNode; style?: CSSProperties }) => (
	<div
		style={{
			display: "flex",
			alignItems: "center",
			flexWrap: "wrap",
			...style,
		}}
	>
		{icon}
		<span>{text}</span>
	</div>
);
