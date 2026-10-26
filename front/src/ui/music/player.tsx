import type { ReactNode } from "react";
import { emptyPlayer, MusicPlayerContext } from "./player-state";

export { useMusicPlayer } from "./player-state";

// Native (android/ios/tv) playback is not implemented yet: browsing works,
// playing music is web-only for now (see player.web.tsx).
export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
	return (
		<MusicPlayerContext.Provider value={emptyPlayer}>
			{children}
		</MusicPlayerContext.Provider>
	);
};
