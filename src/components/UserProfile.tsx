import { useState, useEffect } from "react";
import { Avatar, List, ListItem, ListItemText, Typography } from "@mui/material";

import { fetchWithTimeout } from "@inrixia/cfworker-helpers";
import { RouteBases, Routes, RESTGetAPIUserResult as User } from "discord-api-types/v10";

import { useDiscordOAuth } from "./DiscordOAuthProvider";
import { imgUrl } from "../helpers";

export const UserProfile = () => {
	const { headers } = useDiscordOAuth();

	const [user, setUser] = useState<User>();

	useEffect(() => {
		// Fetch user
		fetchWithTimeout(`${RouteBases.api}/${Routes.user()}`, { headers })
			.then((result) => result.json<User>())
			.then(setUser)
			.catch(console.error);
	}, [headers]);

	return (
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
	);
};
