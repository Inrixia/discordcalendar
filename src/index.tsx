import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DiscordOAuthProvider } from "./components/DiscordOAuthProvider";
import { Error404 } from "./components/GenericPages";
import { Home } from "./Home";

import { OAuth2Scopes } from "discord-api-types/v10";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { clientId } from "./helpers";

const scope = [OAuth2Scopes.Identify, OAuth2Scopes.Guilds];
const redirectUri = window.location.origin;

const theme = createTheme({
	palette: {
		mode: "dark",
		text: {
			primary: "#dcd8d9",
		},
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					"::-webkit-scrollbar, & *::-webkit-scrollbar": {
						width: "5px",
					},

					/* Track */
					"::-webkit-scrollbar-track": {
						background: "#e5e5e5",
					},

					/* Handle */
					"&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
						background: "#888",
					},

					/* Handle on hover */
					"&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
						background: "#555",
					},
				},
			},
		},
	},
});

Sentry.init({
	dsn: "https://4f2886af890f4674ac64e5019408aac5@o1295031.ingest.sentry.io/6520025",
	integrations: [new BrowserTracing()],
	tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<BrowserRouter>
				<DiscordOAuthProvider clientId={clientId} scope={scope} redirect_uri={redirectUri}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route element={<Error404 />} />
					</Routes>
				</DiscordOAuthProvider>
			</BrowserRouter>
		</ThemeProvider>
	</React.StrictMode>
);
