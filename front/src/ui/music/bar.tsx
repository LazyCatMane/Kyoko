import Close from "@material-symbols/svg-400/rounded/close.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Repeat from "@material-symbols/svg-400/rounded/repeat.svg";
import RepeatOne from "@material-symbols/svg-400/rounded/repeat_one.svg";
import Shuffle from "@material-symbols/svg-400/rounded/shuffle.svg";
import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import { usePathname } from "expo-router";
import { Platform, View } from "react-native";
import { Portal } from "react-native-teleport";
import { useToken } from "~/providers/account-context";
import { IconButton, Image, Link, P, Slider, SubP, tooltip } from "~/primitives";
import { cn } from "~/utils";
import { coverImage, formatDuration } from "./api";
import { useMusicPlayer } from "./player";

// Persistent "now playing" bar shown at the bottom of every page while music
// is loaded. Hidden on the video player screen.
export const MusicBar = () => {
	const player = useMusicPlayer();
	const pathname = usePathname();
	const { apiUrl } = useToken();

	if (!player.supported || !player.current) return null;
	if (pathname.startsWith("/watch")) return null;

	const song = player.current;
	const active = "fill-accent";
	const idle = "fill-slate-200";

	return (
		// the root portal host lets clicks through by default (like modals do, we
		// must opt in). `box-none` keeps the rest of the page clickable and only
		// the bar itself receives presses.
		<Portal hostName="root" style={{ pointerEvents: "box-none" }}>
			<View
				style={{ pointerEvents: "auto", zIndex: 50 }}
				className={cn(
					"absolute right-0 bottom-0 left-0 border-slate-700 border-t bg-slate-900/95",
					Platform.OS === "web" && "backdrop-blur",
				)}
			>
				<Slider
					progress={player.position}
					max={player.duration || 1}
					setProgress={player.seek}
					className="px-2 py-1"
				/>
				<View className="flex-row items-center gap-2 px-2 py-1">
					<Link
						href={song.albumId ? `/music/album/${song.albumId}` : undefined}
						className="min-w-0 flex-1 flex-row items-center gap-2"
					>
						<Image
							src={coverImage(apiUrl, song.coverArt)}
							quality="low"
							alt={song.album}
							className="h-12 w-12 shrink-0"
						/>
						<View className="min-w-0 flex-1">
							<P numberOfLines={1} className="text-slate-100">
								{song.title}
							</P>
							<SubP numberOfLines={1} className="text-slate-400">
								{[song.artist, song.album].filter(Boolean).join(" · ")}
							</SubP>
						</View>
					</Link>
					<View className="flex-row items-center">
						<IconButton
							icon={Shuffle}
							onPress={() => player.setShuffle(!player.shuffle)}
							iconClassName={player.shuffle ? active : idle}
							className="max-sm:hidden"
							{...tooltip("Shuffle")}
						/>
						<IconButton
							icon={SkipPrevious}
							onPress={player.previous}
							iconClassName={idle}
							{...tooltip("Previous")}
						/>
						<IconButton
							icon={player.playing ? Pause : PlayArrow}
							onPress={player.toggle}
							iconClassName={idle}
							{...tooltip(player.playing ? "Pause" : "Play")}
						/>
						<IconButton
							icon={SkipNext}
							onPress={player.next}
							iconClassName={idle}
							{...tooltip("Next")}
						/>
						<IconButton
							icon={player.repeat === "one" ? RepeatOne : Repeat}
							onPress={player.cycleRepeat}
							iconClassName={player.repeat === "off" ? idle : active}
							className="max-sm:hidden"
							{...tooltip(`Repeat: ${player.repeat}`)}
						/>
					</View>
					<SubP className="w-24 text-right text-slate-400 max-md:hidden">
						{formatDuration(player.position)} /{" "}
						{formatDuration(player.duration)}
					</SubP>
					<IconButton
						icon={Close}
						onPress={player.stop}
						iconClassName={idle}
						{...tooltip("Stop")}
					/>
				</View>
			</View>
		</Portal>
	);
};

// spacer so page content can scroll above the bar
export const MusicBarSpacer = () => {
	const player = useMusicPlayer();
	if (!player.supported || !player.current) return null;
	return <View className="h-20" />;
};
