# Query documentation

## Highlights

### Description of query

The highlights query is composed of two parts:

( A ) Attempt to select **1 item** from History where:

* the item has a bookmark
* the date the bookmark was created (`bookmarkDateCreated`) is in the last 3 days
* the bookmark has been visited no more than 3 times (`visit_count`)

Items are ordered (descending) by the date the bookmark was created (`bookmarkDateCreated`), meaning that newer item will come first.

If no item exists, the first spot will be replaced by items in the following query:

( B ) Then, select up to **20 items** from History, where:

* the `last_visit_date` is earlier than 30 minutes ago
* the item has been visited no more than 3 times (`visit_count`)
* the `rev_host` is unique (no two results returned should have the same `rev_host`
* the `rev_host` is NOT one of the blacklisted items in `REV_HOST_BLACKLIST` (See `lib/PlacesProvider.js` for this list)

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

* All links in the query are returned to the UI, **regardless of whether or not they have embedly preview data available**. This means that some links will (temporarily) have no images, colors, etc.
* Links that are already in the Top Sites section are removed from Highlights
* For Highlights, links that have **images and good titles/descriptions** are prioritized are sorted before those that do not
