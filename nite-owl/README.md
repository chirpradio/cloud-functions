Listens for now playing events emitted by StationPlaylist and calls the NextUp API to create a corresponding PlaylistEvent using the `/freeform` endpoint.

To deploy to Google Cloud, the following command can be used:

```
npm run deploy:dev
```

Note this uses the `--allow-unauthenticated` flag which should not be used in production.

The resulting request URL can then be input into StationPlaylist with corresponding query template. It should take the following form:

```
<cloud-function-url>?api_key<nite-owl-api-key>&artist=%A&title=%t&album=%T&file=%f&label=%L
```
