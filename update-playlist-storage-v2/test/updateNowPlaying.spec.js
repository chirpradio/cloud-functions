const { updateNowPlaying } = require("../lib");

test("it updates now_playing with a full recently_played array", () => {
  const track = { id: "g" };
  const input = {
    now_playing: { id: "a" },
    recently_played: [
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
      { id: "f" },
    ],
  };
  const expected = JSON.stringify({
    now_playing: { id: "g" },
    recently_played: [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
    ],
  });
  const output = updateNowPlaying(track, input);
  expect(JSON.stringify(output)).toBe(expected);
});

test("it updates now_playing with an empty recently_played array", () => {
  const track = { id: "g" };
  const input = {
    now_playing: { id: "a" },
    recently_played: [],
  };
  const expected = JSON.stringify({
    now_playing: { id: "g" },
    recently_played: [{ id: "a" }],
  });
  const output = updateNowPlaying(track, input);
  expect(JSON.stringify(output)).toBe(expected);
});

test("it updates now_playing with a partial recently_played array", () => {
  const track = { id: "g" };
  const input = {
    now_playing: { id: "a" },
    recently_played: [{ id: "b" }, { id: "c" }],
  };
  const expected = JSON.stringify({
    now_playing: { id: "g" },
    recently_played: [{ id: "a" }, { id: "b" }, { id: "c" }],
  });
  const output = updateNowPlaying(track, input);
  expect(JSON.stringify(output)).toBe(expected);
});
