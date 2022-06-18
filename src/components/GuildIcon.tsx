import { RESTAPIPartialCurrentUserGuild as Guild } from "discord-api-types/v10";
import { imgUrl } from "../helpers";
import { Avatar, Tooltip } from "@mui/material";

export const GuildIcon = ({ guild, size }: { guild: Guild; size?: number }) => (
	<Tooltip
		title={guild.name}
		arrow
		placement="right"
		componentsProps={{ tooltip: { style: { background: "#18191C" } }, arrow: { style: { color: "#18191C" } } }}
	>
		<Avatar src={guild.icon ? imgUrl("icons", guild.id, guild.icon) : ""} style={{ marginRight: 16, width: size, height: size }}>
			{guild.name[0].toUpperCase()}
		</Avatar>
	</Tooltip>
);
