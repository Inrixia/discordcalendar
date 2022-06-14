import { CircularProgress, Grid, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const LoadingComponent = () => (
	<Grid container direction="column" alignItems="center" justifyContent="center">
		<h1>Loading</h1>
		<CircularProgress />
	</Grid>
);

export const LoadingPage = () => (
	<Grid container direction="column" alignItems="center" justifyContent="center" style={{ minHeight: "100vh" }}>
		<LoadingComponent />
	</Grid>
);

export const Error404 = () => {
	const navigate = useNavigate();
	return (
		<Grid container direction="column" alignItems="center" justifyContent="center" style={{ minHeight: "100vh" }}>
			<b>Error 404</b>
			Sorry we couldn't find that page...
			<Button onClick={() => navigate(-1)}>Go Back</Button>
		</Grid>
	);
};

export const UnauthenticatedTester = () => (
	<Grid container direction="column" alignItems="center" justifyContent="center" style={{ minHeight: "100vh" }}>
		<b>Unauthorized</b>
		Sorry you dont have permission to access this. Please contract an administrator.
	</Grid>
);
