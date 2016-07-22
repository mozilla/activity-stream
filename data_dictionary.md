# Activity Stream Pings

The Activity Stream addon sends two distinct types of pings to the backend (HTTPS POST) [Onyx server](https://github.com/mozilla/onyx) :
- a `session` ping that describes the ending of an Activity Stream session (lose focus event on Activity Stream), and
- an `event` ping that records specific data about individual user interactions while interacting with Activity Stream


# Example Activity Stream `session` Log

```json
{
  "action": "activity_stream_session",
  "addon_version": "1.0.0",
  "client_id": "374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e",
  "date": "2016-03-07",
  "ip": "10.192.171.13",
  "load_latency": 1100,
  "load_reason": "restore",
  "locale": "en-US",
  "max_scroll_depth": 145,
  "page": "newtab or timeline",
  "receive_at": 1457396660000,
  "session_duration": 1635,
  "tab_id": "1-3",
  "total_bookmarks": 19,
  "total_history_size": 9,
  "ua": "python-requests/2.9.1",
  "unload_reason": "close",
}
```

# Example Activity Stream `event` Log

```json
{
  "action": "activity_stream_event",
  "action_position": "3",
  "addon_version": "1.0.0",
  "client_id": "374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e",
  "date": "2016-03-07",
  "event": "click or scroll or search or delete",
  "ip": "10.192.171.13",
  "locale": "en-US",
  "page": "newtab or timeline",
  "receive_at": 1457396660000,
  "source": "top sites, or bookmarks, or...",
  "tab_id": "1-3",
  "ua": "python-requests/2.9.1",  
  "url": "https://www.example.com",
  "recommender_type": "pocket-trending"
}
```

# Example Activity Stream `performance` Log

```json
{
  "action": "activity_stream_performance",
  "addon_version": "1.0.0",
  "client_id": "374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e",
  "date": "2016-03-07",
  "event": "previewCacheHit",
  "event_id": "45f1912165ca4dfdb5c1c2337dbdc58f",
  "ip": "10.192.171.13",
  "locale": "en-US",
  "receive_at": 1457396660000,
  "source": "TOP_FRECENT_SITES",
  "tab_id": "1-3",
  "ua": "python-requests/2.9.1",
  "value": 1,
}
```

| KEY | DESCRIPTION | &nbsp; |
|-----|-------------|:-----:|
| `action_position` | The index of the element in the `source` that was clicked. | :one:
| `action` | Either `activity_stream_event` or `activity_stream_session`. | :one:
| `addon_version` | The version of the Activity Stream addon. | :one:
| `client_id` | An identifier for this client. | :one:
| `date` | The date in YYYY-MM-DD format. | :three:
| `event_id` | An identifier shared by multiple performance pings that describe ane entire request flow. | :one:
| `event` | The type of event. Either ("click", "share", "delete", "more_items") | :one:
| `ip` | The IP address of the client. | :two:
| `load_reason` | Either ("newtab", "refocus", "restore") and is the reason the tab was focused. | :one:
| `locale` | The browser chrome's language (eg. en-US). | :two:
| `max_scroll_depth` | The maximum number of pixels the scroll bar was dragged in this session. | :one:
| `page` | Either ("newtab", "timeline"). | :one:
| `session_duration` | Defined to be the time in milliseconds between the newtab gaining and losing focus. | :one:
| `source` | Either ("recent_links", "recent_bookmarks", "frecent_links", "top_sites", "spotlight", "sidebar") and indicates what `action`. | :two:
| `tab_id` | The Firefox generated unique id for the tab. | :one:
| `timestamp` | The time in ms since epoch. | :three:
| `total_bookmarks` | The total number of bookmarks in the user's places db. | :one:
| `total_history_size` | The number of history items currently in the user's places db. | :one:
| `ua` | The user agent string. | :two:
| `unload_reason` | The reason the Activity Stream page lost focus. | :one:
| `value` | An integer that represents the measured performance value. Can store counts, times in milliseconds, and should always be a positive integer.| :one:
| `ver` | The version of the Onyx API the ping was sent to. | :one:
| `url` | The URL of the recommendation shown in one of the highlights spots, if any. | :one:
| `recommender_type` | The type of recommendation that is being shown, if any. | :one:

**Where:**

:one: Firefox data  
:two: HTTP protocol data  
:three: server augmented data
