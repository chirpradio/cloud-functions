const nextup = require("./nextup.service");
const trackSearch = require("./trackSearch.service");
jest.mock("./nextup.service");

afterEach(() => {
  nextup.search.mockClear();
});

describe("Execute a basic search", () => {
  test("No hits returned", async () => {
    nextup.search.mockReturnValue({
      hits: [],
    });
    const searchResults = await trackSearch.find("Footprints", 254);
    expect(searchResults).toStrictEqual([]);
  });

  test("Single hit returned, album artist and no track artist", async () => {
    nextup.search.mockReturnValue({
      hits: [
        {
          _source: {
            title: "Footprints",
            album: {
              label: null,
              album_artist: {
                name: "A Tribe Called Quest",
              },
              title: "People's Instinctive Travels and the Paths of Rhythm",
              year: null,
              current_tags: [],
            },
            is_reviewed: false,
            track_artist: null,
            duration_ms: 242912,
            track_num: 4,
          },
        },
      ],
    });
    const searchResults = await trackSearch.find("Footprints", 254);
    expect(searchResults).toStrictEqual([
      {
        artist: "A Tribe Called Quest",
        albumYear: null,
        currentTags: [],
        album: "People's Instinctive Travels and the Paths of Rhythm",
        label: null,
        title: "Footprints",
        trackNumber: 4,
        year: null,
      },
    ]);
  });

  test("Single hit returned, track artist and no album artist", async () => {
    nextup.search.mockReturnValue({
      hits: [
        {
          _source: {
            title: "Footprints",
            album: {
              label: null,
              album_artist: {
                name: null,
              },
              title: "People's Instinctive Travels and the Paths of Rhythm",
              year: null,
              current_tags: [],
            },
            is_reviewed: false,
            track_artist: "A Tribe Called Quest",
            duration_ms: 242912,
            track_num: 4,
          },
        },
      ],
    });
    const searchResults = await trackSearch.find("Footprints", 254);
    expect(searchResults).toStrictEqual([
      {
        artist: "A Tribe Called Quest",
        albumYear: null,
        currentTags: [],
        album: "People's Instinctive Travels and the Paths of Rhythm",
        label: null,
        title: "Footprints",
        trackNumber: 4,
        year: null,
      },
    ]);
  });
});

describe("Execute search retry with altered search terms", () => {
  test("Test with trailing term to be removed", async () => {
    nextup.search
      .mockReturnValueOnce({
        hits: [],
      })
      .mockReturnValueOnce({
        hits: [],
      })
      .mockReturnValueOnce({
        hits: [
          {
            _source: {
              title: "Footprints",
              album: {
                label: null,
                album_artist: {
                  name: "A Tribe Called Quest",
                },
                title: "People's Instinctive Travels and the Paths of Rhythm",
                year: null,
                current_tags: [],
              },
              is_reviewed: false,
              track_artist: null,
              duration_ms: 242912,
              track_num: 4,
            },
          },
        ],
      });
    await trackSearch.find("Footprints (clean) (remastered)", 254);
    expect(nextup.search).toHaveBeenCalledTimes(3);
    const trackInfo = {
      "track[duration_ms][gte]": 224000,
      "track[duration_ms][lte]": 284000,
      type: "track",
    };
    expect(nextup.search).toHaveBeenCalledWith(
      Object.assign(trackInfo, { term: "Footprints (clean) (remastered)" })
    );
    expect(nextup.search).toHaveBeenCalledWith(
      Object.assign(trackInfo, { term: "Footprints (clean)" })
    );
    expect(nextup.search).toHaveBeenCalledWith(
      Object.assign(trackInfo, { term: "Footprints" })
    );
  });
});
