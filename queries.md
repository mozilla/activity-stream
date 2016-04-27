# Query documentation

## Highlights

### Description of query

The highlights query is composed of two parts:

( A ) Select **1 item** from History where:

* the item has a bookmark
* the date the bookmark was created (`bookmarkDateCreated`) is in the last 3 days
* the bookmark has been visited no more than 3 times (`visit_count`)

Items are ordered (descending) by the date the bookmark was created (`bookmarkDateCreated`), meaning that newer item will come first.

( B ) Then, select up to **20 items** from History, where:

* the item was NOT visited (`last_visit_date`) in the last 30 minutes
* the `rev_host` is unique (no two results returned should have the same `rev_host`
* the `rev_host` is NOT one of "www.google.com", "www.google.ca", "calendar.google.com", "mail.google.com", "mail.yahoo.com", "search.yahoo.com", "localhost", "t.co", "."

Item are ordered (descending) by last visit date (`last_visit_date`), meaning that more recent items will come first.

### Examples of items that could satisfy the requirements

* A link with a bookmark created 10 seconds ago that was only visited once
* A link with a bookmark created 2 days ago that was visited three times
* `www.wired.com`, visited 45 minutes ago
* `www.cnn.com/some-article` visited 2 hours ago

### Examples of items that would *not* satisfy the requirements

* A link with a bookmark created 5 minutes ago that was visited 4 times *(reason: it was visited more than 3 times)*
* A link with a bookmark created last month that was visited once *(reason: it is too old)*
* `www.wired.com` visited 5 minutes ago *(reason: it was visited too recently)*
* `mail.google.com` visited 2 hours ago *(reason: mail.google.com is in the blocklist)*
* `www.cnn.com/article-2`, if `wwww.cnn.com/article-1` were already included in the query *(reason: only one link per `rev_host` are allowed)*

### Additional notes

Some requirements/adjustments are also made to the initial query after enhanced data is received from Embedly and the links are placed in the UI:

* Links that are already in the Top Sites section are removed from Highlights
* Links that have **images and good titles/descriptions** are prioritized are sorted before those that do not
* Only links that **already have cached data available** are returned to the UI, meaning that not all links returned from the query will reach the UI.

### Possible empty conditions

* A new profile or empty history with no bookmarks, in the first 30 minutes of usage.
* The embedly cache is empty/all items returned do not yet have cached data
