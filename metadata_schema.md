The metadata database in Activity Stream stores information about pages and their images in the following tables. 

# Metadata Table
A row in this table represents the metadata of a single page which has been visited 1 or more times by the user.

field | type | description
--- | --- | --- 
id | Int | auto incrementing primary key
cache_key | String (Unique) | A simplified URL which is shared across multiple places URLs (ie protocol removed, query string reduced/removed)
places_url | String | The unmodified URL which appears in the PlacesDB when a user visits a page 
title | String | The title of the page
type | String | The og:type tag ie 'article', 'video', 'page', etc
description | String | The meta description of the page
media_url | String | The URL for an embedded media item (audio/video)
created_at | datetime | The date and time that this metadata row was inserted/created
expired_at | Long | The date and time this metadata row will expire

# Images Table
A row in this table represents a single image which appears on a page visited by a user, including favicons and rich icons.  Each row in the metadata table will have multiple corresponding images in this table.  A single row in this table may belong to multiple metadata page rows, ie a favicon which is identical for multiple pages.

field | type | description
--- | --- | ---
id | Int | auto incrementing primary key
type | Int | The type of the image, initial types are: favicon 1, rich_icon 2, preview 3 (constants)
url | String | The URL for the image
height | Int | The height of the image in pixels
width | Int | The width of the image in pixels
color | String | The dominant/aggregate color of the image

# MetadataImage Join Table
A row in this table represents a pair of a metadata row and an image row which indicates that that image appears on that page.

field | type | description
--- | --- | --- 
metadata_id | Int | A foreign key onto the Metadata table
image_id | Int | A foreign key onto the Images table
