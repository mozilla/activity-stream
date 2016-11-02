# Metrics we collect

This is an overview of the different kinds of data we collect in Activity Stream experiment. See [data_dictionary.md](data_dictionary.md) for more details for each field.

## User event pings

These pings are captured when a user **performs some kind of interaction** in the add-on.

### Basic shape

A user event ping includes some basic metadata (tab id, addon version, etc.) as well as variable fields which indicate the location and action of the event.

```js
{
  // This indicates the type of interaction
  "event": "[CLICK | DELETE | BLOCK | SHARE | LOAD_MORE | SEARCH | SHARE_TOOLBAR]",

  // This is where the interaction occurred
  "page": "NEW_TAB",

  // Optional field indicating the UI component type
  "source": ["TOP_SITES" | "FEATURED" | "ACTIVITY_FEED"],

  // Optional field if there is more than one of a component type on a page.
  // It is zero-indexed.
  // For example, clicking the second Highlight would result in an action_position of 1
  "action_position": 1,

  // Basic metadata
  "tab_id": "-5-2",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "action": "activity_stream_event",
  "metadata_source": "Embedly"
}
```

### Types of user interactions

#### Performing a search

```js
{
  "event": "SEARCH",
  "page": "NEW_TAB",
  "action": "activity_stream_event",
  "tab_id": "-5-2",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "addon_version": "1.0.12",
  "locale": "en-US"
  // Optional fields, only set if they are in a shield study
  "shield_variant": ["shield-study-01-ActivityStream" | "shield-study-01-Tiles"]
  "tp_version": "1.1.6"
}
```

#### Clicking a top site, highlight, or activtiy feed item

```js
{
  "event": "CLICK",
  "page": "NEW_TAB",
  "source": ["TOP_SITES" | "FEATURED" | "ACTIVITY_FEED"],
  "action_position": 2,
  "action": "activity_stream_event",
  "tab_id": "-5-3",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "metadata_source": ["Embedly" | "MetadataService" | "Local" | "TippyTopProvider"],
  // Optional field, only sent if a recommendation site gets clicked
  "url": "https://www.example.com",
  // Optional field, only sent if a recommendation site gets clicked
  "recommender_type": "pocket-trending",
  // Optional fields, only set if they are in a shield study
  "shield_variant": ["shield-study-01-ActivityStream" | "shield-study-01-Tiles"]
  "tp_version": "1.1.6"
}
```

#### Deleting an item from history

```js
  {
    "event": "DELETE",
    "page": "NEW_TAB",
    "source": ["TOP_SITES" | "FEATURED" | "ACTIVITY_FEED"],
    "action_position": 0,
    "action": "activity_stream_event",
    "tab_id": "-3-13",
    "client_id": "83982d21-4f49-eb44-a3ed-8e9ac6f87b05",
    "addon_version": "1.0.12",
    "locale": "en-US",
    "metadata_source": ["Embedly" | "MetadataService" | "Local" | "TippyTopProvider"]
  }
```

#### Blocking a site

```js
{
  "event": "BLOCK",
  "page": "NEW_TAB",
  "source": ["TOP_SITES" | "FEATURED" | "ACTIVITY_FEED"],
  "action_position": 4,
  "action": "activity_stream_event",
  "tab_id": "-5-4",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "metadata_source": ["Embedly" | "MetadataService" | "Local" | "TippyTopProvider"],
  // optional field, only sent if a recommendation site gets clicked
  "url": "https://www.example.com",
  // optional field, only sent if a recommendation site gets clicked
  "recommender_type": "pocket-trending"
  // Optional fields, only set if they are in a shield study
  "shield_variant": ["shield-study-01-ActivityStream" | "shield-study-01-Tiles"]
  "tp_version": "1.1.6"
}
```

#### Sharing a site (from content)

```js
{
  "event": "SHARE",
  "page": "NEW_TAB"
  "source": "ACTIVITY_FEED",
  "provider": "https://facebook.com",
  "action_position": 0,
  "action": "activity_stream_event",
  "tab_id": "-3-16",
  "client_id": "83982d21-4f49-eb44-a3ed-8e9ac6f87b05",
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
  "page": "NEW_TAB",
  "provider": "https://facebook.com",
  "action": "activity_stream_event",
  "tab_id": "-3-16",
  "client_id": "83982d21-4f49-eb44-a3ed-8e9ac6f87b05",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

## Session end pings

When a session ends, the browser will send a `"activity_stream_session"` ping to our metrics servers. This ping contains the length of the session, a unique reason for why the session ended, and some additional metadata.

### Basic event

All `"activity_stream_session"` pings have the following basic shape. Some fields are variable.

```js
{
  // These are all variable. See below for what causes different unload_reasons
  "url": "resource://activity-streams/data/content/activity-streams.html",
  "load_reason": "[newtab | focus]",
  "unload_reason": "[navigation | unfocus | refresh]",

  "total_history_size": 446,
  "total_bookmarks": 57,
  "tab_id": "-5-2",
  "load_latency": 774,
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "page": "NEW_TAB",
  "action": "activity_stream_session",
  "session_duration": 4199
  // Optional fields, only set if they are in a shield study
  "shield_variant": ["shield-study-01-ActivityStream" | "shield-study-01-Tiles"]
  "tp_version": "1.1.6"
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
