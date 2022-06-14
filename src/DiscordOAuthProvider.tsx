import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

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

const removeHash = () => window.history.pushState("", document.title, window.location.pathname + window.location.search);

export const DiscordOAuthProvider = (props: DiscordOAuthProviderProps) => {
	const [tokenContext, setTokenContext] = useState<AuthContext>(nullAuthContext);

	const hasToken = useRef(false);

	useEffect(() => {
		if (hasToken.current) return;
		hasToken.current = true;
		switch (getAuthStage()) {
			case AuthStage.Unauthenticated: {
				const redirectUrl = new URL("https://discord.com/api/oauth2/authorize");
				redirectUrl.searchParams.append("state", setDiscordState());
				redirectUrl.searchParams.append("response_type", "token");
				redirectUrl.searchParams.append("client_id", props.clientId);
				redirectUrl.searchParams.append("scope", props.scope);
				redirectUrl.searchParams.append("redirect_uri", props.redirect_uri);

				setAuthStage(AuthStage.Loading);
				window.location.href = redirectUrl.href;
				break;
			}
			case AuthStage.Loading: {
				const hash = new URLSearchParams(window.location.hash.substring(1));
				const discordState = getDiscordState();
				if (discordState !== null && discordState !== hash.get("state")) break;
				clearDiscordState();
				setAuthStage(AuthStage.Authenticated);
				const hashInfo = {
					tokenType: hash.get("token_type"),
					accessToken: hash.get("access_token"),
					scope: hash.get("scope"),
				};
				setTokenContext(hashInfo);
				removeHash();
				break;
			}
		}
	}, [props]);

	return <DiscordOAuthContext.Provider value={useMemo(() => tokenContext, [tokenContext])}>{props.children}</DiscordOAuthContext.Provider>;
};

export const useDiscordOAuth = () => {
	const context = useContext(DiscordOAuthContext);
	if (!context) throw new Error("Components must be wrapped within DiscordOAuthProvider");
	return context;
};
