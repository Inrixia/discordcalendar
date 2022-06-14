import { useDiscordOAuth } from "./DiscordOAuthProvider";

export const Home = () => {
	const discordInfo = useDiscordOAuth();
	console.log(discordInfo);
	return <>Hello There</>;
};
