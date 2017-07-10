# Metrics we collect

This is an overview of the different kinds of data we collect in Activity Stream experiment. See [data_dictionary.md](data_dictionary.md) for more details for each field.

## User event pings

These pings are captured when a user **performs some kind of interaction** in the add-on.

### Basic shape

A user event ping includes some basic metadata (tab id, addon version, etc.) as well as variable fields which indicate the location and action of the event.

```js
{
  // This indicates the type of interaction
  "event": ["CLICK", "SEARCH", "BLOCK", "DELETE", "OPEN_NEW_WINDOW", "OPEN_PRIVATE_WINDOW", "BOOKMARK_DELETE", "BOOKMARK_ADD", "OPEN_NEWTAB_PREFS", "CLOSE_NEWTAB_PREFS"],

  // Optional field indicating the UI component type
  "source": "TOP_SITES",

  // Optional field if there is more than one of a component type on a page.
  // It is zero-indexed.
  // For example, clicking the second Highlight would result in an action_position of 1
  "action_position": 1,

  // Basic metadata
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "action": "activity_stream_event"
}
```

### Types of user interactions

#### Performing a search

```js
{
  "event": "SEARCH",

  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Clicking a top site item

```js
{
  "event": "CLICK",
  "source": "TOP_SITES",
  "action_position": 2,
  
  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Deleting an item from history

```js
{
  "event": "DELETE",
  "source": "TOP_SITES",
  "action_position": 2,

  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Blocking a site

```js
{
  "event": "BLOCK",
  "source": "TOP_SITES",
  "action_position": 2,
  
  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Bookmarking a link

```js
{
  "event": "BOOKMARK_ADD",
  "source": "TOP_SITES",
  "action_position": 2,
  
  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Removing a bookmark from a link

```js
{
  "event": "BOOKMARK_DELETE",
  "source": "TOP_SITES",
  "action_position": 2,
  
  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Opening a link in a new window

```js
{
  "event": "OPEN_NEW_WINDOW",
  "source": "TOP_SITES",
  "action_position": 2,

  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Opening a link in a new private window

```js
{
  "event": "OPEN_PRIVATE_WINDOW",
  "source": "TOP_SITES",
  "action_position": 2,
  
  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Opening the new tab preferences pane

```js
{
  "event": "OPEN_NEWTAB_PREFS",
  
  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

#### Closing the new tab preferences pane

```js
{
  "event": "CLOSE_NEWTAB_PREFS",
  
  // Basic metadata
  "action": "activity_stream_event",
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US"
}
```

## Session end pings

When a session ends, the browser will send a `"activity_stream_session"` ping to our metrics servers. This ping contains the length of the session, a unique reason for why the session ended, and some additional metadata.

### Basic event

All `"activity_stream_session"` pings have the following basic shape. Some fields are variable.

```js
  "action": "activity_stream_session",
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
  "session_id": "005deed0-e3e4-4c02-a041-17405fd703f6",
  "addon_version": "1.0.12",
  "locale": "en-US",
  "page": ["about:newtab" | "about:home"],
  "session_duration": 4199
}
```

### What causes a session end?

Here are different scenarios that cause a session end event to be sent:

1. After a search
2. Clicking on something that causes navigation (top site, highlight, etc.)
3. Closing the browser
5. Refreshing
6. Navigating to a new URL via the url bar or file menu

### Session performance data
This data is held in a child object of the `activity_stream_session` event called `perf`.  All fields suffixed by `_ts` are of type (approximately, talk to @ncloudioj for details) `DOMHighResTimeStamp` (aka a double of milliseconds, with a 5 microsecond precision) with 0 being the [timeOrigin](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp#The_time_origin) of the browser's hidden chrome window.

An example might look like this:

```js
{
  // Timestamp of the action perceived by the user to trigger the load
  // of this page.
  //
  // Not required at least for error cases where the
  // observer event doesn't fire
  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2658

  "load_trigger_ts": 1,

  // What was the perceived trigger of the load action:
  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2658
  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2685

  "load_trigger_type": [
    "menu_plus_or_keyboard" | // newtab only
    "unexpected" // sessions lacking actual start times
    "first_window_open" | // home only
    "subsequent_window_open" | // home only
    "toolbar_button" | // home only
    "session_restore" | // home or newtab
    "url_bar" | // home or newtab
    "refresh" | // home or newtab
    "other"], // home or newtab

  // when the page itself receives an event that document.visibilityState=visible
  "visibility_event_rcvd_ts": 2,

  // As of this writing, this will be false for the first tab in every window,
  // and true for every subsequent tab in that window.
  //
  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2539
  "new_tab_preloaded": false,

  // first thing a user might want to interact with
  "search_box_painted_ts": 3,

  // Most likely thing (based on previous telemetry) that the user is going
  // to interact with (i.e. Hero element).
  //
  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2661
  "top_sites_painted_ts": 5,

  // When the entire page has been painted (not including stuff like screenshots
  // showing up later).
  //
  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2662
  "display_done_ts": 7,

  // XXX below here, things are more up in the air.  We may not want to use
  // the schema proposed below, or even implement all of the stuff to be
  // collected here.

  // See when the data was ready in case if and only if it happened
  // after the data was required to render.
  //
  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2672
  "top_sites_data_ready_ts": 9,

  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2663
  "search_keystroke_latency": ["TBD"],

  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2664
  "search_keystroke_autocomplete_latency": ["TBD"],

  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2673
  "slow_event_handlers": [{stack: "", approxTime: 50}],

  // TO BE IMPLEMENTED: https://github.com/mozilla/activity-stream/issues/2526
  "time running on main thread": "[TBD]"
}
```
