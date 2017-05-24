# Metrics we collect

By default, the about:newtab and about:home pages in Firefox (the pages you see when you open a new tab and when you start the browser), will send data back to Mozilla servers about usage of these pages.  The intent is to collect data in order to improve the user's experience while using Activity Stream.  Data about your specific browsing behaior or the sites you visit is **never transmitted to any Mozilla server**.  At any time, it is easy to **turn off** this data collection by [opting out of Firefox telemetry](https://support.mozilla.org/kb/share-telemetry-data-mozilla-help-improve-firefox).

Data is sent to our servers in the form of discreet HTTPS 'pings' or messages whenever you do some action on the Activity Stream about:home or about:newtab pages.  We try to minimize the amount and frequency of pings by batching them together.  Pings are sent in [JSON serialized format](http://www.json.org/).  

At Mozilla, [we take your privacy very seriously](https://www.mozilla.org/privacy/).  The Activity Stream page will never send any data that could personally identify you.  We do not transmit what you are browsing, searches you perform or any private settings.  Activity Stream does not set or send cookies, and uses [Transport Layer Security](https://en.wikipedia.org/wiki/Transport_Layer_Security) to securely transmit data to Mozilla servers.

Data collected from Activity Stream is retained on Mozilla secured servers for a period of 30 days before being rolled up into an anonymous aggregated format.  After this period the data is deleted permanently.  Mozilla **never shares data with any third party**.

The following is a detailed overview of the different kinds of data we collect in the Activity Stream. See [data_dictionary.md](data_dictionary.md) for more details for each field.

## User event pings

These pings are captured when a user **performs some kind of interaction** in the add-on.

### Basic shape

A user event ping includes some basic metadata (tab id, addon version, etc.) as well as variable fields which indicate the location and action of the event.

```js
{
  // This indicates the type of interaction
  "event": ["CLICK", "SEARCH", "BLOCK", "DELETE", "OPEN_NEW_WINDOW", "OPEN_PRIVATE_WINDOW", "BOOKMARK_DELETE", "BOOKMARK_ADD"],

  // Optional field indicating the UI component type
  "source": "TOP_SITES",

  // Optional field if there is more than one of a component type on a page.
  // It is zero-indexed.
  // For example, clicking the second Highlight would result in an action_position of 1
  "action_position": 1,

  // Basic metadata
  "page": ["about:newtab" | "about:home"],
  "client_id": "26288a14-5cc4-d14f-ae0a-bb01ef45be9c",
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
