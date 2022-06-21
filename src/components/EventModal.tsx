import moment from "moment";
import { useState } from "react";
import { Typography, Modal, Box, Card, CardMedia, Tab, IconButton } from "@mui/material";
import { TabContext, TabList } from "@mui/lab";
import TabPanel from "@mui/lab/TabPanel";

// Components
import { GuildIcon } from "./GuildIcon";
import { UserAvatar } from "./UserAvatar";

// Helpers
import { imgUrl } from "../helpers";

// Types
import type { Event, UserGuild } from "../types";

// Icons
import TodayIcon from "@mui/icons-material/Today";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CloseIcon from "@mui/icons-material/Close";
import { IconText } from "./IconText";

type AddGuildModalProps = { modalOpen: boolean; onClose: () => void; event: Event; guild: UserGuild };

export const EventModal = ({ modalOpen, onClose, event, guild }: AddGuildModalProps) => {
	const [tabValue, setTabValue] = useState<string>("eventInfo");

	const momentStart = moment(event.scheduled_start_time);

	const { creator } = event;
	console.log(event);

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
			<Card sx={{ background: "#36393F", height: 540, width: 512 }}>
				<IconButton
					style={{
						position: "absolute",
						marginLeft: 460,
						marginTop: 10,
						background: "rgba(0,0,0,0.4)",
						borderRadius: 4,
						padding: 4,
					}}
					onClick={() => {
						onClose();
					}}
				>
					<CloseIcon />
				</IconButton>
				{event.image && <CardMedia component="img" image={imgUrl("guild-events", { id: event.id, hash: event.image, size: 512 })} />}
				<TabContext value={tabValue}>
					<Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
						<TabList onChange={(e, newValue: string) => setTabValue(newValue)}>
							<Tab label="Event Info" value="eventInfo" />
							<Tab label={`${event.users.length} Interested`} value="interested" />
						</TabList>
					</Box>
					<TabPanel value="eventInfo">
						<div style={{ marginBottom: 16 }}>
							<IconText
								text={
									<>
										{momentStart.calendar()} ({momentStart.fromNow()})
									</>
								}
								icon={<TodayIcon style={{ color: "#949CF7", marginRight: 8 }} />}
								style={{ marginBottom: 8 }}
							/>
							<Typography gutterBottom variant="h5" color="white" component="div">
								{event.name}
							</Typography>
						</div>
						<div style={{ marginBottom: 16 }}>
							<IconText text={guild.name} icon={<GuildIcon guild={guild} size={24} style={{ marginRight: 8 }} />} style={{ marginBottom: 8 }} />
							<IconText text={`${event.users.length} people are interested`} icon={<PeopleAltIcon style={{ marginRight: 8 }} />} style={{ marginBottom: 8 }} />
							{creator && (
								<IconText
									text={
										<>
											{`Created by `}
											<span style={{ color: "#b9dfff" }}>{creator?.username}</span>
										</>
									}
									icon={<UserAvatar style={{ marginRight: 8 }} user={creator} size={24} />}
								/>
							)}
						</div>
						<Typography variant="body2" color="text.secondary">
							{event.description}
						</Typography>
					</TabPanel>
					<TabPanel value="interested">
						<Box sx={{ height: 260, overflow: "scroll", "&&::-webkit-scrollbar": { display: "none" } }}>
							{event.users.map(({ user, member }) => (
								<IconText
									key={user.id}
									text={member?.nick || user.username}
									icon={
										<UserAvatar
											style={{ marginRight: 8 }}
											user={{
												id: user.id,
												avatar: member?.avatar || user.avatar,
												username: member?.nick || user.username,
												guildId: member?.avatar ? guild.id : undefined,
											}}
											size={24}
										/>
									}
									style={{ marginBottom: 12 }}
								/>
							))}
						</Box>
					</TabPanel>
				</TabContext>
			</Card>
		</Modal>
	);
};
