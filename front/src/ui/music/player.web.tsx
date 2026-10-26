import { type ReactNode, useEffect, useRef, useState } from "react";
import type { MusicSong } from "~/models/music";
import { useToken } from "~/providers/account-context";
import { coverUrl, streamUrl } from "./api";
import {
	MusicPlayerContext,
	type MusicPlayerState,
	type RepeatMode,
	shuffled,
} from "./player-state";

export { useMusicPlayer } from "./player-state";

// Web implementation: a single HTMLAudioElement shared by the whole app so
// music keeps playing while navigating. Auth is the `X-Bearer` cookie kyoo
// already sets for <img>/<video> tags.
export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
	const { apiUrl } = useToken();
	const audio = useRef<HTMLAudioElement | null>(null);

	// `original` keeps the user's order so turning shuffle off restores it.
	const [original, setOriginal] = useState<MusicSong[]>([]);
	const [queue, setQueue] = useState<MusicSong[]>([]);
	const [index, setIndex] = useState(-1);
	const [playing, setPlaying] = useState(false);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [shuffle, setShuffleState] = useState(false);
	const [repeat, setRepeat] = useState<RepeatMode>("off");

	const current = index >= 0 ? (queue[index] ?? null) : null;

	// latest values for the audio element's event listeners
	const state = useRef({ queue, index, repeat });
	useEffect(() => {
		state.current = { queue, index, repeat };
	}, [queue, index, repeat]);

	useEffect(() => {
		const el = new Audio();
		el.preload = "auto";
		audio.current = el;
		const onTime = () => setPosition(el.currentTime);
		const onMeta = () =>
			setDuration(Number.isFinite(el.duration) ? el.duration : 0);
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		const onEnded = () => {
			const { queue, index, repeat } = state.current;
			if (repeat === "one") {
				el.currentTime = 0;
				el.play();
			} else if (index + 1 < queue.length) setIndex(index + 1);
			else if (repeat === "all" && queue.length) setIndex(0);
			else setPlaying(false);
		};
		el.addEventListener("timeupdate", onTime);
		el.addEventListener("loadedmetadata", onMeta);
		el.addEventListener("durationchange", onMeta);
		el.addEventListener("play", onPlay);
		el.addEventListener("pause", onPause);
		el.addEventListener("ended", onEnded);
		return () => {
			el.pause();
			el.removeAttribute("src");
			el.removeEventListener("timeupdate", onTime);
			el.removeEventListener("loadedmetadata", onMeta);
			el.removeEventListener("durationchange", onMeta);
			el.removeEventListener("play", onPlay);
			el.removeEventListener("pause", onPause);
			el.removeEventListener("ended", onEnded);
			audio.current = null;
		};
	}, []);

	// load the current song whenever it changes
	const currentId = current?.id;
	useEffect(() => {
		const el = audio.current;
		if (!el) return;
		if (!currentId) {
			el.pause();
			el.removeAttribute("src");
			el.load();
			setPosition(0);
			setDuration(0);
			return;
		}
		el.src = streamUrl(apiUrl, currentId);
		setPosition(0);
		el.play().catch((e) => console.warn("Music playback failed", e));
	}, [currentId, apiUrl]);

	// OS media controls (keyboard media keys, lock screen, headphones)
	useEffect(() => {
		if (typeof navigator === "undefined" || !("mediaSession" in navigator))
			return;
		const ms = navigator.mediaSession;
		if (!current) {
			ms.metadata = null;
			return;
		}
		ms.metadata = new MediaMetadata({
			title: current.title,
			artist: current.artist ?? "",
			album: current.album ?? "",
			artwork: current.coverArt
				? [
						{
							src: coverUrl(apiUrl, current.coverArt, 512),
							sizes: "512x512",
						},
					]
				: [],
		});
	}, [current, apiUrl]);

	const playQueue = (songs: MusicSong[], startIndex = 0) => {
		if (!songs.length) return;
		setOriginal(songs);
		if (shuffle) {
			const first = songs[startIndex];
			const rest = shuffled(songs.filter((_, i) => i !== startIndex));
			setQueue([first, ...rest]);
			setIndex(0);
		} else {
			setQueue(songs);
			setIndex(startIndex);
		}
	};

	const addToQueue = (songs: MusicSong[]) => {
		if (!songs.length) return;
		if (index < 0) return playQueue(songs);
		setOriginal((o) => [...o, ...songs]);
		setQueue((q) => [...q, ...songs]);
	};

	const toggle = () => {
		const el = audio.current;
		if (!el || !current) return;
		if (el.paused) el.play();
		else el.pause();
	};

	const next = () => {
		if (!queue.length) return;
		if (index + 1 < queue.length) setIndex(index + 1);
		else if (repeat === "all") setIndex(0);
	};

	const previous = () => {
		const el = audio.current;
		// restart the song if we are a few seconds in, like most players
		if (el && el.currentTime > 3) {
			el.currentTime = 0;
			return;
		}
		if (index > 0) setIndex(index - 1);
		else if (el) el.currentTime = 0;
	};

	const seek = (seconds: number) => {
		const el = audio.current;
		if (!el) return;
		el.currentTime = seconds;
		setPosition(seconds);
	};

	const setShuffle = (value: boolean) => {
		setShuffleState(value);
		if (!current) return;
		if (value) {
			const rest = shuffled(queue.filter((_, i) => i !== index));
			setQueue([current, ...rest]);
			setIndex(0);
		} else {
			const i = original.findIndex((s) => s.id === current.id);
			setQueue(original);
			setIndex(Math.max(0, i));
		}
	};

	const cycleRepeat = () =>
		setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));

	const stop = () => {
		setQueue([]);
		setOriginal([]);
		setIndex(-1);
	};

	useEffect(() => {
		if (typeof navigator === "undefined" || !("mediaSession" in navigator))
			return;
		const ms = navigator.mediaSession;
		ms.setActionHandler("play", () => audio.current?.play());
		ms.setActionHandler("pause", () => audio.current?.pause());
		ms.setActionHandler("nexttrack", next);
		ms.setActionHandler("previoustrack", previous);
		ms.setActionHandler("seekto", (d) => {
			if (d.seekTime !== undefined) seek(d.seekTime);
		});
	});

	const value: MusicPlayerState = {
		supported: true,
		queue,
		index,
		current,
		playing,
		position,
		duration: duration || current?.duration || 0,
		shuffle,
		repeat,
		playQueue,
		addToQueue,
		toggle,
		next,
		previous,
		seek,
		setShuffle,
		cycleRepeat,
		stop,
	};

	return (
		<MusicPlayerContext.Provider value={value}>
			{children}
		</MusicPlayerContext.Provider>
	);
};
