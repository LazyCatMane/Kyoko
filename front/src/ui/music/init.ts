import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";
import { useToken } from "~/providers/account-context";
import { musicUrl } from "./api";

// Navidrome only auto-creates a user authenticated through the reverse proxy
// (Remote-User header) when its web app is loaded, not on subsonic api calls.
// Load it once per session before making any music request.
export const useMusicReady = () => {
	const { apiUrl, authToken } = useToken();
	const { isSuccess, isError } = useQuery({
		queryKey: ["kyoko-music-init", apiUrl, authToken],
		queryFn: async () => {
			const resp = await fetch(`${musicUrl(apiUrl)}/app/`, {
				// web relies on the X-Bearer cookie, native needs the header
				headers:
					authToken && Platform.OS !== "web"
						? { Authorization: `Bearer ${authToken}` }
						: undefined,
				credentials: "include",
			});
			if (!resp.ok) throw { status: resp.status, message: resp.statusText };
			return true;
		},
		staleTime: Number.POSITIVE_INFINITY,
		retry: 1,
	});
	// on error still try the real queries so their error message is shown
	return isSuccess || isError;
};
