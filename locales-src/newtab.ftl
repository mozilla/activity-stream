# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

### Firefox Home / New Tab strings for about:home / about:newtab / about:welcome

newtab-page-title = New Tab
newtab-settings-button =
    .title = Customize your New Tab page

## Search box component

# "Search" is a verb/action
newtab-search-box-search-button =
    .title = Search
    .aria-label = Search

newtab-search-box-search-the-web-text = Search the Web
newtab-search-box-search-the-web-input =
    .placeholder = Search the Web
    .title = Search the Web
    .aria-label = Search the Web

## Top Sites - General form dialog

newtab-topsites-add-header = New Top Site
newtab-topsites-edit-header = Edit Top Site
newtab-topsites-title-label = Title
newtab-topsites-title-input =
    .placeholder = Enter a title

newtab-topsites-url-label = URL
newtab-topsites-url-input =
    .placeholder = Type or paste a URL
newtab-topsites-url-validation = Valid URL required

newtab-topsites-image-url-label = Custom Image URL
newtab-topsites-use-image-link = Use a custom image…
newtab-topsites-image-validation = Image failed to load. Try a different URL.

## Top Sites - General form dialog buttons. These are verbs/actions
newtab-topsites-cancel-button = Cancel
newtab-topsites-delete-history-button = Delete from History
newtab-topsites-save-button = Save
newtab-topsites-preview-button = Preview
newtab-topsites-add-button = Add

## Top Sites - Delete history confirmation dialog. newtab-confirm-delete-history-p1 appears in the same dialog
## as newtab-confirm-delete-history-p2.
newtab-confirm-delete-history-p1 = Are you sure you want to delete every instance of this page from your history?
# Note: "This action" refers to deleting a page from history.
newtab-confirm-delete-history-p2 = This action cannot be undone.

newtab-topsites-add-search-engine = Add Search Engine

## Top Site - Action Tooltips.
# Tooltip to open the context menu for a given top site.
newtab-topsites-tooltip =
    .title = Open menu
# Tooltip on an empty topsite box to open the New Top Site dialog.
newtab-topsites-placeholder-tooltip =
    .title = Edit this site

## Context Menu: These strings are displayed in a context menu and are meant as a call to action for a given page.
newtab-menu-edit-topsites = Edit
newtab-menu-open-new-window = Open in a New Window
newtab-menu-open-new-private-window = Open in a New Private Window
newtab-menu-dismiss = Dismiss
newtab-menu-pin = Pin
newtab-menu-unpin = Unpin
newtab-menu-delete-history = Delete from History
newtab-menu-save-to-pocket = Save to { -pocket-brand-name }
newtab-menu-delete-pocket = Delete from { -pocket-brand-name }
newtab-menu-archive-pocket = Archive in { -pocket-brand-name }

# Note: Bookmark is a noun in this case, "Remove bookmark".
newtab-menu-remove-bookmark = Remove Bookmark
# Note: Bookmark is a verb here.
newtab-menu-bookmark = Bookmark

## Context Menu - Downloaded Menu: In (newtab-menu-copy-download-link, newtab-menu-go-to-download-page), 
## "Download" in these cases is not a verb, it is a noun. As in, "Copy the link that belongs to this downloaded item".
newtab-menu-copy-download-link = Copy Download Link
newtab-menu-go-to-download-page = Go to Download Page
newtab-menu-remove-download = Remove from History

## Context Menu - Download Menu: These are platform specific strings found in the context menu of an item that has
## been downloaded. The intention behind "this action" is that it will show where the downloaded file exists on the file
## system for each operating system.
newtab-menu-show-file =
    { PLATFORM() ->
        [macos] Show in Finder
        [windows] Open Containing Folder
        [linux] Open Containing Folder
       *[other] Show File
    }
newtab-menu-open-file = Open File

## Card Tooltip: Action tooltip to open a context menu
newtab-card-tooltip =
    .title = Open menu

## Card Labels: These labels are associated to pages to give
## context on how the element is related to the user, e.g. type indicates that
## the page is bookmarked, or is currently open on another device
newtab-label-visited = Visited
newtab-label-bookmarked = Bookmarked
newtab-label-recommended = Trending
newtab-label-saved = Saved to { -pocket-brand-name }
newtab-label-download = Downloaded

## Section Menu: These strings are displayed in the section context menu and are 
## meant as a call to action for the given section.
newtab-section-menu-remove-section = Remove Section
newtab-section-menu-collapse-section = Collapse Section
newtab-section-menu-expand-section = Expand Section
newtab-section-menu-manage-section = Manage Section
newtab-section-menu-manage-webext = Manage Extension
newtab-section-menu-add-topsite = Add Top Site
newtab-section-menu-add-search-engine = Add Search Engine
newtab-section-menu-move-up = Move Up
newtab-section-menu-move-down = Move Down
newtab-section-menu-privacy-notice = Privacy Notice

## Empty Section States: These show when there are no more items in a section.
newtab-empty-section-highlights = Start browsing, and we’ll show some of the great articles, videos, and other pages you’ve recently visited or bookmarked here.
# Ex. When there are no more Pocket story recommendations, in the space where there would have been stories, this is shown instead.
# Variables:
#  $provider (String): Name of the content provider for this section, e.g "Pocket".
newtab-empty-section-topstories = You’ve caught up. Check back later for more top stories from { $provider }. Can’t wait? Select a popular topic to find more great stories from around the web.
