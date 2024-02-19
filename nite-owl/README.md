Listens for now playing events emitted by StationPlaylist and calls the NextUp API to create a corresponding PlaylistEvent using the `/freeform` endpoint.

To deploy to Google Cloud, the following command can be used:

```
gcloud functions deploy nodejs-http-function \
--gen2 \
--runtime=nodejs20 \
--region=us-central1 \
--source=. \
--entry-point=createPlaylistEvent \
--trigger-http \
--allow-unauthenticated \
--env-vars-file=env.dev.yaml
```

Note this uses the `--allow-unauthenticated` flag which should not be used in production.

The resulting request URL can then be input into StationPlaylist with corresponding query template. It should take the following form:

```
<cloud-function-url>?user=<nite-owl-user>&password=<nite-owl-password>&artist=%A&title=%t&album=%T&file=%f&label=%L
```