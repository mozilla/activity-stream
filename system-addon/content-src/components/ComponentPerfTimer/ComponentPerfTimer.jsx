const React = require("react");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {perfService: perfSvc} = require("common/PerfService.jsm");

// Currently record only a fixed set of sections. This will prevent data
// from custom sections from showing up or from topstories.
const RECORDED_SECTIONS = ["highlights", "topsites"];

class ComponentPerfTimer extends React.Component {
  constructor(props) {
    super(props);
    // Just for test dependency injection:
    this.perfSvc = this.props.perfSvc || perfSvc;

    this._sendBadStateEvent = this._sendBadStateEvent.bind(this);
    this._sendPaintedEvent = this._sendPaintedEvent.bind(this);
    this._reportMissingData = false;
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
    if (!RECORDED_SECTIONS.includes(this.props.id)) {
      return;
    }

    if (!this.props.initialized) {
      // Remember to report back when data is available.
      this._reportMissingData = true;
    } else if (this._reportMissingData) {
      this._reportMissingData = false;
      // Report that data is available later than first render call.
      this._afterFramePaint(this._sendBadStateEvent);
    }

    // Only record first call to render.
    if (this._timestampHandled) {
      return;
    }

    this._timestampHandled = true;
    this._afterFramePaint(this._sendPaintedEvent);
  }

  _sendBadStateEvent() {
    const dataReadyKey = `${this.props.id}_data_ready_ts`;
    this.perfSvc.mark(dataReadyKey);

    try {
      const firstPaintKey = `${this.props.id}_first_painted_ts`;
      // value has to be Int32.
      const value = parseInt(this.perfSvc.getMostRecentAbsMarkStartByName(dataReadyKey) -
                             this.perfSvc.getMostRecentAbsMarkStartByName(firstPaintKey), 10);
      console.log("send bad state event", this.props.id);
      this.props.dispatch(ac.SendToMain({
        type: at.TELEMETRY_UNDESIRED_EVENT,
        data: {
          event: `${this.props.id}_missing_data`,
          value
        }
      }));
    } catch (ex) {
      // If this failed, it's likely because the `privacy.resistFingerprinting`
      // pref is true.
    }
  }

  _sendPaintedEvent() {
    const key = `${this.props.id}_first_painted_ts`;
    this.perfSvc.mark(key);

    // Record first_painted event but only send if topsites.
    if (this.props.id !== "topsites") {
      return;
    }

    try {
      const data = {};
      data[key] = this.perfSvc.getMostRecentAbsMarkStartByName(key);

      this.props.dispatch(ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data
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

module.exports = ComponentPerfTimer;
