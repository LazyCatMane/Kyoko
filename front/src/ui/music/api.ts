import type { KImage } from "~/models";
import {
	MusicAlbumListResponse,
	MusicAlbumResponse,
	MusicArtistResponse,
	MusicArtistsResponse,
	MusicSearchResponse,
} from "~/models/music";
import type { QueryIdentifier } from "~/query";

// subsonic client params. navidrome ignores u/t/s because kyoo's auth +
// traefik set the user via the Remote-User header.
export const subsonicParams = {
	f: "json",
	v: "1.16.1",
	c: "kyoko",
} as const;

const query = (params: Record<string, string>) =>
	new URLSearchParams({ ...subsonicParams, ...params }).toString();

export const musicUrl = (apiUrl: string) =>
	`${apiUrl.replace(/\/$/, "")}/navidrome`;

export const streamUrl = (apiUrl: string, id: string) =>
	`${musicUrl(apiUrl)}/rest/stream?${query({ id })}`;

export const coverUrl = (apiUrl: string, id: string, size: number) =>
	`${musicUrl(apiUrl)}/rest/getCoverArt?${query({ id, size: size.toString() })}`;

// a dark neutral blurhash used while album art loads
const placeholderBlurhash = "L03[%0IU00~q00xu00Rj00%M~qof";

// build a KImage so we can reuse kyoo's <Image /> and <Poster /> primitives.
// paths are absolute urls so the primitive does not prefix them again.
export const coverImage = (
	apiUrl: string,
	coverArt: string | undefined,
): KImage | null => {
	if (!coverArt) return null;
	return {
		id: coverArt,
		source: "navidrome",
		blurhash: placeholderBlurhash,
		low: absolute(coverUrl(apiUrl, coverArt, 200)),
		medium: absolute(coverUrl(apiUrl, coverArt, 400)),
		high: absolute(coverUrl(apiUrl, coverArt, 800)),
	} as KImage;
};

// the Image primitive only skips prefixing for urls starting with http.
const absolute = (url: string) => {
	if (url.startsWith("http")) return url;
	if (typeof window !== "undefined" && window.location)
		return `${window.location.origin}${url}`;
	return url;
};

export type AlbumListType =
	| "newest"
	| "recent"
	| "frequent"
	| "alphabeticalByName"
	| "random";

const music = (apiUrl: string) => ({ apiUrl: musicUrl(apiUrl) });

export const albumListQuery = (
	apiUrl: string,
	type: AlbumListType,
	size = 500,
	enabled = true,
): QueryIdentifier<ReturnType<typeof MusicAlbumListResponse.parse>> => ({
	enabled,
	parser: MusicAlbumListResponse,
	path: ["rest", "getAlbumList2"],
	params: { ...subsonicParams, type, size },
	options: music(apiUrl),
});

export const albumQuery = (
	apiUrl: string,
	id: string,
	enabled = true,
): QueryIdentifier<ReturnType<typeof MusicAlbumResponse.parse>> => ({
	enabled,
	parser: MusicAlbumResponse,
	path: ["rest", "getAlbum"],
	params: { ...subsonicParams, id },
	options: music(apiUrl),
});

export const artistsQuery = (
	apiUrl: string,
	enabled = true,
): QueryIdentifier<ReturnType<typeof MusicArtistsResponse.parse>> => ({
	enabled,
	parser: MusicArtistsResponse,
	path: ["rest", "getArtists"],
	params: { ...subsonicParams },
	options: music(apiUrl),
});

export const artistQuery = (
	apiUrl: string,
	id: string,
	enabled = true,
): QueryIdentifier<ReturnType<typeof MusicArtistResponse.parse>> => ({
	enabled,
	parser: MusicArtistResponse,
	path: ["rest", "getArtist"],
	params: { ...subsonicParams, id },
	options: music(apiUrl),
});

export const searchQuery = (
	apiUrl: string,
	text: string,
	enabled = true,
): QueryIdentifier<ReturnType<typeof MusicSearchResponse.parse>> => ({
	parser: MusicSearchResponse,
	path: ["rest", "search3"],
	params: {
		...subsonicParams,
		query: text,
		artistCount: 12,
		albumCount: 24,
		songCount: 30,
	},
	options: music(apiUrl),
	enabled: enabled && text.length > 0,
});

export const formatDuration = (seconds: number | undefined) => {
	if (!seconds || !Number.isFinite(seconds)) return "0:00";
	const s = Math.floor(seconds);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = (s % 60).toString().padStart(2, "0");
	return h ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};
