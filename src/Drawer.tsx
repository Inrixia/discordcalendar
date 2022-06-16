import { styled, Theme, CSSObject } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";

export const getDrawerHelpers = (drawerWidth: number) => {
	const openedMixin = (theme: Theme): CSSObject => ({
		width: drawerWidth,
		transition: theme.transitions.create("width", {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen,
		}),
		overflowX: "hidden",
	});

	const closedMixin = (theme: Theme): CSSObject => ({
		transition: theme.transitions.create("width", {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen,
		}),
		overflowX: "hidden",
		width: `calc(${theme.spacing(8)} + 1px)`,
		[theme.breakpoints.up("sm")]: {
			width: `calc(${theme.spacing(9)} + 1px)`,
		},
	});
	return {
		DrawerHeader: styled("div")(({ theme }) => ({
			display: "flex",
			alignItems: "center",
			justifyContent: "flex-end",
			padding: theme.spacing(0, 1),
			// necessary for content to be below app bar
			...theme.mixins.toolbar,
		})),

		Drawer: styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(({ theme, open }) => ({
			width: drawerWidth,
			flexShrink: 0,
			whiteSpace: "nowrap",
			boxSizing: "border-box",
			...(open && {
				...openedMixin(theme),
				"& .MuiDrawer-paper": openedMixin(theme),
			}),
			...(!open && {
				...closedMixin(theme),
				"& .MuiDrawer-paper": closedMixin(theme),
			}),
		})),
	};
};
