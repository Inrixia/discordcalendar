import { RESTAPIPartialCurrentUserGuild as Guild } from "discord-api-types/v10";
import { imgUrl } from "../helpers";
import { Avatar, Tooltip } from "@mui/material";
import { CSSProperties } from "react";

export const GuildIcon = ({ guild, size, style }: { guild: Guild; size?: number; style?: CSSProperties }) => (
	<Tooltip
		title={guild.name}
		arrow
		placement="right"
		componentsProps={{ tooltip: { style: { background: "#18191C" } }, arrow: { style: { color: "#18191C" } } }}
	>
		<Avatar src={guild.icon ? imgUrl("icons", guild.id, guild.icon) : ""} style={{ width: size, height: size, ...style }}>
			{guild.name[0].toUpperCase()}
		</Avatar>
	</Tooltip>
);
