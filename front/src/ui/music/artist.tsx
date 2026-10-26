import { ScrollView, View } from "react-native";
import { H1, H3, Skeleton, SubP } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { useFetch } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { useQueryState } from "~/utils";
import { artistQuery } from "./api";
import { MusicBarSpacer } from "./bar";
import { useMusicReady } from "./init";
import { AlbumCard, CardLoader } from "./components";
import { musicError } from "./index";

export const ArtistPage = () => {
	const [id] = useQueryState("id", undefined!);
	const { apiUrl } = useToken();
	const ready = useMusicReady();
	const { data, error } = useFetch(artistQuery(apiUrl, id, ready));

	if (error) return <EmptyView message={musicError(error)} />;

	// newest albums first
	const albums = [...(data?.album ?? [])].sort(
		(a, b) => (b.year ?? 0) - (a.year ?? 0),
	);

	return (
		<ScrollView contentContainerClassName="p-2 md:p-4">
			{data ? (
				<View className="mb-4">
					<SubP className="uppercase">Artist</SubP>
					<H1>{data.name}</H1>
					<SubP>
						{albums.length} {albums.length === 1 ? "album" : "albums"}
					</SubP>
				</View>
			) : (
				<Skeleton className="mb-4 h-10 w-1/2" />
			)}
			<H3>Albums</H3>
			<View className="flex-row flex-wrap">
				{data
					? albums.map((a) => <AlbumCard key={a.id} album={a} />)
					: [...Array(6)].map((_, i) => <CardLoader key={i} />)}
			</View>
			<MusicBarSpacer />
		</ScrollView>
	);
};
