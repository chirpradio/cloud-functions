Generates a CSV of local artists that were played in the past calendar year. This isn't set up to run as a cloud function, but we don't have a better repo for scripts that are useful to run locally once a year.

# Pre-requisites
- Google Cloud SDK
- Read access to production database

# Run the script
First, update the `START_TIME` and `END_TIME` in the source to match the previous year.

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 local-plays.py
```

This script will take several minutes to complete and saves the results to a file named output.csv.