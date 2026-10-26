import Search from "@material-symbols/svg-400/rounded/search.svg";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Chip, H2, H3, Icon, Input, P } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useFetch } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { useQueryState } from "~/utils";
import {
	type AlbumListType,
	albumListQuery,
	artistsQuery,
	searchQuery,
} from "./api";
import { MusicBarSpacer } from "./bar";
import {
	AlbumCard,
	ArtistCard,
	CardLoader,
	NativeNotice,
	SongRow,
} from "./components";

const views = {
	newest: "Recently added",
	recent: "Recently played",
	frequent: "Most played",
	alphabeticalByName: "A–Z",
	random: "Random",
	artists: "Artists",
} as const;
type View_ = keyof typeof views;

export const MusicPage = () => {
	const [view, setView] = useQueryState<View_>("view", "newest");
	const [search, setSearch] = useState("");

	return (
		<ScrollView contentContainerClassName="p-2 md:p-4">
			<View className="flex-row flex-wrap items-center justify-between gap-2">
				<H2>Music</H2>
				<Input
					value={search}
					onChangeText={setSearch}
					placeholder="Search music"
					left={<Icon icon={Search} className="fill-slate-400" />}
					containerClassName="w-full sm:w-80"
				/>
			</View>
			<NativeNotice />
			{search ? (
				<SearchResults text={search} />
			) : (
				<>
					<View className="my-3 flex-row flex-wrap gap-2">
						{(Object.keys(views) as View_[]).map((key) => (
							<Chip
								key={key}
								label={views[key]}
								outline={view !== key}
								href={null}
								onPress={() => setView(key)}
							/>
						))}
					</View>
					{view === "artists" ? (
						<ArtistsGrid />
					) : (
						<AlbumsGrid type={view as AlbumListType} />
					)}
				</>
			)}
			<MusicBarSpacer />
		</ScrollView>
	);
};

const AlbumsGrid = ({ type }: { type: AlbumListType }) => {
	const { apiUrl } = useToken();
	const { data, error } = useFetch(albumListQuery(apiUrl, type));

	if (error) return <EmptyView message={musicError(error)} />;
	if (data && !data.length)
		return (
			<EmptyView message="No albums yet. Add music to the music folder and it will show up after the next scan." />
		);
	return (
		<View className="flex-row flex-wrap">
			{data
				? data.map((a) => <AlbumCard key={a.id} album={a} />)
				: [...Array(12)].map((_, i) => <CardLoader key={i} />)}
		</View>
	);
};

const ArtistsGrid = () => {
	const { apiUrl } = useToken();
	const { data, error } = useFetch(artistsQuery(apiUrl));

	if (error) return <EmptyView message={musicError(error)} />;
	if (data && !data.length) return <EmptyView message="No artists yet." />;
	return (
		<View className="flex-row flex-wrap">
			{data
				? data.map((a) => <ArtistCard key={a.id} artist={a} />)
				: [...Array(12)].map((_, i) => <CardLoader key={i} round />)}
		</View>
	);
};

const SearchResults = ({ text }: { text: string }) => {
	const { apiUrl } = useToken();
	const { data, error } = useFetch(searchQuery(apiUrl, text));

	if (error) return <EmptyView message={musicError(error)} />;
	if (!data) return <P className="my-4">Searching…</P>;
	if (!data.artist.length && !data.album.length && !data.song.length)
		return <EmptyView message={`Nothing found for "${text}".`} />;

	return (
		<View className="mt-3 gap-4">
			{data.song.length > 0 && (
				<View>
					<H3>Songs</H3>
					{data.song.map((s, i) => (
						<SongRow
							key={s.id}
							song={s}
							songs={data.song}
							index={i}
							showArtist
							showNumber={false}
						/>
					))}
				</View>
			)}
			{data.album.length > 0 && (
				<View>
					<H3>Albums</H3>
					<View className="flex-row flex-wrap">
						{data.album.map((a) => (
							<AlbumCard key={a.id} album={a} />
						))}
					</View>
				</View>
			)}
			{data.artist.length > 0 && (
				<View>
					<H3>Artists</H3>
					<View className="flex-row flex-wrap">
						{data.artist.map((a) => (
							<ArtistCard key={a.id} artist={a} />
						))}
					</View>
				</View>
			)}
		</View>
	);
};

export const musicError = (error: { status?: unknown; message?: string }) => {
	if (error.status === 401 || error.status === 403)
		return "You need to be logged in to access music.";
	if (error.status === 404 || error.status === 502 || error.status === 503)
		return "The music server is not reachable. Is navidrome running?";
	return error.message ?? "Could not load music.";
};
