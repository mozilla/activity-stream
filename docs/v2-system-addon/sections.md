# Sections in Activity Stream

Each section in Activity Stream displays data from a corresponding section feed
in a standardised `Section` UI component. Section feeds are responsible for
registering/deregistering their UI component and supplying rows data (the sites
for the section to display).

Activity Stream loads sections from the `SECTIONS` map in `ActivityStream.jsm`.
Configuration objects must be keyed by a unique section id and have the
properties `{feed, showByDefault}`, where `feed` is the section feed class.

The `Section` UI component displays the rows provided by the section feed. If no
rows are available it displays an empty state consisting of an icon and a
message. Optionally, the section may have a info option menu that is displayed
when users hover over the info icon.

## Section feeds

Each section feed is given the pref
`{Activity Stream pref branch}.feeds.section.{section_id}`. This pref turns the
section feed on and off.

### Registering the section

The section feed must listen for the events `INIT` (dispatched
when Activity Stream is initialised) and `FEED_INIT` (dispatched when a feed is
re-enabled having been turned off, with the feed id as the `data`) and respond
by dispatching a `SECTION_REGISTER` action to enable the section's UI component.
The action's `data` object should have the following properties:

```js
{
  id, // Unique section id
  icon, // Section icon id - new icons should be added to icons.scss
  title: {id, values}, // Title localisation id and placeholder values
  maxCards, // Max number of site cards to dispay
  contextMenuOptions, // Default context-menu options for cards
  infoOption: { // Info option dialog
    header: {id, values}, // Header localisation id and values
    body: {id, values}, // Body localisation id and values
    link: {href, id, values}, // Link href, localisation id and values
  },
  emptyState: { // State if no cards are visible
    message: {id, values}, // Message localisation id and values
    icon // Icon id - new icons should be added to icons.scss
  }
}
```

### Deregistering the section

The section feed must have an `uninit` method. This is called when the section
feed is disabled by turning the section's pref off.

In `uninit` the feed must broadcast a `SECTION_DEREGISTER` action with the
section id as the data. This will remove the section's UI component from every
existing Activity Stream page.

### Updating the section rows

The section feed can dispatch a `SECTION_ROWS_UPDATE` action to update its rows.
The action's data object must be passed the section's `id` and an array `rows`
of sites to display. Each site object must have the following properties:

```js
{
  type, // One of the types in Card/types.js, e.g. "Trending"
  title, // Title string
  description, // Description string
  image, // Image url
  url // Site url
}
```

Optionally, rows can also be passed with the `SECTION_REGISTER` action if the
feed already has rows to display.
