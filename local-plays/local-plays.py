from google.cloud import datastore
from datetime import datetime
import pytz
import csv

client = datastore.Client()
tz = pytz.timezone('America/Chicago')
START_DATE = datetime.fromisoformat('2023-01-01T00:00:00-06:00')
END_DATE = datetime.fromisoformat('2024-01-01T00:00:00-06:00')

def get_playlist_events():
  query = client.query(kind='PlaylistEvent')
  category_filter = datastore.query.PropertyFilter('categories', 'IN', ['local_classic', 'local_current'])
  start_filter = datastore.query.PropertyFilter('established', '>', START_DATE)
  end_filter = datastore.query.PropertyFilter('established', '<', END_DATE)
  query.add_filter(filter=category_filter)
  query.add_filter(filter=start_filter)
  query.add_filter(filter=end_filter)
  return query.fetch(limit=5)

def get_artist_name(event):
  if(event['artist']):
    artist_query = client.query(kind='Artist')
    key_filter = datastore.query.PropertyFilter('__key__', '=', event['artist'])
    artist_query.add_filter(filter=key_filter)
    artist = list(artist_query.fetch())
    return artist[0]['name']
  else:
    return event['freeform_artist_name']

def get_chicago_dt(event):
  chicago_dt = event['established'].astimezone(tz)
  return chicago_dt.strftime('%m/%d/%Y %I:%M:%S %p')

def main():
    events = get_playlist_events()
    with open('output.csv', 'w', newline='') as csvfile:
      writer = csv.writer(csvfile)
      for event in events:
        played_at = get_chicago_dt(event)
        artist_name = get_artist_name(event)
        writer.writerow([played_at, artist_name])
    
if __name__ == '__main__':
    main()