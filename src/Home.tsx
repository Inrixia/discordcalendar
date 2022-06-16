import { useEffect, useReducer, useState } from "react";
import { useDiscordOAuth } from "./DiscordOAuthProvider";

import {
	Routes,
	RouteBases,
	RESTAPIPartialCurrentUserGuild as Guild,
	RESTGetAPIUserResult as User,
	RESTGetAPICurrentUserGuildsResult as Guilds,
} from "discord-api-types/v10";

import { APIBase, APIRoutes, imgUrl } from "./helpers";
import { fetchWithTimeout } from "@inrixia/cfworker-helpers";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Divider, List, ListItem, Avatar, Typography, ListItemButton, ListItemText, Tooltip, Modal, Box, useTheme, Button } from "@mui/material";
import { getDrawerHelpers } from "./Drawer";

// Icons
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// CSS
import "./darkcalendar.scss";

export const clientId = "986978606351786065";

const localizer = momentLocalizer(moment);
const { Drawer } = getDrawerHelpers(256);

type SelectedGuilds = Record<string, boolean>;
const guildReducer = (state: Record<string, boolean>, action: { type: "add" | "remove"; id: string }) => {
	switch (action.type) {
		case "add":
			return setSelectedGuilds({ ...state, [action.id]: true });
		case "remove":
			return setSelectedGuilds({ ...state, [action.id]: false });
		default:
			throw new Error("No action specified for guildReducer!");
	}
};

const getSelectedDefaults = () => {
	let selectedDefaults: SelectedGuilds = {};
	let sDString = localStorage.getItem("selectedGuilds");
	if (sDString !== null) {
		try {
			selectedDefaults = JSON.parse(sDString);
		} catch {}
	}
	return selectedDefaults;
};
const setSelectedGuilds = (selectedGuilds: SelectedGuilds): SelectedGuilds => {
	localStorage.setItem("selectedGuilds", JSON.stringify(selectedGuilds));
	return selectedGuilds;
};

export const Home = () => {
	const discordInfo = useDiscordOAuth();
	const headers = { Authorization: `${discordInfo.tokenType} ${discordInfo.accessToken}` };

	const [user, setUser] = useState<User>();
	const [guilds, setGuilds] = useState<Guilds>();

	const [selectedGuilds, dispatchSelected] = useReducer(guildReducer, getSelectedDefaults());
	type BotGuilds = Record<string, 0>;
	const [botGuilds, setBotGuilds] = useState<BotGuilds>();

	// Viewstates
	const [drawerOpen, setDrawerOpen] = useState(false);
	const handleDrawerOpen = () => setDrawerOpen(true);
	const handleDrawerClose = () => setDrawerOpen(false);

	const [modalOpen, setModalOpen] = useState(false);
	const [modalGuild, setModalGuild] = useState<Guild>();
	const handleModalClose = () => setModalOpen(false);

	useEffect(() => {
		// Fetch user
		fetchWithTimeout(`${RouteBases.api}/${Routes.user()}`, { headers })
			.then((result) => result.json<User>())
			.then(setUser)
			.catch(console.error);

		// Fetch user guilds
		fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers })
			.then((result) => result.json<Guilds>())
			.then(setGuilds)
			.catch(console.error);

		// Fetch bot guilds
		fetch(`${APIBase}/${APIRoutes.Guilds}`)
			.then((result) => result.json<BotGuilds>())
			.then(setBotGuilds)
			.catch(console.error);
	}, []);

	const onSelectGuild = (guild: Guild, isSelected: boolean) => {
		if (botGuilds === undefined) return;
		if (botGuilds[guild.id] === undefined) {
			setModalGuild(guild);
			setModalOpen(true);
		} else dispatchSelected({ type: isSelected ? "remove" : "add", id: guild.id });
	};

	return (
		<div style={{ display: "flex" }}>
			<Drawer variant="permanent" open={drawerOpen} PaperProps={{ style: { background: "#202225" } }}>
				{drawerOpen ? (
					<div
						style={{
							display: "flex",
							alignItems: "left",
							flexWrap: "wrap",
							whiteSpace: "nowrap",
						}}
					>
						<div style={{ overflow: "hidden", maxHeight: 64 }}>
							<IconButton onClick={handleDrawerClose}>
								<ChevronLeftIcon />
							</IconButton>
							<span
								style={{
									textTransform: "uppercase",
									fontWeight: "bold",
									fontSize: 12,
									letterSpacing: "1px",
									textAlign: "center",
									margin: "auto",
									marginLeft: 16,
								}}
							>
								Discord Calendar
							</span>
						</div>
					</div>
				) : (
					<IconButton onClick={handleDrawerOpen}>
						<MenuIcon />
					</IconButton>
				)}
				<Divider />
				<List>
					<ListItem>
						<Avatar src={user?.id ? imgUrl("avatars", user?.id, user?.avatar!) : ""} alt="" style={{ marginRight: 16 }} />
						<ListItemText
							primary={
								<Typography variant="h6">
									{user?.username}
									<span style={{ color: "grey", fontWeight: "normal" }}>#{user?.discriminator}</span>
								</Typography>
							}
						/>
					</ListItem>
				</List>
				<Divider />
				<List style={{ width: 256 }}>
					{guilds &&
						guilds?.map((guild) => {
							const isSelected = selectedGuilds[guild.id] === true;
							return (
								<ListItemButton key={guild.id} onClick={() => onSelectGuild(guild, isSelected)} selected={isSelected} dense>
									<GuildIcon guild={guild} />
									<ListItemText id={guild.id} primary={guild.name} />
								</ListItemButton>
							);
						})}
					<Divider />
				</List>
			</Drawer>
			<GuildModal modalOpen={modalOpen} onClose={handleModalClose} guild={modalGuild} />
			<Calendar localizer={localizer} startAccessor="start" endAccessor="end" style={{ height: "100vh", width: "100%", padding: 16 }} />
		</div>
	);
};

const GuildIcon = ({ guild }: { guild: Guild }) => (
	<Tooltip
		title={guild.name}
		arrow
		placement="right"
		componentsProps={{ tooltip: { style: { background: "#18191C" } }, arrow: { style: { color: "#18191C" } } }}
	>
		<Avatar src={guild.icon ? imgUrl("icons", guild.id, guild.icon) : ""} style={{ marginRight: 16 }}>
			{guild.name[0].toUpperCase()}
		</Avatar>
	</Tooltip>
);

const redirectURL = new URL(`https://discord.com/oauth2/authorize`);
redirectURL.searchParams.append("client_id", clientId);
redirectURL.searchParams.append("scope", "bot");
redirectURL.searchParams.append("permissions", "0");

type AddGuildModalProps = { modalOpen: boolean; onClose: () => void; guild?: Guild };
const GuildModal = ({ modalOpen, onClose, guild }: AddGuildModalProps) => {
	const theme = useTheme();

	return (
		<Modal
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
			open={modalOpen}
			onClose={onClose}
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
				<Button variant="contained" color="error" onClick={onClose}>
					<Typography variant="body2">Go Back</Typography>
				</Button>
			</Box>
		</Modal>
	);
};
