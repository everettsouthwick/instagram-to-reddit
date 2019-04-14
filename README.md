# insta-reddit
Automate the process of posting images from an Instagram account to a Subreddit.

```json
{
    "instagram": {
        "accountUri": "https://www.instagram.com/instagramUsername/",
        "maxTitleLength": 120,
        "minTitleLength": 5
    },
    "reddit": {
        "username": "redditUsername",
        "password": "redditPassword",
        "subredditPostLink": "https://www.reddit.com/r/subredditName/submit",
        "debug": false
    },
    "database": {
        "databaseName": "databaseName.db"
    },
    "verboseLogging": false
}
```