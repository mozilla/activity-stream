const React = require("react");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {perfService: perfSvc} = require("common/PerfService.jsm");

const RECORDED_SECTIONS = ["highlights"];

class SectionsPerfTimer extends React.Component {
  constructor(props) {
    super(props);
    // Just for test dependency injection:
    this.perfSvc = this.props.perfSvc || perfSvc;

    this._sendBadStateEvent = this._sendBadStateEvent.bind(this);
    this._reportMissingData = false;
    this._timestampHandled = false;
  }

  componentDidMount() {
    this._maybeSendPaintedEvent();
  }

  componentDidUpdate() {
    this._maybeSendPaintedEvent();
  }

  _afterFramePaint(callback) {
    requestAnimationFrame(() => setTimeout(callback, 0));
  }

  _maybeSendPaintedEvent() {
    if (RECORDED_SECTIONS.indexOf(this.props.id) === -1) {
      return;
    }

    if (!this.props.initialized) {
      // Remember to report back when data is available.
      this._reportMissingData = true;
    } else if (this._reportMissingData) {
      const dataReadyKey = `${this.props.id}_data_ready_ts`;
      this._reportMissingData = false;
      // Report that data is available later than first render call.
      this._afterFramePaint(() => this._sendBadStateEvent(dataReadyKey));
    }

    if (this._timestampHandled) {
      return;
    }

    this._timestampHandled = true;

    const firstPaintKey = `${this.props.id}_first_painted_ts`;
    this._afterFramePaint(() => this.perfSvc.mark(firstPaintKey));
  }

  _sendBadStateEvent(key) {
    this.perfSvc.mark(key);

    try {
      const sectionFirstPaintKey = `${this.props.id}_first_painted_ts`;
      const value = parseInt(this.perfSvc.getMostRecentAbsMarkStartByName(key) -
                             this.perfSvc.getMostRecentAbsMarkStartByName(sectionFirstPaintKey), 10);
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

  render() {
    return this.props.children;
  }
}

module.exports = SectionsPerfTimer;
