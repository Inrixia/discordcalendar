import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import { OAuth2Routes, OAuth2Scopes } from "discord-api-types/v10";

export type DiscordOAuthProviderProps = { clientId: string; scope: OAuth2Scopes[]; redirect_uri: string; children: ReactNode };

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

type AuthContext = { tokenType: string | null; accessToken: string | null; scope: string | null; headers?: { Authorization: string } };
const nullAuthContext = { tokenType: null, accessToken: null, scope: null };
const DiscordOAuthContext = createContext<AuthContext>(nullAuthContext);

const removeHash = () => window.history.pushState("", document.title, window.location.pathname + window.location.search);

type AuthError = { error: string | null; description: string | null };

export const DiscordOAuthProvider = (props: DiscordOAuthProviderProps) => {
	const hasToken = useRef(false);
	const [tokenContext, setTokenContext] = useState<AuthContext>(nullAuthContext);
	const [authError, setAuthError] = useState<AuthError | null>(null);

	useEffect(() => {
		if (hasToken.current) return;
		hasToken.current = true;
		switch (getAuthStage()) {
			case AuthStage.Unauthenticated: {
				const redirectUrl = new URL(OAuth2Routes.authorizationURL);
				redirectUrl.searchParams.append("state", setDiscordState());
				redirectUrl.searchParams.append("response_type", "token");
				redirectUrl.searchParams.append("client_id", props.clientId);
				redirectUrl.searchParams.append("scope", props.scope.join(" "));
				redirectUrl.searchParams.append("redirect_uri", props.redirect_uri);

				setAuthStage(AuthStage.Loading);
				window.location.href = redirectUrl.href;
				break;
			}
			case AuthStage.Loading: {
				const hash = new URLSearchParams(window.location.hash.substring(1));
				const discordState = getDiscordState();
				if (discordState !== null && discordState !== hash.get("state")) break;
				if (hash.get("error") !== null) {
					setAuthError({
						error: hash.get("error"),
						description: hash.get("error_description"),
					});
					break;
				}
				clearDiscordState();
				setAuthStage(AuthStage.Authenticated);
				const tokenType = hash.get("token_type");
				const accessToken = hash.get("access_token");
				setTokenContext({
					tokenType,
					accessToken,
					scope: hash.get("scope"),
					headers: { Authorization: `${tokenType} ${accessToken}` },
				});
				removeHash();
				break;
			}
			case AuthStage.Authenticated: {
				if (tokenContext.accessToken === null) {
					setAuthStage(AuthStage.Unauthenticated);
					hasToken.current = false;
				}
			}
		}
	}, [props, tokenContext.accessToken]);

	const memoContext = useMemo(() => tokenContext, [tokenContext]);

	if (authError !== null)
		return (
			<>
				An error occoured while attempting to authenticate: {authError.error}
				<br />
				{authError.description}
			</>
		);
	if (!hasToken.current) {
		setTimeout(() => {
			if (!hasToken.current) setAuthStage(AuthStage.Unauthenticated);
		}, 1000);
		return null;
	}
	return <DiscordOAuthContext.Provider value={memoContext}>{props.children}</DiscordOAuthContext.Provider>;
};

export const useDiscordOAuth = () => {
	const context = useContext(DiscordOAuthContext);
	if (!context) throw new Error("Components must be wrapped within DiscordOAuthProvider");
	return context;
};
