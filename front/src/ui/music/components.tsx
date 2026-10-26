import Person from "@material-symbols/svg-400/rounded/person-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import QueueMusic from "@material-symbols/svg-400/rounded/queue_music.svg";
import { View } from "react-native";
import type { MusicAlbum, MusicArtist, MusicSong } from "~/models/music";
import {
	Icon,
	IconButton,
	Link,
	P,
	Poster,
	PressableFeedback,
	Skeleton,
	SubP,
	tooltip,
} from "~/primitives";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";
import { coverImage, formatDuration } from "./api";
import { useMusicPlayer } from "./player";

export const gridItem = "w-1/3 p-1 sm:w-1/4 md:w-1/5 lg:w-1/6 xl:w-1/8";

export const AlbumCard = ({ album }: { album: MusicAlbum }) => {
	const { apiUrl } = useToken();
	return (
		<Link
			href={`/music/album/${album.id}`}
			className={cn("group outline-0", gridItem)}
		>
			<Poster
				src={coverImage(apiUrl, album.coverArt)}
				quality="medium"
				alt={album.name}
				className="aspect-square w-full ring-accent group-highlighted:ring-3"
			/>
			<P numberOfLines={1} className="group-highlighted:underline">
				{album.name}
			</P>
			<SubP numberOfLines={1}>
				{[album.artist, album.year].filter(Boolean).join(" · ")}
			</SubP>
		</Link>
	);
};

export const ArtistCard = ({ artist }: { artist: MusicArtist }) => {
	const { apiUrl } = useToken();
	const image = coverImage(apiUrl, artist.coverArt);
	return (
		<Link
			href={`/music/artist/${artist.id}`}
			className={cn("group items-center outline-0", gridItem)}
		>
			{image ? (
				<Poster
					src={image}
					quality="medium"
					alt={artist.name}
					className="aspect-square w-full rounded-full ring-accent group-highlighted:ring-3"
				/>
			) : (
				<View className="aspect-square w-full items-center justify-center rounded-full bg-gray-300 dark:bg-gray-700">
					<Icon icon={Person} className="h-1/3 w-1/3 fill-slate-500" />
				</View>
			)}
			<P
				numberOfLines={1}
				className="text-center group-highlighted:underline"
			>
				{artist.name}
			</P>
			{artist.albumCount !== undefined && (
				<SubP className="text-center">
					{artist.albumCount} {artist.albumCount === 1 ? "album" : "albums"}
				</SubP>
			)}
		</Link>
	);
};

export const CardLoader = ({ round = false }: { round?: boolean }) => (
	<View className={gridItem}>
		<Skeleton
			variant="custom"
			className={cn("aspect-square w-full", round && "rounded-full")}
		/>
		<Skeleton />
		<Skeleton className="w-1/2" />
	</View>
);

export const SongRow = ({
	song,
	songs,
	index,
	showArtist = false,
	showNumber = true,
}: {
	song: MusicSong;
	songs: MusicSong[];
	index: number;
	showArtist?: boolean;
	showNumber?: boolean;
}) => {
	const player = useMusicPlayer();
	const isCurrent = player.current?.id === song.id;

	return (
		<PressableFeedback
			onPress={() => player.playQueue(songs, index)}
			className={cn(
				"group flex-row items-center gap-3 rounded px-2 py-2 hover:bg-slate-500/20",
				isCurrent && "bg-accent/20",
			)}
		>
			<View className="w-8 items-center">
				{isCurrent && player.playing ? (
					<Icon icon={PlayArrow} className="fill-accent" />
				) : (
					<SubP>{showNumber ? (song.track ?? index + 1) : index + 1}</SubP>
				)}
			</View>
			<View className="min-w-0 flex-1">
				<P numberOfLines={1} className={cn(isCurrent && "text-accent")}>
					{song.title}
				</P>
				{showArtist && (
					<SubP numberOfLines={1}>
						{[song.artist, song.album].filter(Boolean).join(" · ")}
					</SubP>
				)}
			</View>
			<IconButton
				icon={QueueMusic}
				onPress={() => player.addToQueue([song])}
				className="opacity-0 group-hover:opacity-100 max-md:opacity-100"
				iconClassName="fill-slate-400"
				{...tooltip("Add to queue")}
			/>
			<SubP className="w-14 text-right">{formatDuration(song.duration)}</SubP>
		</PressableFeedback>
	);
};

export const NativeNotice = () => {
	const player = useMusicPlayer();
	if (player.supported) return null;
	return (
		<View className="m-2 rounded bg-slate-500/20 p-3">
			<P>Music playback is only available in the web app for now.</P>
		</View>
	);
};
