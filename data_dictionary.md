# Example Activity Stream Log

```json
{
  "action": "activity_stream",
  "addon_version": "1.0.0",
  "click_position": "100x100",
  "client_id": "374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e",
  "date": "2016-03-07",
  "ip": "10.192.171.13",
  "load_reason": "restore",
  "locale": "en-US",
  "max_scroll_depth": 145,
  "session_duration": 1635,
  "source": "top_sites",
  "tab_id": 3,
  "timestamp": 1457396660000,
  "total_bookmarks": 19,
  "total_history_size": 9,
  "ua": "python-requests/2.9.1",
  "unload_reason": "close",
  "ver": "3"
}
```

The `about:newtab` page will ping (HTTPS POST) [Onyx](https://github.com/mozilla/onyx) every time the page loses focus.

| KEY | DESCRIPTION | &nbsp; |
|-----|-------------|:-----:|
| `action` | Always `activity_stream`. | :one:
| `addon_version` | The version of the Activity Stream addon. | :one:
| `click_position` | The index of the element that was clicked. | :one:
| `client_id` | An identifier for this client. | :one:
| `load_reason` | Either ("newtab", "refocus", "restore") and is the reason the tab was focused. | :one:
| `max_scroll_depth` | The maximum number of pixels the scroll bar was dragged in this session. | :one:
| `session_duration` | Defined to be the time in milliseconds between the newtab gaining and losing focus. | :one:
| `tab_id` | The Firefox generated unique id for the tab. | :one:
| `total_bookmarks` | The total number of bookmarks in the user's places db. | :one:
| `total_history_size` | The number of history items currently in the user's places db. | :one:
| `unload_reason` | The reason the about:newtab page lost focus. | :one:
| `ver` | The version of the Onyx API the ping was sent to. | :one:
| `ip` | The IP address of the client. | :two:
| `locale` | The browser chrome's language (eg. en-US). | :two:
| `source` | Either ("recent_links", "recent_bookmarks", "frecent_links", "top_sites", "spotlight") and indicates what was clicked. | :two:
| `ua` | The user agent string. | :two:
| `date` | The date in YYYY-MM-DD format. | :three:
| `timestamp` | The time in ms since epoch. | :three:

**Where:**

:one: Firefox data  
:two: HTTP protocol data  
:three: server augmented data
