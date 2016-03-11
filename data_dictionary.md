
# Example Activity Stream Log

```{"session_duration":1635,"locale":"en-US","ip":"10.192.171.13","date":"2016-03-07",
  "unload_reason":"close","client_id":"374dc4d8-0cb2-4ac5-a3cf-c5a9bc3c602e","max_scroll_depth":145,"addon_version":"1.0.0",
  "total_history_size":9,"ver":"3","ua":"python-requests\/2.9.1","click_position":"100x100","source":"top_sites",
  "timestamp":1457396660000,"action":"activity_stream","tab_id":3,"load_reason":"restore","total_bookmarks":19}```
  
The `about:newtab` page will ping (HTTPS POST) [Onyx](https://github.com/mozilla/onyx) every time the page loses focus.  

* `session_duration` is defined to be the time in milliseconds between the newtab gaining and losing focus :one:
* `unload_reason` is the reason the about:newtab page lost focus :one:
* `client_id` is an identifier for this client :one:
* `max_scroll_depth` is the maximum number of pixels the scroll bar was dragged in this session :one:
* `addon_version` is the version of the Activity Stream addon :one:
* `total_history_size` is the number of history items currently in the user's places db :one:
* `ver` is the version of the Onyx API the ping was sent to :one:
* `click_position` is the index of the element that was clicked :one:
* `tab_id` is the FX generated unique id for the tab :one:
* `action` is always `activity_stream` :one:
* `load_reason` is either (newtab, refocus, restore) and is the reason the tab was focused :one:
* `total_bookmarks` is the total number of bookmarks in the user's places db :one:
* `ua` is the user agent string :two:
* `locale` is the browser chrome's language (eg. en-US) :two:
* `ip` is the IP address of the client :two:
* `source` is either (recent_links, recent_bookmarks, frecent_links, top_sites, spotlight) and indicates what was clicked :two:
* `date` is the date in YYYY-MM-DD format :three:
* `timestamp` is the time in ms since epoch :three:


*where*

:one: Firefox data

:two: HTTP protocol data

:three: server augmented data
