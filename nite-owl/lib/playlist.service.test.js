const nextup = require("./nextup.service");
const playlistService = require("./playlist.service");
jest.mock("./nextup.service");

afterEach(() => {
  nextup.addPlaylistEvent.mockClear();
});

const referenceDate = new Date("2024-07-15 12:00:00");

jest.useFakeTimers().setSystemTime(referenceDate);

describe("Test recent playlist lookups", () => {
  test("Expect default search of past 20 minutes", async () => {
    nextup.getPlaylist.mockReturnValue({});
    playlistService.getMostRecentPlays();
    const expectedDate = new Date();
    expectedDate.setMinutes(expectedDate.getMinutes() - 20);
    expect(nextup.getPlaylist).toHaveBeenCalledWith({
      start: expectedDate.valueOf(),
    });
  });

  test("Execute search using input value of 15 minutes", async () => {
    nextup.getPlaylist.mockReturnValue({});
    playlistService.getMostRecentPlays(15);
    const expectedDate = new Date();
    expectedDate.setMinutes(expectedDate.getMinutes() - 15);
    expect(nextup.getPlaylist).toHaveBeenCalledWith({
      start: expectedDate.valueOf(),
    });
  });
});

describe("Test adding a playlist event", () => {
  const playListInput = {
    artist: "DJ Rashad",
    album: "Double Cup",
    label: "Hyberdub",
    title: "Everyday of my Life",
  };
  test("Test base mapping of target track to playlist event input", async () => {
    nextup.addPlaylistEvent.mockReturnValue({});
    playlistService.addPlaylistEvent(
      Object.assign(playListInput, { currentTags: ["local_classic"] })
    );
    const mockedCallInput = JSON.parse(
      nextup.addPlaylistEvent.mock.calls[0][0]
    );
    expect(mockedCallInput.artist.name).toBe("DJ Rashad");
    expect(mockedCallInput.album.title).toBe("Double Cup");
    expect(mockedCallInput.album.label).toBe("Hyberdub");
    expect(mockedCallInput.track.title).toBe("Everyday of my Life");
    expect(mockedCallInput.categories).toStrictEqual(["local_classic"]);
  });

  test("Test that only valid categories are passed to nextup", async () => {
    nextup.addPlaylistEvent.mockReturnValue({});
    playlistService.addPlaylistEvent(
      Object.assign(playListInput, {
        currentTags: ["local_classic", "clean", "remaster"],
      })
    );
    const mockedCallInput = JSON.parse(
      nextup.addPlaylistEvent.mock.calls[0][0]
    );
    expect(mockedCallInput.artist.name).toBe("DJ Rashad");
    expect(mockedCallInput.album.title).toBe("Double Cup");
    expect(mockedCallInput.album.label).toBe("Hyberdub");
    expect(mockedCallInput.track.title).toBe("Everyday of my Life");
    expect(mockedCallInput.categories).toStrictEqual(["local_classic"]);
  });

  test("Test when tags are not included on track", async () => {
    nextup.addPlaylistEvent.mockReturnValue({});
    playlistService.addPlaylistEvent(
      Object.assign(playListInput, {
        currentTags: null,
      })
    );
    const mockedCallInput = JSON.parse(
      nextup.addPlaylistEvent.mock.calls[0][0]
    );
    expect(mockedCallInput.artist.name).toBe("DJ Rashad");
    expect(mockedCallInput.album.title).toBe("Double Cup");
    expect(mockedCallInput.album.label).toBe("Hyberdub");
    expect(mockedCallInput.track.title).toBe("Everyday of my Life");
    expect(mockedCallInput.categories).toStrictEqual([]);
  });
});
