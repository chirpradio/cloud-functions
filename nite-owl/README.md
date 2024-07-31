# Nite-Owl

Listens for now playing events emitted by StationPlaylist and calls the NextUp API to create a corresponding PlaylistEvent using the `/freeform` endpoint.

## Local Development

This functionality can be tested locally by running:

```
API_URL=<nextup-api-url> npm run test
```

This will listen on `localhost:8080/createPlaylistEvent` for `GET` requests with the following query paremeters:

| Key          | Value                                | Required                     |
| ------------ | ------------------------------------ | ---------------------------- |
| api_key      | The API key for the automationg user | yes                          |
| artist       | Track's artist                       | yes if album_artist is blank |
| album_artist | Track's album artist                 | yes if artist is blank       |
| title        | Track's title                        | yes                          |
| duration     | Track duration                       | yes                          |
| album        | Track's album                        | no                           |
| label        | Track's label                        | no                           |
| year         | Track's year                         | no                           |

Here is an example request:

```bash
curl --location 'http://localhost:8080//createPlaylistEvent?api_key=<api_key>&artist=Ladyhawk&title=Footprints&album=Single&label=&duration=254'
```

## Deployment

To deploy to Google Cloud, the following command can be used:

```
npm run deploy:dev
```

Note this uses the `--allow-unauthenticated` flag which should not be used in production.

The resulting request URL can then be input into StationPlaylist with corresponding query template. It should take the following form:

```
<cloud-function-url>api_key=<api_key>&artist=%a&title=%t&album=%T&label=%L&duration=%S&album_artist=%A&year=%Y
```
