import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DiscordOAuthProvider } from "./DiscordOAuthProvider";
import { Error404 } from "./GenericPages";
import { Home } from "./Home";

import { OAuth2Scopes } from "discord-api-types/v10";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const clientId = "982998156558078022";
const scope = [OAuth2Scopes.Identify];
const redirectUri = "http://localhost:3000";

const theme = createTheme({
	palette: {
		mode: "dark",
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
