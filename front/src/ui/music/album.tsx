import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import QueueMusic from "@material-symbols/svg-400/rounded/queue_music.svg";
import Shuffle from "@material-symbols/svg-400/rounded/shuffle.svg";
import { ScrollView, View } from "react-native";
import { Button, H1, Link, P, Poster, Skeleton, SubP } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useFetch } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { useQueryState } from "~/utils";
import { albumQuery, coverImage, formatDuration } from "./api";
import { MusicBarSpacer } from "./bar";
import { NativeNotice, SongRow } from "./components";
import { musicError } from "./index";
import { shuffled } from "./player-state";
import { useMusicPlayer } from "./player";

export const AlbumPage = () => {
	const [id] = useQueryState("id", undefined!);
	const { apiUrl } = useToken();
	const player = useMusicPlayer();
	const { data, error } = useFetch(albumQuery(apiUrl, id));

	if (error) return <EmptyView message={musicError(error)} />;

	const songs = data?.song ?? [];
	// group by disc when the album has more than one
	const discs = [...new Set(songs.map((s) => s.discNumber ?? 1))];

	return (
		<ScrollView contentContainerClassName="p-2 md:p-4">
			<View className="flex-col gap-4 sm:flex-row">
				<Poster
					src={data ? coverImage(apiUrl, data.coverArt) : null}
					quality="high"
					alt={data?.name}
					className="aspect-square w-60 max-w-full self-center sm:self-start"
				/>
				<View className="min-w-0 flex-1 justify-end gap-1">
					{data ? (
						<>
							<SubP className="uppercase">Album</SubP>
							<H1 numberOfLines={2}>{data.name}</H1>
							<View className="flex-row flex-wrap items-center gap-2">
								{data.artistId ? (
									<Link href={`/music/artist/${data.artistId}`}>
										<P className="font-bold hover:underline">{data.artist}</P>
									</Link>
								) : (
									<P className="font-bold">{data.artist}</P>
								)}
								<SubP>
									{[
										data.year,
										data.genre,
										`${songs.length} ${songs.length === 1 ? "song" : "songs"}`,
										formatDuration(data.duration),
									]
										.filter(Boolean)
										.join(" · ")}
								</SubP>
							</View>
							<View className="mt-2 flex-row flex-wrap gap-2">
								<Button
									icon={PlayArrow}
									text="Play"
									onPress={() => player.playQueue(songs, 0)}
									disabled={!songs.length || !player.supported}
								/>
								<Button
									icon={Shuffle}
									text="Shuffle"
									onPress={() => player.playQueue(shuffled(songs), 0)}
									disabled={!songs.length || !player.supported}
								/>
								<Button
									icon={QueueMusic}
									text="Add to queue"
									onPress={() => player.addToQueue(songs)}
									disabled={!songs.length || !player.supported}
								/>
							</View>
						</>
					) : (
						<>
							<Skeleton className="h-10 w-2/3" />
							<Skeleton className="w-1/3" />
						</>
					)}
				</View>
			</View>
			<NativeNotice />
			<View className="mt-4">
				{discs.map((disc) => (
					<View key={disc}>
						{discs.length > 1 && <SubP className="mt-3 px-2">Disc {disc}</SubP>}
						{songs.map((s, i) =>
							(s.discNumber ?? 1) === disc ? (
								<SongRow key={s.id} song={s} songs={songs} index={i} />
							) : null,
						)}
					</View>
				))}
			</View>
			<MusicBarSpacer />
		</ScrollView>
	);
};
