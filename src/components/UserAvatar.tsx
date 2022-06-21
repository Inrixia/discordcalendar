import { Avatar } from "@mui/material";
import { CSSProperties } from "react";

import { imgUrl } from "../helpers";

type UserAvatarProps = { style?: CSSProperties; size?: number; user: { id: string; avatar: string | null; username: string; guildId?: string } };

export const UserAvatar = ({ style, size, user }: UserAvatarProps) => {
	let avatarUrl = "";
	if (user.avatar) {
		if (user.guildId) avatarUrl = imgUrl("guilds", { id: user.id, hash: user.avatar, guildId: user.guildId });
		else avatarUrl = imgUrl("avatars", { id: user.id, hash: user.avatar });
	}
	return (
		<Avatar src={avatarUrl} alt="" style={{ ...style, marginRight: 8, width: size, height: size }}>
			{user.username[0].toUpperCase()}
		</Avatar>
	);
};
