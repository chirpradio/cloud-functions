Fetches the output of https://chirpradio-hrd.appspot.com/api/current_playlist and copies it to a public Cloud Storage bucket to serve the same data at a lower cost.

# To deploy
`gcloud functions deploy updatePlaylistStorage --project chirpradio-hrd --runtime=nodejs10 --trigger-http --allow-unauthenticated`