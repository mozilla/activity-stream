# Performance Telemetry Roadmap

In addition to the useful reading that @digitarald suggested, I also got a bunch out of reading [LinkedIn's blog post](https://engineering.linkedin.com/blog/2017/02/measuring-and-optimizing-performance-of-single-page-applications).  Much of this roadmap is based on discussions with @digitarald, @k88hudson, and initial prototyping and implementation experience.

 In an ideal world, we'd do a bunch of user research around our existing implementation to figure if we're measuring the right stuff, but the SDK one is probably not the right starting point.  So these measurements are in large part informed by perceived performance measurement practices from the web world, as well as what's easy to bootstrap/measure.  We can do subsequent user research and iteration once we've got a reasonable baseline implemented.

## Perceived performance contexts

In addition to replacing `about:newtab`, activity stream also replaces `about:home`. There are a number of  key performance contexts here:

1. `about:newtab` always preloaded in a hidden context, and then made visible in a fresh tab

1. `about:home` by default, the first page that comes up in the default tab in a new browser window, including at startup time. This is effectively a normal render.

1. `about:home` from the toolbar button (not shown by default): will make the current tab load activity stream. Tab-blanking followed by a normal
render.

XXX add non-preloaded newtab case
XXX to fill in perceived start of measurement for each context

## Proposed initial user timings
Here are the candidate first user timings.  The idea is that we should (over time) be able to easily use the included markers for all of:

* profiling/optimizing
* real user monitoring (a.k.a. rum), accomplished by Telemetry
* synthetic regression testing (talos/WebPageTest)

The highest priority wants to be implementing the timing markers themselves and sending them to telemetry dashboards.

Risk: Synthetic regression testing in continuous integration (e.g. talos-style) is important too, because it creates a much tighter feedback with high specificity about what caused the regressions.  Until we get it, we'll mostly have to lean on both RUM and existing talos monitoring.


* user timing benchmarks (rum first; syn later)
    * ensure that opening first browser/tab triggers preload for next about:newtab (#2527)
    * general
        * add-on initialization time (XXXneed to file)
        * `about:home` load start time (#2658)
    * initiation events
        * time at BrowserOpenTab (cmd_md_newNavigatorTab, <strike>#2539</strike>), which should kick off:
            * time at command T (<strike>#2539</strike>)
            * time at + button (<strike>#2539</strike>)
            * time at menu click  (<strike>#2539></strike>)
        * time at home toolbar button click (#2658)
        * visibility notification time (<strike>#2539</strike>)
    * KPIs (both probably using componentDidUpdate, http://stackoverflow.com/a/34999925, but with 2 rfas instead of a setTimeout + RFA), see also Dropbox code)
        * FMP/Hero Element: painting of TopSites (#2661)
        * Display Done: timing of top-level components (#2662)
* tti benchmarks
    * Search responsiveness (per character)
        * input latency between keystroke and character visibility (#2663)
        * keystroke autocomplete update (#2664)
    * time to first real interaction (first keypress or click event) (#2668)
* bad states
    * top sites data is ready (if later than render time) (#2672)
    * bookend all event handlers send bad state if > 10ms (#2669)

There is some perceptual stuff that I hope that we can get out of WebPageTest/Talos as well as performance.timing eventually, but I don't think that's the highest priority, since so much of that is focused on loading stuff over the network, and that's a set of issues we just don't have.

maybe/later

* for regressions: get measurements from WebPageTest via Talos
* write metric using MozAfterPaint to track final paint time (but this looks hard for content pages)
    * https://groups.google.com/forum/#!topic/mozilla.dev.platform/pCLwWdYc_GY
    * but, see
        * https://bugzilla.mozilla.org/show_bug.cgi?id=1264798#c12
        * http://searchfox.org/mozilla-central/source/dom/webidl/NotifyPaintEvent.webidl
* jank monitor
> The workaround is having a "heartbeat" (continues 50ms timer, not having much perf impact). Using the skew of expected time and actual time you can tell if the main thread was blocked. Make sure to also include page visibility as factor as that can throttle timers. Somes sites started using this technique + meaningful paint to guess TTI.

* tti
    * performance.timing.timeToInteractive
        * syn/RUM: once bug 1299118 lands
* painting/display
    * first meaningful paint: "the user feels that the primary content of the page is visible” “biggest layout chunk painted”
        * syn/rum: use performance.timing.firstMeaningfulPaint
            * set pref: dom.performance.first-meaningful-paint.enabled
            * after bug 1299117 lands
    * SI (progress of above-fold loading)
        * syn: webpagetest
        * rum: https://github.com/WPO-Foundation/RUM-SpeedIndex
    * PSI (above-fold loading, but notices visual jitter/layout thrashing)
        * syn: WPT
        * rum: (none)