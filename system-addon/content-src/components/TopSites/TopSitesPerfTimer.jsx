const React = require("react");
const {connect} = require("react-redux");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {perfService: perfSvc} = require("common/PerfService.jsm");

/**
 * A proxy class that uses double requestAnimationFrame from
 * componentDidMount to dispatch a SAVE_SESSION_PERF_DATA to the main procsess
 * after the paint.
 *
 * This uses two callbacks because, after one callback, this part of the tree
 * may have rendered but not yet reflowed.  This strategy is modeled after
 * https://stackoverflow.com/a/34999925 but uses a double rFA because
 * we want to get to the closest reliable paint for measuring, and
 * setTimeout is often throttled or queued by browsers in ways that could
 * make it lag too long.
 *
 * XXX Should be made more generic by using this.props.children, or potentially
 * even split out into a higher-order component to wrap whatever.
 *
 * @class TopSitesPerfTimer
 * @extends {React.PureComponent}
 */
class TopSitesPerfTimer extends React.PureComponent {
  constructor(props) {
    super(props);
    // Just for test dependency injection:
    this.perfSvc = this.props.perfSvc || perfSvc;

    this._sendPaintedEvent = this._sendPaintedEvent.bind(this);
    this._timestampHandled = false;
  }

  componentDidMount() {
    this._maybeSendPaintedEvent();
  }

  componentDidUpdate() {
    this._maybeSendPaintedEvent();
  }

  /**
   * Call the given callback after the upcoming frame paints.
   *
   * @note Both setTimeout and requestAnimationFrame are throttled when the page
   * is hidden, so this callback may get called up to a second or so after the
   * requestAnimationFrame "paint" for hidden tabs.
   *
   * Newtabs hidden while loading will presumably be fairly rare (other than
   * preloaded tabs, which we will be filtering out on the server side), so such
   * cases should get lost in the noise.
   *
   * If we decide that it's important to find out when something that's hidden
   * has "painted", however, another option is to post a message to this window.
   * That should happen even faster than setTimeout, and, at least as of this
   * writing, it's not throttled in hidden windows in Firefox.
   *
   * @param {Function} callback
   *
   * @returns void
   */
  _afterFramePaint(callback) {
    requestAnimationFrame(() => setTimeout(callback, 0));
  }

  _maybeSendPaintedEvent() {
    // We don't want this to ever happen, but sometimes it does.  And when it
    // does (typically on the first newtab at startup time calling
    // componentDidMount), the paint(s) we care about will be later (eg
    // in a subsequent componentDidUpdate).
    if (!this.props.TopSites.initialized) {
      // XXX should send bad event
      return;
    }

    // If we've already handled a timestamp, don't do it again
    if (this._timestampHandled) {
      return;
    }

    // And if we haven't, we're doing so now, so remember that. Even if
    // something goes wrong in the callback, we can't try again, as we'd be
    // sending back the wrong data, and we have to do it here, so that other
    // calls to this method while waiting for the next frame won't also try to
    // handle handle it.
    this._timestampHandled = true;

    this._afterFramePaint(this._sendPaintedEvent);
  }

  _sendPaintedEvent() {
    this.perfSvc.mark("topsites_first_painted_ts");

    try {
      let topsites_first_painted_ts = this.perfSvc
        .getMostRecentAbsMarkStartByName("topsites_first_painted_ts");

      this.props.dispatch(ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {topsites_first_painted_ts}
      }));
    } catch (ex) {
      // If this failed, it's likely because the `privacy.resistFingerprinting`
      // pref is true.  We should at least not blow up, and should continue
      // to set this._timestampHandled to avoid going through this again.
    }
  }

  render() {
    return this.props.children;
  }
}

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSitesPerfTimer);
module.exports._unconnected = TopSitesPerfTimer;
