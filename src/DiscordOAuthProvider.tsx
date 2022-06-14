import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export type DiscordOAuthProviderProps = { clientId: string; scope: string; redirect_uri: string; children: ReactNode };

enum AuthStage {
	Unauthenticated = "-1",
	Loading = "0",
	Authenticated = "1",
}
const getAuthStage = (): AuthStage => {
	const authStageString = sessionStorage.getItem("authStage");
	if (authStageString !== AuthStage.Authenticated && authStageString !== AuthStage.Loading && authStageString !== AuthStage.Unauthenticated) {
		return AuthStage.Unauthenticated;
	}
	return authStageString;
};
const setAuthStage = (authStage: AuthStage): void => sessionStorage.setItem("authStage", authStage);

const getDiscordState = () => sessionStorage.getItem("discordState");
const clearDiscordState = () => sessionStorage.removeItem("discordState");
const setDiscordState = (): string => {
	const randString = (Math.random() * Date.now()).toString();
	sessionStorage.setItem("discordState", randString);
	return randString;
};

type AuthContext = { tokenType: null | string; accessToken: null | string; scope: null | string };
const nullAuthContext = { tokenType: null, accessToken: null, scope: null };
const DiscordOAuthContext = createContext<AuthContext>(nullAuthContext);

export const DiscordOAuthProvider = (props: DiscordOAuthProviderProps) => {
	const [context, setContext] = useState<AuthContext>(nullAuthContext);
	switch (getAuthStage()) {
		case AuthStage.Unauthenticated: {
			console.log("Unauthenticated");
			const redirectUrl = new URL("https://discord.com/api/oauth2/authorize");
			redirectUrl.searchParams.append("state", setDiscordState());
			redirectUrl.searchParams.append("response_type", "token");
			redirectUrl.searchParams.append("client_id", props.clientId);
			redirectUrl.searchParams.append("scope", props.scope);
			redirectUrl.searchParams.append("redirect_uri", props.redirect_uri);

			setAuthStage(AuthStage.Loading);
			window.location.href = redirectUrl.href;
			return null;
		}
		case AuthStage.Loading: {
			const hash = new URLSearchParams(window.location.hash.substring(1));
			const discordState = getDiscordState();
			if (discordState !== null && discordState !== hash.get("state")) return null;
			clearDiscordState();
			setAuthStage(AuthStage.Authenticated);
			setContext({
				tokenType: hash.get("token_type"),
				accessToken: hash.get("access_token"),
				scope: hash.get("scope"),
			});
			window.location.href = "";
			break;
		}
	}

	return <DiscordOAuthContext.Provider value={context}>{props.children}</DiscordOAuthContext.Provider>;
};

export const useDiscordOAuth = () => {
	const context = useContext(DiscordOAuthContext);
	if (!context) throw new Error("Components must be wrapped within DiscordOAuthProvider");
	return context;
};
