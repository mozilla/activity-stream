# Metrics we collect

This is an overview of the different kinds of data we collect in Activity Stream experiment. See [data_dictionary.md](data_dictionary.md) for more details for each field.

## Data Retention

Raw data collected on Firefox's `about:newtab` page are retained for six months (180 days) on Mozilla servers and databases before being permanently deleted.  Aggregate data, which is data derived from raw data by aggregating it over one or more auxiliary dimensions (such as date, country, platform, browser version, etc.), is retained for 12 months.

## User event pings

These pings are captured when a user **performs some kind of interaction** in the add-on.

### Basic shape

A user event ping includes some basic metadata (tab id, addon version, etc.) as well as variable fields which indicate the location and action of the event.

```js
{
  // This indicates the type of interaction
  "event": "[CLICK | DELETE | BLOCK | SHARE | LOAD_MORE | SEARCH | SHARE_TOOLBAR | OPEN_EDIT_TOPSITES | CLOSE_EDIT_TOPSITES | OPEN_NEWTAB_PREFS | CLOSE_NEWTAB_PREFS | OPEN_ADD_TOPSITE_FORM | OPEN_EDIT_TOPSITE_FORM | ADD_TOPSITE | EDIT_TOPSITE]",

  // This is where the interaction occurred
  "page": ["NEW_TAB" | "HOME"],

  // Optional field indicating the UI component type
  "source": ["TOP_SITES" | "FEATURED" | "RECOMMENDED"| "ACTIVITY_FEED"],

  // Optional field if there is more than one of a component type on a page.
  // It is zero-indexed.
  // For example, clicking the second Highlight would result in an action_position of 1
  "action_position": 1,

  // Basic metadata
  "tab_id": "-5-2",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "action": "activity_stream_event",
  "metadata_source": "MetadataService",
  // The encoded user preferences, see more details in [data_dictionary.md](data_dictionary.md)
  "user_prefs": 7
}
```

### Types of user interactions

#### Performing a search

```js
{
  "event": "SEARCH",
  "page": ["NEW_TAB" | "HOME"],
  "action": "activity_stream_event",
  "tab_id": "-5-2",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Clicking a top site, highlight, or activtiy feed item

```js
{
  "event": "CLICK",
  "page": ["NEW_TAB" | "HOME"],
  "source": ["TOP_SITES" | "FEATURED" | "RECOMMENDED" | "ACTIVITY_FEED"],
  "action_position": 2,
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "metadata_source": ["MetadataService" | "Local" | "TippyTopProvider"],
  // Optional field, only sent if a recommendation site gets clicked
  "url": "https://www.example.com",
  // Optional field, only sent if a recommendation site gets clicked
  "recommender_type": "pocket-trending",
  "user_prefs": 7
}
```

#### Deleting an item from history

```js
  {
    "event": "DELETE",
    "page": ["NEW_TAB" | "HOME"],
    "source": ["TOP_SITES" | "FEATURED" | "RECOMMENDED" | "ACTIVITY_FEED"],
    "action_position": 0,
    "action": "activity_stream_event",
    "tab_id": "-3-13",
    "client_id": "83982d21-4f49-eb44-a3ed-8e9ac6f87b05",
    "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
    "addon_version": "1.0.12",
    "locale": "en-US",
    "metadata_source": ["MetadataService" | "Local" | "TippyTopProvider"]
  }
```

#### Changing a pref for this addon

```js
{
  "event": "PREF_CHANGE",
  "page": "NEW_TAB",
  "source": "Name of the changed pref item",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Blocking a site

```js
{
  "event": "BLOCK",
  "page": ["NEW_TAB" | "HOME"],
  "source": ["TOP_SITES" | "FEATURED" | "RECOMMENDED" | "ACTIVITY_FEED"],
  "action_position": 4,
  "action": "activity_stream_event",
  "tab_id": "-5-4",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "metadata_source": ["MetadataService" | "Local" | "TippyTopProvider"],
  // optional field, only sent if a recommendation site gets clicked
  "url": "https://www.example.com",
  // optional field, only sent if a recommendation site gets clicked
  "recommender_type": "pocket-trending"
}
```

#### Sharing a site (from content)

```js
{
  "event": "SHARE",
  "page": ["NEW_TAB" | "HOME"],
  "source": "ACTIVITY_FEED",
  "provider": "https://facebook.com",
  "action_position": 0,
  "action": "activity_stream_event",
  "tab_id": "-3-16",
  "client_id": "83982d21-4f49-eb44-a3ed-8e9ac6f87b05",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Sharing a site from toolbar

Note that this event fires when user clicks in the menu with an intent to share.
It doesn't capture success or failure to share after.

```js
{
  "event": "SHARE_TOOLBAR",
  "page": ["NEW_TAB" | "HOME"],
  "provider": "https://facebook.com",
  "action": "activity_stream_event",
  "tab_id": "-3-16",
  "client_id": "83982d21-4f49-eb44-a3ed-8e9ac6f87b05",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Opening the Edit Top Sites modal

```js
{
  "event": "OPEN_EDIT_TOPSITES",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Closing the Edit Top Sites modal

```js
{
  "event": "CLOSE_EDIT_TOPSITES",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Opening the New Tab Preferences

```js
{
  "event": "OPEN_NEWTAB_PREFS",
  "page": "NEW_TAB",
  "source": "NEW_TAB",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Closing the New Tab Preferences

```js
{
  "event": "CLOSE_NEWTAB_PREFS",
  "page": "NEW_TAB",
  "source": "NEW_TAB",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Pinning a site

```js
{
  "event": "PIN",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action_position": 4,
  "action": "activity_stream_event",
  "tab_id": "-5-4",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "metadata_source": ["MetadataService" | "Local" | "TippyTopProvider"],
}
```

#### Unpinning a site

```js
{
  "event": "UNPIN",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action_position": 4,
  "action": "activity_stream_event",
  "tab_id": "-5-4",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "metadata_source": ["MetadataService" | "Local" | "TippyTopProvider"],
}
```

#### Opening the Add Top Site form

```js
{
  "event": "OPEN_ADD_TOPSITE_FORM",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Opening the Edit Top Site form

```js
{
  "event": "OPEN_EDIT_TOPSITE_FORM",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Add a Top Site

```js
{
  "event": "ADD_TOPSITE",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Edit a Top Site

```js
{
  "event": "EDIT_TOPSITE",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action_position": 2,
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Drag a Top Site

```js
{
  "event": "DRAG_TOPSITE",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action_position": 2,
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

#### Drop a Top Site on another

```js
{
  "event": "DROP_TOPSITE",
  "page": "NEW_TAB",
  "source": "TOP_SITES",
  "action_position": 2,
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
}
```

## Session end pings

When a session ends, the browser will send a `"activity_stream_session"` ping to our metrics servers. This ping contains the length of the session, a unique reason for why the session ended, and some additional metadata.

### Basic event

All `"activity_stream_session"` pings have the following basic shape. Some fields are variable.

```js
{
  // These are all variable. See below for what causes different unload_reasons
  "url": "resource://activity-streams/data/content/activity-streams.html#/[|HOME]",
  "load_reason": "[newtab | focus]",
  "unload_reason": "[navigation | unfocus | refresh]",

  "total_history_size": 446,
  "total_bookmarks": 57,
  "tab_id": "-5-2",
  "load_latency": 774,
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "page": ["NEW_TAB" | "HOME"],
  "action": "activity_stream_session",
  "session_duration": 4199,
  "topsites_size": 6,
  "topsites_screenshot": 1,
  "topsites_tippytop": 3,
  "user_prefs": 7
}
```

### What causes a session end?

Here are different scenarios that cause a session end event to be sent and the corresponding `"unload_reason"` included in the ping:

1. After a search: `"search"`
2. Clicking on something (top site, highlight, activity feed item): `"click"`
3. Switching to another tab: `"unfocus"`
4. Closing the browser: `"close"`
5. Refreshing: `"refresh"`
6. Navigating to a new URL via the url bar: `"navigation"`

## Bad app state pings

In some undesired app states, the app will send a ping about it to our metrics server.

### Types of bad states

#### Show loader

```js
{
  "event": "SHOW_LOADER",
  "source": "NEW_TAB",
  "page": "NEW_TAB",
  "action": "activity_stream_masga_event",
  "tab_id": "-5-2",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Hide loader

```js
{
  "event": "HIDE_LOADER",
  "source": "NEW_TAB",
  "page": "NEW_TAB",
  "value": 485, // amount of time shown in milliseconds
  "action": "activity_stream_masga_event",
  "tab_id": "-5-2",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

## Impression stats pings

This could be used to capture the impression and other user interaction pings for the recommended items, e.g. Pocket.
Note that it re-uses the same payload [schema](https://github.com/mozilla/infernyx#payloads-from-firefox) as Tiles for Firefox Newtab.

### Impression
```js
{
  "source": "pocket",
  "action": "activity_stream_impression",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  // `id` is the GUID of the recommended item
  "tiles": [{"id": 1000}, {"id": 1001}, {"id": 1002}]
}

```

### Clicks/Blocks/Pocketed
```js
{
  "source": "pocket",
  "action": "activity_stream_impression",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  // `user_action`: `[click|pocket|block]`, the value is the 0-based index of the `tiles` array
  "user_action": 0,
  // `pos` stands for the 0-based tile position in the Newtab
  "tiles": [{"id": 1000, "pos": 3}]
}

```

## Performance Pings

Activity Stream will send data back to Mozilla for the purpose of measuring latency and performance of the add-on in order to optimize the performance of Activity Stream.

```js
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
  "source": ["TOP_SITES" | "FEATURED" | "RECOMMENDED" | "ACTIVITY_FEED"],
  "tab_id": "1-3",
  "ua": "python-requests/2.9.1",
  "value": 1
}
```
