#Activity Stream SHIELD Study

## How to run this SHIELD study

tldr; Run the command ```npm run once``` and get a randomly assigned variant.

The SHIELD study work currently lives on branch ```shield_study``` in this repo. To run the study, checkout the branch, run command ```npm start``` in one terminal window, and in another terminal window run command ```shield run . -- -b nightly```. This will randomly pick one of the two variants provided in the study and start it in Nightly. At this point you can see which variant it chose. You can click around and print the ping payloads that get sent. If you want to see one variant specifically, run either ```shield run . Tiles -- -b nightly``` or ```shield run . ActivityStream -- -b nightly``` instead to load up the variant specified.

## How it works

#### Specifics of this study
In this [SHIELD study](https://wiki.mozilla.org/Firefox/Shield/Shield_Studies) a user will be randomly assigned into either the control group or the variant group. If they are in the control group, Activity Stream will **not** be loaded into their browser, and instead they will have the original about:newtab page as their default.
#### About the metrics
At this point any interaction that the user makes with about:newtab will send a ping to our custom data pipeline where it will be recorded for analysis. If they are in the variant group, normal Activity Stream will be loaded and all user events will be collected and recorded as normal. The pings belonging to a SHIELD study user will contain an extra field named ```shield_variant``` which will contain either the name of the control group or the name of the variant group. This will be what we use to distinguish which group each unique user belongs to.

**Sample pings:**
```json
{
	"event":"CLICK",
	"action_position":0,
	"source":"AFFILIATE",
	"shield_variant":"shield-study-01-Tiles",
	"action":"activity_stream_event",
	"tab_id":"-3-2",
	"client_id":"ee88c4ef-4f1d-8149-9582-b727dc92e89f",
	"addon_version":"1.1.5",
	"locale":"en-US",
	"page":"NEW_TAB",
	"session_id":"{ab6f3b3e-dfc6-f944-b082-6f4bbbc21e72}"
}
```
```json
{
	"event":"SEARCH",
	"action":"activity_stream_event",
	"tab_id":"-3-2",
	"client_id":"daf5dc62-08e4-e840-837d-c2adb3b62463",
	"addon_version":"1.1.5",
	"locale":"en-US",
	"page":"NEW_TAB",
	"session_id":"{2426a185-b9bf-a84d-b359-61eb11452382}",
	"shield_variant":"shield-study-01-Tiles"}
```
```json
{
	"tab_id":"-3-2",
	"session_id":"{2426a185-b9bf-a84d-b359-61eb11452382}",
	"total_history_size":100,
	"total_bookmarks":10,
	"load_reason":"newtab",
	"url":"about:newtab",
	"unload_reason":"search",
	"client_id":"daf5dc62-08e4-e840-837d-c2adb3b62463",
	"addon_version":"1.1.5",
	"locale":"en-US",
	"page":"NEW_TAB",
	"shield_variant":"shield-study-01-Tiles",
	"action":"activity_stream_session",
	"session_duration":6242
}
```

## What we hope to achieve

The success criteria for the SHIELD study is as follows:
- Increase the average number of top sites clicks per user per day
- Increase the average number of newtab searches per user per day
- Increase the average number of newtab sessions per user per day
- Maintain search volume


## Studies
###shield-study-01

Dates of study: November xx 2016 - November xx 2016

Duration: 14 days

Activity Stream addon version: 1.1.x

Metrics measured: Clicks and blocks on top sites, search, sessions, performance related events

Total number of users: 20,000

Total number of users per arm: 10,000

Control group: 'Tiles'

Variant group: 'Activity Stream'

User eligibility criteria:

- Must have about:newtab enabled
- Must have local set to en-US
- Must not have Test Pilot add on installed

Findings: *links to dashboards go here*

###shield-study-02
