import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DiscordOAuthProvider } from "./DiscordOAuthProvider";
import { Error404 } from "./GenericPages";
import { Home } from "./Home";

const clientId = "982998156558078022";
const scope = "identify guilds";
const redirectUri = "http://localhost:3000";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<BrowserRouter>
			<DiscordOAuthProvider clientId={clientId} scope={scope} redirect_uri={redirectUri}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route element={<Error404 />} />
				</Routes>
			</DiscordOAuthProvider>
		</BrowserRouter>
	</React.StrictMode>
);
