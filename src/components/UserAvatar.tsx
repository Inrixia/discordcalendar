import { Avatar } from "@mui/material";
import { CSSProperties } from "react";

import { imgUrl } from "../helpers";
import type { RESTGetAPIUserResult as User } from "discord-api-types/v10";

export const UserAvatar = ({ user, size, style }: { user: User; size?: number; style?: CSSProperties }) => (
	<Avatar src={user.avatar ? imgUrl("avatars", user.id, user.avatar) : ""} alt="" style={{ ...style, marginRight: 8, width: size, height: size }}>
		{user.username[0].toUpperCase()}
	</Avatar>
);
