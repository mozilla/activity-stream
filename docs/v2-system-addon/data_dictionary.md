# Activity Stream Pings

The Activity Stream system add-on sends various types of pings to the backend (HTTPS POST) [Onyx server](https://github.com/mozilla/onyx) :
- a `session` ping that describes the ending of an Activity Stream session (lose focus event on Activity Stream), and
- an `event` ping that records specific data about individual user interactions while interacting with Activity Stream
- a `performance` ping that records specific performance related events
- an `undesired` ping that records data about bad app states and missing data

Schema definitions/validations that can be used for tests can be found in `system-addon/test/schemas/pings.js`.

# Example Activity Stream `session` Log

```js
{
  // These fields are sent from the client
  "action": "activity_stream_session",
  "addon_version": "1.0.0",
  "client_id": "374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e",
  "locale": "en-US",
  "page": "about:newtab or about:home",
  "session_duration": 1635,
  "session_id": "{12dasd-213asda-213dkakj}"

  // These fields are generated on the server
  "date": "2016-03-07",
  "ip": "10.192.171.13",
  "ua": "python-requests/2.9.1",
  "receive_at": 1457396660000
}
```

# Example Activity Stream `user_event` Log

```js
{
  "action": "activity_stream_user_event",
  "action_position": "3",
  "addon_version": "1.0.0",
  "client_id": "374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e",
  "event": "click or scroll or search or delete",
  "locale": "en-US",
  "page": "about:newtab or about:home",
  "source": "top sites, or bookmarks, or...",
  "session_id": "{12dasd-213asda-213dkakj}",
  "recommender_type": "pocket-trending",
  "metadata_source": "MetadataService or Local or TippyTopProvider",

  // These fields are generated on the server
  "ip": "10.192.171.13",
  "ua": "python-requests/2.9.1",
  "receive_at": 1457396660000,
  "date": "2016-03-07",
}
```

# Example Activity Stream `performance` Log

```js
{
  "action": "activity_stream_performance_event",
  "addon_version": "1.0.0",
  "client_id": "374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e",
  "event": "previewCacheHit",
  "event_id": "45f1912165ca4dfdb5c1c2337dbdc58f",
  "locale": "en-US",
  "receive_at": 1457396660000,
  "source": "TOP_FRECENT_SITES",
  "value": 1

  // These fields are generated on the server
  "ip": "10.192.171.13",
  "ua": "python-requests/2.9.1",
  "receive_at": 1457396660000,
  "date": "2016-03-07"
}
```

# Example Activity Stream `undesired event` Log

```js
{
  "action": "activity_stream_undesired_event",
  "addon_version": "1.0.12",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "event": "MISSING_IMAGE",
  "locale": "en-US",
  "page": "about:newtab or about:home",
  "source": "HIGHLIGHTS",
  "value": 0,

  // These fields are generated on the server
  "ip": "10.192.171.13",
  "ua": "python-requests/2.9.1",
  "receive_at": 1457396660000,
  "date": "2016-03-07"
}
```

| KEY | DESCRIPTION | &nbsp; |
|-----|-------------|:-----:|
| `action_position` | [Optional] The index of the element in the `source` that was clicked. | :one:
| `action` | [Required] Either `activity_stream_event`, `activity_stream_session`, or `activity_stream_performance`. | :one:
| `addon_version` | [Required] The version of the Activity Stream addon. | :one:
| `client_id` | [Required] An identifier for this client. | :one:
| `date` | [Auto populated by Onyx] The date in YYYY-MM-DD format. | :three:
| `experiment_id` | [Optional] The unique identifier for a specific experiment. | :one:
| `event_id` | [Required] An identifier shared by multiple performance pings that describe ane entire request flow. | :one:
| `event` | [Required] The type of event. Any user defined string ("click", "share", "delete", "more_items") | :one:
| `highlight_type` | [Optional] Either ["bookmarks", "recommendation", "history"]. | :one:
| `ip` | [Auto populated by Onyx] The IP address of the client. | :two:
| `locale` | [Auto populated by Onyx] The browser chrome's language (eg. en-US). | :two:
| `load_trigger_ts` | [Optional][Server Counter][Server Alert for too many omissions]  DOMHighResTimeStamp of the action perceived by the user to trigger the load of this page. | :one:
| `load_trigger_type` | [Server Counter][Server Alert for too many omissions] Either ["menu_plus_or_keyboard", "unexpected"]. | :one:
| `metadata_source` | [Optional] The source of which we computed metadata. Either (`MetadataService` or `Local` or `TippyTopProvider`). | :one:
| `page` | [Required] Either ["NEW_TAB", "HOME"]. | :one:
| `recommender_type` | [Optional] The type of recommendation that is being shown, if any. | :one:
| `session_duration` | [Required] Defined to be the time in milliseconds between the newtab gaining and losing focus. | :one:
| `session_id` | [Optional] The unique identifier for a specific session. | :one:
| `source` | [Required] Either ("recent_links", "recent_bookmarks", "frecent_links", "top_sites", "spotlight", "sidebar") and indicates what `action`. | :two:
| `timestamp` | [Auto populated by Onyx] The time in ms since epoch. | :three:
| `total_bookmarks` | [Optional] The total number of bookmarks in the user's places db. | :one:
| `total_history_size` | [Optional] The number of history items currently in the user's places db. | :one:
| `ua` | [Auto populated by Onyx] The user agent string. | :two:
| `unload_reason` | [Required] The reason the Activity Stream page lost focus. | :one:
| `url` | [Optional] The URL of the recommendation shown in one of the highlights spots, if any. | :one:
| `value` | [Required] An integer that represents the measured performance value. Can store counts, times in milliseconds, and should always be a positive integer.| :one:
| `ver` | [Auto populated by Onyx] The version of the Onyx API the ping was sent to. | :one:
| `highlights_size` | [Optional] The size of the Highlights set. | :one:
| `topsites_first_painted_ts` | [Optional][Service Counter][Server Alert for too many omissions] Timestamp of when the Top Sites element finished painting (possibly with only placeholder screenshots) | :one:
| `topsites_size` | [Optional] The size of the Topsites set. | :one:
| `topsites_screenshot` | [Optional] The size of the Topsites set with screenshot metadata. | :one:
| `topsites_tippytop` | [Optional] The size of the Topsites set with TippyTop metadata. | :one:
| `user_prefs` | [optional] The encoded integer of user's preferences. | :one: & :four:
| `visibility_event_rcvd_ts` | [Optional][Server Counter][Server Alert for too many omissions] DOMHighResTimeStamp of when the page itself receives an event that document.visibilityState == visible. | :one:

**Where:**

:one: Firefox data
:two: HTTP protocol data
:three: server augmented data
:four: User preferences encoding table


Note: the following session-related fields are not yet implemented in the system-addon,
but will likely be added in future versions:

```js
{
  "total_bookmarks": 19,
  "total_history_size": 9,
  "highlights_size": 20,
  "topsites_size": 6,
  "topsites_screenshot": 1,
  "topsites_tippytop": 3,
  "user_prefs": 7
}
```

| Preference | Encoded value |
| --- | --- |
| `showSearch` | 1 |
| `showTopSites` | 2 |
| `showHighlights` | 4 |
| `showMoreTopSites` | 8 |
| `showPocketStories` | 16 |

Each item above could be combined with other items through bitwise OR operation
