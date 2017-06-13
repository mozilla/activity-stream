# Adding/Changing Telemetry Checklist

Adding telemetry generally involves a few steps:

1. - [ ] File a "user story issue" about who wants what question answered.  This will be used to track server-side data handling implementation (ETL, dashboard implementation...).

    > As an engineer, I see the distribution of times between triggering a new tab load by tab menu entry, plus button or keyboard shortcut and when the visibility event is fired on that page, so that I can understand how long it takes before the page becomes visible and how close to instantaneous that feels.

1. - [ ] File or update your existing client-side implementation bug so that it points to the "user story issue".
1. - [ ] Talk to Marina (@emtwo) about the dashboard you're hoping to see from the data you're adding, and work with her to create a data model (or request her review on it after the fact).
1. - [ ] Update `system-addons/test/schemas/pings.js` with a commented JOI schema of your changes, and add tests to system-addons/test/unit/TelemetryFeed.test.js to exercise the ping creation.
1. - [ ] Update [data_events.md](data_events.md) with an example of the data in question
1. - [ ] Update any fields that you've added, deleted, or changed in [data_dictionary.md](data_dictionary.md)
1. - [ ] Get review from Nan (@ncloudioj) and (XXX or?) Marina (@emtwo) on the data schema and the documentation changes.
1. - [ ] Get review from a [data steward]() of the documentation changes to make sure this data collection fits under the "share additional data" pref, which is opt-in in 53-release, and opt-out in 55-nightly (XXX waiting on info from @tspurway for the correct general framing here?).
1. - [ ] Implement as usual...
1. - [ ] After landing the implementation, check with Nan (@ncloudioj) to make sure the pings are making it to the database
