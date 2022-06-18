import { useEffect, useReducer, useState } from "react";
import { useDiscordOAuth } from "./components/DiscordOAuthProvider";

import {
	Routes,
	RouteBases,
	RESTAPIPartialCurrentUserGuild as Guild,
	RESTGetAPICurrentUserGuildsResult as Guilds,
	RESTGetAPIGuildScheduledEventsResult,
} from "discord-api-types/v10";

import { APIBase, APIRoutes } from "./helpers";
import { fetchWithTimeout } from "@inrixia/cfworker-helpers";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, Event as CalendarEvent } from "react-big-calendar";
import moment from "moment";
import { Divider, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { getDrawerHelpers } from "./components/Drawer";

// Icons
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// CSS
import "./darkcalendar.scss";
import { UserProfile } from "./components/UserProfile";
import { GuildIcon } from "./components/GuildIcon";
import { GuildModal } from "./components/GuildModal";

const localizer = momentLocalizer(moment);
const { Drawer } = getDrawerHelpers(256);

type SelectedGuilds = Record<string, boolean>;
const guildReducer = (state: Record<string, boolean>, action: { type: "add" | "remove"; id: string }) => {
	switch (action.type) {
		case "add":
			return setSelectedGuilds({ ...state, [action.id]: true });
		case "remove":
			delete state[action.id];
			return setSelectedGuilds(state);
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
	const { headers } = useDiscordOAuth();

	const [userGuilds, setUserGuilds] = useState<Record<string, Guild>>();

	const [selectedGuilds, dispatchSelected] = useReducer(guildReducer, getSelectedDefaults());
	type BotGuilds = Set<string>;
	const [botGuilds, setBotGuilds] = useState<BotGuilds>();

	// Viewstates
	const [drawerOpen, setDrawerOpen] = useState(false);
	const handleDrawerOpen = () => setDrawerOpen(true);
	const handleDrawerClose = () => setDrawerOpen(false);

	const [modalOpen, setModalOpen] = useState(false);
	const [modalGuild, setModalGuild] = useState<Guild>();
	const handleModalClose = () => setModalOpen(false);

	useEffect(() => {
		// Fetch user guilds
		fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers })
			.then((result) => result.json<Guilds>())
			.then((userGuilds) => userGuilds.reduce((userGuilds, guild) => ({ ...userGuilds, [guild.id]: guild }), {} as Record<string, Guild>))
			.then(setUserGuilds)
			.catch(console.error);
	}, []);

	useEffect(() => {
		if (userGuilds !== undefined) {
			const botGuildsUrl = new URL(`${APIBase}/${APIRoutes.Guilds}`);
			botGuildsUrl.searchParams.append("guildIds", Object.keys(userGuilds).join(","));
			// Fetch bot guilds
			fetch(botGuildsUrl.href)
				.then((result) => result.json<BotGuilds>())
				.then((result) => new Set(result))
				.then(setBotGuilds)
				.catch(console.error);
		}
	}, [userGuilds]);

	type GuildEvents = Record<string, RESTGetAPIGuildScheduledEventsResult>;
	const [events, setEvents] = useState<GuildEvents>();

	useEffect(() => {
		const _selected = Object.keys(selectedGuilds).filter((id) => events?.[id] === undefined);
		if (_selected.length === 0) return;
		const eventsUrl = new URL(`${APIBase}/${APIRoutes.Events}`);
		eventsUrl.searchParams.append("guildIds", _selected.join(","));
		// Fetch guild events
		fetch(eventsUrl)
			.then((result) => result.json<GuildEvents>())
			.then(setEvents)
			.catch(console.error);
	}, [selectedGuilds]);

	let calendarEvents: CalendarEvent[] = [];
	useEffect(() => {
		if (events !== undefined) {
			Object.values(events).map((events) =>
				events.map(
					(event): CalendarEvent => ({
						title: (
							<>
								{userGuilds && <GuildIcon guild={userGuilds[event.guild_id]} size={24} />}
								{event.name}
							</>
						),
						start: event.scheduled_start_time ? new Date(event.scheduled_start_time) : undefined,
						end: event.scheduled_end_time ? new Date(event.scheduled_end_time) : new Date(new Date(event.scheduled_start_time).getTime() + 1000 * 60 * 60),
					})
				)
			);
		}
	}, [events]);

	const onSelectGuild = (guild: Guild, isSelected: boolean) => {
		if (botGuilds === undefined) return;
		if (!botGuilds.has(guild.id)) {
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
						<UserProfile />
					</ListItem>
				</List>
				<Divider />
				<List style={{ width: 256 }}>
					{userGuilds &&
						Object.values(userGuilds)?.map((guild) => {
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
			<Calendar
				dayLayoutAlgorithm="overlap"
				localizer={localizer}
				events={calendarEvents}
				startAccessor="start"
				endAccessor="end"
				style={{ height: "100vh", width: "100%", padding: 16 }}
			/>
		</div>
	);
};
