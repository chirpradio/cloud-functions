const trackSearch = require("./trackSearch.service");
const playlistService = require("./playlist.service");
const createPlaylistEvent = require("./createPlaylistEvent");
jest.mock("./playlist.service");
jest.mock("./trackSearch.service");

afterEach(() => {
  playlistService.getMostRecentPlays.mockClear();
  trackSearch.find.mockClear();
  playlistService.addPlaylistEvent.mockClear();
});

describe("Test base validation of requests", () => {
  test("Missing API should return 401", async () => {
    const result = await createPlaylistEvent.execute({
      query: { api_key: null },
    });
    expect(result.status).toBe(401);
  });

  test("StationPlaylist Stop Event 400 with corresponding message", async () => {
    const result = await createPlaylistEvent.execute({
      query: { api_key: "secret", title: "_STOP" },
    });
    expect(result.status).toBe(400);
    expect(result.body.msg).toBe("StationPlaylist STOP event");
  });

  test("StationPlaylist Live Break Event 400 with corresponding message", async () => {
    const result = await createPlaylistEvent.execute({
      query: { api_key: "secret", title: "Default User", artist: "Live" },
    });
    expect(result.status).toBe(400);
    expect(result.body.msg).toBe("StationPlaylist Break event");
  });

  test("Missing artist", async () => {
    const result = await createPlaylistEvent.execute({
      query: { api_key: "secret", title: "Theme from Cheers" },
    });
    expect(result.status).toBe(400);
    expect(result.body.msg).toBe("No artist included in request");
  });
});

describe("Test the capture of tracks that have passed all validations", () => {
  const req = {
    query: {
      api_key: "secret",
      title: "Battle of Hampton Roads",
      artist: "Titus Andronicus",
    },
  };
  playlistService.getMostRecentPlays.mockReturnValue([]);
  playlistService.addPlaylistEvent.mockReturnValue([]);
  test("Confirm matching of artist", async () => {
    trackSearch.find.mockReturnValue([
      {
        artist: "TITUS ANDRONICUS",
        title: "Battle of Hampton Roads",
        label: "Merge",
        album: "The Monitor",
      },
    ]);
    const result = await createPlaylistEvent.execute(req);
    expect(result.body).toStrictEqual([]);
    expect(result.status).toBe(200);
    expect(playlistService.addPlaylistEvent).toHaveBeenCalledWith({
      artist: "TITUS ANDRONICUS",
      album: "The Monitor",
      label: "Merge",
      title: "Battle of Hampton Roads",
    });
  });
});

describe("Validate functionality related to recent DJ plays", () => {
  const req = {
    query: {
      api_key: "secret",
      title: "Battle of Hampton Roads",
      artist: "Titus Andronicus",
    },
  };
  test("Recent DJ play detected", async () => {
    playlistService.getMostRecentPlays.mockReturnValueOnce([
      {
        selector: {
          id: "63471",
        },
      },
    ]);
    const result = await createPlaylistEvent.execute(req);
    expect(result.status).toBe(400);
    expect(result.body.msg).toBe(
      "Recent play by DJ detected, skipping automation capture"
    );
  });
});
