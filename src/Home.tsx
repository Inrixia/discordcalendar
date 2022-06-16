import { useEffect, useReducer, useState } from "react";
import { useDiscordOAuth } from "./DiscordOAuthProvider";

import { Routes, RouteBases } from "discord-api-types/v9";
import { RESTGetAPIUserResult, RESTGetAPICurrentUserGuildsResult } from "discord-api-types/v10";

import { fetchWithTimeout, imgUrl } from "./helpers";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { Divider, List, ListItem, Avatar, Typography, ListItemButton, ListItemText, Tooltip } from "@mui/material";
import { getDrawerHelpers } from "./Drawer";

// Icons
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// CSS
import "./darkcalendar.scss";

const localizer = momentLocalizer(moment);
const { Drawer } = getDrawerHelpers(256);

const guildReducer = (state: Record<string, boolean>, action: { type: "add" | "remove"; id: string }) => {
	switch (action.type) {
		case "add":
			return { ...state, [action.id]: true };
		case "remove":
			return { ...state, [action.id]: false };
		default:
			throw new Error("No action specified for guildReducer!");
	}
};

export const Home = () => {
	const discordInfo = useDiscordOAuth();
	const headers = { Authorization: `${discordInfo.tokenType} ${discordInfo.accessToken}` };

	const [user, setUser] = useState<RESTGetAPIUserResult>();
	const [guilds, setGuilds] = useState<RESTGetAPICurrentUserGuildsResult>();
	const [drawerOpen, setDrawerOpen] = useState(false);

	const [selectedGuilds, dispatchSelected] = useReducer(guildReducer, {} as Record<string, boolean>);

	useEffect(() => {
		// Fetch user
		fetchWithTimeout(`${RouteBases.api}/${Routes.user()}`, { headers })
			.then((result) => result.json<RESTGetAPIUserResult>())
			.then(setUser)
			.catch(console.error);

		fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers })
			.then((result) => result.json<RESTGetAPICurrentUserGuildsResult>())
			.then(setGuilds)
			.catch(console.error);
	}, []);

	const handleDrawerOpen = () => setDrawerOpen(true);
	const handleDrawerClose = () => setDrawerOpen(false);

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
					{guilds?.map((guild) => {
						const isSelected = selectedGuilds[guild.id] === true;
						return (
							<ListItemButton key={guild.id} onClick={() => dispatchSelected({ type: isSelected ? "remove" : "add", id: guild.id })} selected={isSelected} dense>
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
								<ListItemText id={guild.id} primary={guild.name} />
							</ListItemButton>
						);
					})}
					<Divider />
				</List>
			</Drawer>
			<Calendar localizer={localizer} startAccessor="start" endAccessor="end" style={{ height: "100vh", width: "100%", padding: 16 }} />
		</div>
	);
};
