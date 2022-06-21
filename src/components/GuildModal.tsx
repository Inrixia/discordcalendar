import { Typography, Tooltip, Modal, Box, useTheme, Button } from "@mui/material";
import { GuildIcon } from "./GuildIcon";
import { clientId } from "../helpers";

// Types
import { UserGuild } from "../types";

const redirectURL = new URL(`https://discord.com/oauth2/authorize`);
redirectURL.searchParams.append("client_id", clientId);
redirectURL.searchParams.append("scope", "bot");
redirectURL.searchParams.append("permissions", "0");

type AddGuildModalProps = { modalOpen: boolean; onClose: (refresh?: true) => void; guild?: UserGuild };

export const GuildModal = ({ modalOpen, onClose, guild }: AddGuildModalProps) => {
	const theme = useTheme();

	if (guild === undefined) return null;

	return (
		<Modal
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
			open={modalOpen}
			onClose={() => onClose()}
		>
			<Box
				style={{
					textAlign: "center",
					backgroundColor: "#292B2F",
					boxShadow: theme.shadows[5],
					padding: theme.spacing(2, 4, 3),
					width: "350px",
					height: "256px",
				}}
			>
				<Typography variant="h5">404 Guild not found!</Typography>
				<Typography variant="body1">
					Please add the Calendar bot to your discord so events can be seen.{" "}
					<Tooltip
						title="Unfortunately due to how discord's api works, in order to view events on a server a bot must be added with permissions to do so. I can't see events directly
			on your account."
					>
						<b>Why?</b>
					</Tooltip>
				</Typography>
				<br />
				{guild && (
					<>
						<Button
							variant="contained"
							color="warning"
							onClick={() => {
								redirectURL.searchParams.append("guild_id", guild.id);
								window.open(redirectURL.href);
								onClose(true);
							}}
						>
							<GuildIcon guild={guild} />
							<Typography variant="body2">Add {guild.name}.</Typography>
						</Button>
						<br />
						or
						<br />
					</>
				)}
				<Button variant="contained" color="error" onClick={() => onClose()}>
					<Typography variant="body2">Go Back</Typography>
				</Button>
			</Box>
		</Modal>
	);
};
