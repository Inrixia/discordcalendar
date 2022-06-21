import { Avatar, List, ListItem, ListItemText, Typography } from "@mui/material";

import type { RESTGetAPIUserResult as User } from "discord-api-types/v10";
import { imgUrl } from "../helpers";

export const UserProfile = ({ user }: { user?: User }) => {
	return (
		<List>
			<ListItem>
				<Avatar src={user?.avatar ? imgUrl("avatars", { id: user?.id, hash: user?.avatar }) : ""} alt="" style={{ marginRight: 16 }}>
					{user?.username[0].toUpperCase()}
				</Avatar>
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
	);
};
