import { createContext, useContext } from "react";
import type { MusicSong } from "~/models/music";

export type RepeatMode = "off" | "all" | "one";

export type MusicPlayerState = {
	supported: boolean;
	queue: MusicSong[];
	index: number;
	current: MusicSong | null;
	playing: boolean;
	position: number;
	duration: number;
	shuffle: boolean;
	repeat: RepeatMode;
	playQueue: (songs: MusicSong[], startIndex?: number) => void;
	addToQueue: (songs: MusicSong[]) => void;
	toggle: () => void;
	next: () => void;
	previous: () => void;
	seek: (seconds: number) => void;
	setShuffle: (shuffle: boolean) => void;
	cycleRepeat: () => void;
	stop: () => void;
};

const noop = () => {};

export const emptyPlayer: MusicPlayerState = {
	supported: false,
	queue: [],
	index: -1,
	current: null,
	playing: false,
	position: 0,
	duration: 0,
	shuffle: false,
	repeat: "off",
	playQueue: noop,
	addToQueue: noop,
	toggle: noop,
	next: noop,
	previous: noop,
	seek: noop,
	setShuffle: noop,
	cycleRepeat: noop,
	stop: noop,
};

export const MusicPlayerContext = createContext<MusicPlayerState>(emptyPlayer);

export const useMusicPlayer = () => useContext(MusicPlayerContext);

export const shuffled = <T>(items: T[]) => {
	const ret = [...items];
	for (let i = ret.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[ret[i], ret[j]] = [ret[j], ret[i]];
	}
	return ret;
};
