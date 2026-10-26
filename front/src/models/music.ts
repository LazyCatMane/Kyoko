import { z } from "zod/v4";

// Kyoko: music support. Music is served by navidrome (subsonic api) behind
// `/navidrome`, authenticated by kyoo's own auth. Only the fields we use are parsed.

const subsonic = <T extends z.ZodTypeAny>(key: string, inner: T) =>
	z
		.object({
			"subsonic-response": z.object({
				status: z.literal("ok"),
				[key]: inner,
			}),
		})
		.transform((x) => x["subsonic-response"][key] as z.infer<T>);

export const MusicSong = z.object({
	id: z.string(),
	title: z.string(),
	album: z.string().optional(),
	albumId: z.string().optional(),
	artist: z.string().optional(),
	artistId: z.string().optional(),
	coverArt: z.string().optional(),
	duration: z.number().optional(),
	track: z.number().optional(),
	discNumber: z.number().optional(),
	year: z.number().optional(),
});
export type MusicSong = z.infer<typeof MusicSong>;

export const MusicAlbum = z.object({
	id: z.string(),
	name: z.string(),
	artist: z.string().optional(),
	artistId: z.string().optional(),
	coverArt: z.string().optional(),
	songCount: z.number().optional(),
	duration: z.number().optional(),
	year: z.number().optional(),
	genre: z.string().optional(),
});
export type MusicAlbum = z.infer<typeof MusicAlbum>;

export const MusicAlbumWithSongs = MusicAlbum.extend({
	song: z.array(MusicSong).default([]),
});
export type MusicAlbumWithSongs = z.infer<typeof MusicAlbumWithSongs>;

export const MusicArtist = z.object({
	id: z.string(),
	name: z.string(),
	albumCount: z.number().optional(),
	coverArt: z.string().optional(),
	artistImageUrl: z.string().optional(),
});
export type MusicArtist = z.infer<typeof MusicArtist>;

export const MusicArtistWithAlbums = MusicArtist.extend({
	album: z.array(MusicAlbum).default([]),
});
export type MusicArtistWithAlbums = z.infer<typeof MusicArtistWithAlbums>;

export const MusicAlbumListResponse = subsonic(
	"albumList2",
	z.object({ album: z.array(MusicAlbum).default([]) }),
).transform((x) => x.album);

export const MusicAlbumResponse = subsonic("album", MusicAlbumWithSongs);

export const MusicArtistsResponse = subsonic(
	"artists",
	z.object({
		index: z
			.array(
				z.object({
					name: z.string(),
					artist: z.array(MusicArtist).default([]),
				}),
			)
			.default([]),
	}),
).transform((x) => x.index.flatMap((i) => i.artist));

export const MusicArtistResponse = subsonic("artist", MusicArtistWithAlbums);

export const MusicSearchResponse = subsonic(
	"searchResult3",
	z.object({
		artist: z.array(MusicArtist).default([]),
		album: z.array(MusicAlbum).default([]),
		song: z.array(MusicSong).default([]),
	}),
);
export type MusicSearchResult = z.infer<typeof MusicSearchResponse>;
