import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {ASRouterUtils} from "../../asrouter/asrouter-content";
import {connect} from "react-redux";
import {ModalOverlay} from "../../asrouter/components/ModalOverlay/ModalOverlay";
import React from "react";
import {SimpleHashRouter} from "./SimpleHashRouter";

const Row = props => (<tr className="message-item" {...props}>{props.children}</tr>);

function relativeTime(timestamp) {
  if (!timestamp) {
    return "";
  }
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (seconds < 2) {
    return "just now";
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (minutes === 1) {
    return "1 minute ago";
  } else if (minutes < 600) {
    return `${minutes} minutes ago`;
  }
  return new Date(timestamp).toLocaleString();
}

const OPT_OUT_PREF = "discoverystream.optOut.0";
const LAYOUT_VARIANTS = {
  "basic": "Basic default layout (on by default in nightly)",
  "dev-test-all": "A little bit of everything. Good layout for testing all components",
  "dev-test-feeds": "Stress testing for slow feeds",
};
class DiscoveryStreamAdmin extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onEnableToggle = this.onEnableToggle.bind(this);
    this.changeEndpointVariant = this.changeEndpointVariant.bind(this);
  }

  get isOptedOut() {
    return this.props.otherPrefs[OPT_OUT_PREF];
  }

  setConfigValue(name, value) {
    this.props.dispatch(ac.OnlyToMain({type: at.DISCOVERY_STREAM_CONFIG_SET_VALUE, data: {name, value}}));
  }

  onEnableToggle(event) {
    this.setConfigValue("enabled", event.target.checked);
  }

  changeEndpointVariant(event) {
    const endpoint = this.props.state.config.layout_endpoint;
    if (endpoint) {
      this.setConfigValue("layout_endpoint", endpoint.replace(/layout_variant=.+/, `layout_variant=${event.target.value}`));
    }
  }

  renderComponent(width, component) {
    return (
      <table><tbody>
        <Row>
          <td className="min">Type</td>
          <td>{component.type}</td>
        </Row>
        <Row>
          <td className="min">Width</td>
          <td>{width}</td>
        </Row>
        {component.feed && this.renderFeed(component.feed)}
      </tbody></table>
    );
  }

  isCurrentVariant(id) {
    const endpoint = this.props.state.config.layout_endpoint;
    const isMatch = endpoint && !!endpoint.match(`layout_variant=${id}`);
    return isMatch;
  }

  renderFeed(feed) {
    const {feeds} = this.props.state;
    if (!feed.url) {
      return null;
    }
    return (
      <React.Fragment>
        <Row>
          <td className="min">Feed url</td>
          <td>{feed.url}</td>
        </Row>
        <Row>
          <td className="min">Data last fetched</td>
          <td>{relativeTime(feeds.data[feed.url] ? feeds.data[feed.url].lastUpdated : null) || "(no data)"}</td>
        </Row>
      </React.Fragment>
    );
  }

  render() {
    const {isOptedOut} = this;

    const {config, lastUpdated, layout} = this.props.state;
    return (<div>

      <div className="dsEnabled"><input type="checkbox" checked={config.enabled} onChange={this.onEnableToggle} /> enabled
        {isOptedOut ? (<span className="optOutNote">(Note: User has opted-out. Check this box to reset)</span>) : ""}</div>

      <h3>Endpoint variant</h3>
      <p>You can also change this manually by changing this pref: <code>browser.newtabpage.activity-stream.discoverystream.config</code></p>
      <table style={config.enabled ? null : {opacity: 0.5}}><tbody>
        {Object.keys(LAYOUT_VARIANTS).map(id => (<Row key={id}>
          <td className="min"><input type="radio" value={id} checked={this.isCurrentVariant(id)} onChange={this.changeEndpointVariant} /></td>
          <td className="min">{id}</td>
          <td>{LAYOUT_VARIANTS[id]}</td>
        </Row>))}
      </tbody></table>

      <h3>Caching info</h3>
      <table style={config.enabled ? null : {opacity: 0.5}}><tbody>
        <Row><td className="min">Data last fetched</td><td>{relativeTime(lastUpdated) || "(no data)"}</td></Row>
      </tbody></table>

      <h3>Layout</h3>

      {layout.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`}>
          {row.components.map((component, componentIndex) => (
            <div key={`component-${componentIndex}`} className="ds-component">
              {this.renderComponent(row.width, component)}
            </div>
          ))}
        </div>
      ))}
    </div>);
  }
}

export class ASRouterAdminInner extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMessage = this.onMessage.bind(this);
    this.handleEnabledToggle = this.handleEnabledToggle.bind(this);
    this.handleUserPrefToggle = this.handleUserPrefToggle.bind(this);
    this.onChangeMessageFilter = this.onChangeMessageFilter.bind(this);
    this.findOtherBundledMessagesOfSameTemplate = this.findOtherBundledMessagesOfSameTemplate.bind(this);
    this.handleExpressionEval = this.handleExpressionEval.bind(this);
    this.onChangeTargetingParameters = this.onChangeTargetingParameters.bind(this);
    this.onChangeAttributionParameters = this.onChangeAttributionParameters.bind(this);
    this.setAttribution = this.setAttribution.bind(this);
    this.onCopyTargetingParams = this.onCopyTargetingParams.bind(this);
    this.onPasteTargetingParams = this.onPasteTargetingParams.bind(this);
    this.onNewTargetingParams = this.onNewTargetingParams.bind(this);
    this.state = {
      messageFilter: "all",
      evaluationStatus: {},
      stringTargetingParameters: null,
      newStringTargetingParameters: null,
      copiedToClipboard: false,
      pasteFromClipboard: false,
      attributionParameters: {
        source: "addons.mozilla.org",
        campaign: "non-fx-button",
        content: "iridium@particlecore.github.io",
      },
    };
  }

  onMessage({data: action}) {
    if (action.type === "ADMIN_SET_STATE") {
      this.setState(action.data);
      if (!this.state.stringTargetingParameters) {
        const stringTargetingParameters = {};
        for (const param of Object.keys(action.data.targetingParameters)) {
          stringTargetingParameters[param] = JSON.stringify(action.data.targetingParameters[param], null, 2);
        }
        this.setState({stringTargetingParameters});
      }
    }
  }

  componentWillMount() {
    const endpoint = ASRouterUtils.getPreviewEndpoint();
    ASRouterUtils.sendMessage({type: "ADMIN_CONNECT_STATE", data: {endpoint}});
    ASRouterUtils.addListener(this.onMessage);
  }

  componentWillUnmount() {
    ASRouterUtils.removeListener(this.onMessage);
  }

  findOtherBundledMessagesOfSameTemplate(template) {
    return this.state.messages.filter(msg => msg.template === template && msg.bundled);
  }

  handleBlock(msg) {
    if (msg.bundled) {
      // If we are blocking a message that belongs to a bundle, block all other messages that are bundled of that same template
      let bundle = this.findOtherBundledMessagesOfSameTemplate(msg.template);
      return () => ASRouterUtils.blockBundle(bundle);
    }
    return () => ASRouterUtils.blockById(msg.id);
  }

  handleUnblock(msg) {
    if (msg.bundled) {
      // If we are unblocking a message that belongs to a bundle, unblock all other messages that are bundled of that same template
      let bundle = this.findOtherBundledMessagesOfSameTemplate(msg.template);
      return () => ASRouterUtils.unblockBundle(bundle);
    }
    return () => ASRouterUtils.unblockById(msg.id);
  }

  handleOverride(id) {
    return () => ASRouterUtils.overrideMessage(id);
  }

  expireCache() {
    ASRouterUtils.sendMessage({type: "EXPIRE_QUERY_CACHE"});
  }

  resetPref() {
    ASRouterUtils.sendMessage({type: "RESET_PROVIDER_PREF"});
  }

  handleExpressionEval() {
    const context = {};
    for (const param of Object.keys(this.state.stringTargetingParameters)) {
      const value = this.state.stringTargetingParameters[param];
      context[param] = value ? JSON.parse(value) : null;
    }
    ASRouterUtils.sendMessage({
      type: "EVALUATE_JEXL_EXPRESSION",
      data: {
        expression: this.refs.expressionInput.value,
        context,
      },
    });
  }

  onChangeTargetingParameters(event) {
    const {name} = event.target;
    const {value} = event.target;

    this.setState(({stringTargetingParameters}) => {
      let targetingParametersError = null;
      const updatedParameters = {...stringTargetingParameters};
      updatedParameters[name] = value;
      try {
        JSON.parse(value);
      } catch (e) {
        console.log(`Error parsing value of parameter ${name}`); // eslint-disable-line no-console
        targetingParametersError = {id: name};
      }

      return {
        copiedToClipboard: false,
        evaluationStatus: {},
        stringTargetingParameters: updatedParameters,
        targetingParametersError,
      };
    });
  }

  handleEnabledToggle(event) {
    const provider = this.state.providerPrefs.find(p => p.id === event.target.dataset.provider);
    const userPrefInfo = this.state.userPrefs;

    const isUserEnabled = provider.id in userPrefInfo ? userPrefInfo[provider.id] : true;
    const isSystemEnabled = provider.enabled;
    const isEnabling = event.target.checked;

    if (isEnabling) {
      if (!isUserEnabled) {
        ASRouterUtils.sendMessage({type: "SET_PROVIDER_USER_PREF", data: {id: provider.id, value: true}});
      }
      if (!isSystemEnabled) {
        ASRouterUtils.sendMessage({type: "ENABLE_PROVIDER", data: provider.id});
      }
    } else {
      ASRouterUtils.sendMessage({type: "DISABLE_PROVIDER", data: provider.id});
    }

    this.setState({messageFilter: "all"});
  }

  handleUserPrefToggle(event) {
    const action = {type: "SET_PROVIDER_USER_PREF", data: {id: event.target.dataset.provider, value: event.target.checked}};
    ASRouterUtils.sendMessage(action);
    this.setState({messageFilter: "all"});
  }

  onChangeMessageFilter(event) {
    this.setState({messageFilter: event.target.value});
  }

  // Simulate a copy event that sets to clipboard all targeting paramters and values
  onCopyTargetingParams(event) {
    const stringTargetingParameters = {...this.state.stringTargetingParameters};
    for (const key of Object.keys(stringTargetingParameters)) {
      // If the value is not set the parameter will be lost when we stringify
      if (stringTargetingParameters[key] === undefined) {
        stringTargetingParameters[key] = null;
      }
    }
    const setClipboardData = e => {
      e.preventDefault();
      e.clipboardData.setData("text", JSON.stringify(stringTargetingParameters, null, 2));
      document.removeEventListener("copy", setClipboardData);
      this.setState({copiedToClipboard: true});
    };

    document.addEventListener("copy", setClipboardData);

    document.execCommand("copy");
  }

  // Copy all clipboard data to targeting parameters
  onPasteTargetingParams(event) {
    this.setState(({pasteFromClipboard}) => ({
      pasteFromClipboard: !pasteFromClipboard,
      newStringTargetingParameters: "",
    }));
  }

  onNewTargetingParams(event) {
    this.setState({newStringTargetingParameters: event.target.value});
    event.target.classList.remove("errorState");
    this.refs.targetingParamsEval.innerText = "";

    try {
      const stringTargetingParameters = JSON.parse(event.target.value);
      this.setState({stringTargetingParameters});
    } catch (e) {
      event.target.classList.add("errorState");
      this.refs.targetingParamsEval.innerText = e.message;
    }
  }

  renderMessageItem(msg) {
    const isCurrent = msg.id === this.state.lastMessageId;
    const isBlocked = this.state.messageBlockList.includes(msg.id) || this.state.messageBlockList.includes(msg.campaign);
    const impressions = this.state.messageImpressions[msg.id] ? this.state.messageImpressions[msg.id].length : 0;

    let itemClassName = "message-item";
    if (isCurrent) { itemClassName += " current"; }
    if (isBlocked) { itemClassName += " blocked"; }

    return (<tr className={itemClassName} key={msg.id}>
      <td className="message-id"><span>{msg.id} <br /></span></td>
      <td>
        <button className={`button ${(isBlocked ? "" : " primary")}`} onClick={isBlocked ? this.handleUnblock(msg) : this.handleBlock(msg)}>{isBlocked ? "Unblock" : "Block"}</button>
       {isBlocked ? null : <button className="button" onClick={this.handleOverride(msg.id)}>Show</button>}
       <br />({impressions} impressions)
      </td>
      <td className="message-summary">
        <pre>{JSON.stringify(msg, null, 2)}</pre>
      </td>
    </tr>);
  }

  renderMessages() {
    if (!this.state.messages) {
      return null;
    }
    const messagesToShow = this.state.messageFilter === "all" ? this.state.messages : this.state.messages.filter(message => message.provider === this.state.messageFilter);
    return (<table><tbody>
      {messagesToShow.map(msg => this.renderMessageItem(msg))}
    </tbody></table>);
  }

  renderMessageFilter() {
    if (!this.state.providers) {
      return null;
    }
    return (<p>Show messages from <select value={this.state.messageFilter} onChange={this.onChangeMessageFilter}>
      <option value="all">all providers</option>
      {this.state.providers.map(provider => (<option key={provider.id} value={provider.id}>{provider.id}</option>))}
    </select></p>);
  }

  renderTableHead() {
    return (<thead>
      <tr className="message-item">
        <td className="min" />
        <td className="min">Provider ID</td>
        <td>Source</td>
        <td className="min">Cohort</td>
        <td className="min">Last Updated</td>
      </tr>
    </thead>);
  }

  renderProviders() {
    const providersConfig = this.state.providerPrefs;
    const providerInfo = this.state.providers;
    const userPrefInfo = this.state.userPrefs;

    return (<table>{this.renderTableHead()}<tbody>
      {providersConfig.map((provider, i) => {
        const isTestProvider = provider.id === "snippets_local_testing";
        const info = providerInfo.find(p => p.id === provider.id) || {};
        const isUserEnabled = provider.id in userPrefInfo ? userPrefInfo[provider.id] : true;
        const isSystemEnabled = (isTestProvider || provider.enabled);

        let label = "local";
        if (provider.type === "remote") {
          label = (<span>endpoint (<a className="providerUrl" target="_blank" href={info.url} rel="noopener noreferrer">{info.url}</a>)</span>);
        } else if (provider.type === "remote-settings") {
          label = `remote settings (${provider.bucket})`;
        }

        let reasonsDisabled = [];
        if (!isSystemEnabled) {
          reasonsDisabled.push("system pref");
        }
        if (!isUserEnabled) {
          reasonsDisabled.push("user pref");
        }
        if (reasonsDisabled.length) {
          label = `disabled via ${reasonsDisabled.join(", ")}`;
        }

        return (<tr className="message-item" key={i}>

          <td>{isTestProvider ? <input type="checkbox" disabled={true} readOnly={true} checked={true} /> : <input type="checkbox" data-provider={provider.id} checked={isUserEnabled && isSystemEnabled} onChange={this.handleEnabledToggle} />}</td>
          <td>{provider.id}</td>
          <td><span className={`sourceLabel${(isUserEnabled && isSystemEnabled) ? "" : " isDisabled"}`}>{label}</span></td>
          <td>{provider.cohort}</td>
          <td style={{whiteSpace: "nowrap"}}>{info.lastUpdated ? new Date(info.lastUpdated).toLocaleString() : ""}</td>
        </tr>);
      })}
    </tbody></table>);
  }

  renderPasteModal() {
    if (!this.state.pasteFromClipboard) {
      return null;
    }
    const errors = this.refs.targetingParamsEval && this.refs.targetingParamsEval.innerText.length;
    return (
      <ModalOverlay title="New targeting parameters" button_label={errors ? "Cancel" : "Done"} onDoneButton={this.onPasteTargetingParams}>
        <div className="onboardingMessage">
          <p>
            <textarea onChange={this.onNewTargetingParams} value={this.state.newStringTargetingParameters} autoFocus={true} rows="20" cols="60" />
          </p>
          <p ref="targetingParamsEval" />
        </div>
      </ModalOverlay>
    );
  }

  renderTargetingParameters() {
    // There was no error and the result is truthy
    const success = this.state.evaluationStatus.success && !!this.state.evaluationStatus.result;
    const result = JSON.stringify(this.state.evaluationStatus.result, null, 2) || "(Empty result)";

    return (<table><tbody>
      <tr><td><h2>Evaluate JEXL expression</h2></td></tr>
      <tr>
        <td>
          <p><textarea ref="expressionInput" rows="10" cols="60" placeholder="Evaluate JEXL expressions and mock parameters by changing their values below" /></p>
          <p>Status: <span ref="evaluationStatus">{success ? "✅" : "❌"}, Result: {result}</span></p>
        </td>
        <td>
           <button className="ASRouterButton secondary" onClick={this.handleExpressionEval}>Evaluate</button>
        </td>
      </tr>
      <tr><td><h2>Modify targeting parameters</h2></td></tr>
      <tr>
        <td>
          <button className="ASRouterButton secondary" onClick={this.onCopyTargetingParams} disabled={this.state.copiedToClipboard}>
            {this.state.copiedToClipboard ? "Parameters copied!" : "Copy parameters"}
          </button>
          <button className="ASRouterButton secondary" onClick={this.onPasteTargetingParams} disabled={this.state.pasteFromClipboard}>
            Paste parameters
          </button>
        </td>
      </tr>
      {this.state.stringTargetingParameters && Object.keys(this.state.stringTargetingParameters).map((param, i) => {
        const value = this.state.stringTargetingParameters[param];
        const errorState = this.state.targetingParametersError && this.state.targetingParametersError.id === param;
        const className = errorState ? "errorState" : "";
        const inputComp = (value && value.length) > 30 ?
          <textarea name={param} className={className} value={value} rows="10" cols="60" onChange={this.onChangeTargetingParameters} /> :
          <input name={param} className={className} value={value} onChange={this.onChangeTargetingParameters} />;

        return (<tr key={i}>
          <td>{param}</td>
          <td>{inputComp}</td>
          </tr>);
      })}
      </tbody></table>);
  }

  onChangeAttributionParameters(event) {
    const {name, value} = event.target;

    this.setState(({attributionParameters}) => {
      const updatedParameters = {...attributionParameters};
      updatedParameters[name] = value;

      return {attributionParameters: updatedParameters};
    });
  }

  setAttribution(e) {
    ASRouterUtils.sendMessage({type: "FORCE_ATTRIBUTION", data: this.state.attributionParameters});
  }

  renderPocketStory(story) {
    return (<tr className="message-item" key={story.guid}>
      <td className="message-id"><span>{story.guid} <br /></span></td>
      <td className="message-summary">
        <pre>{JSON.stringify(story, null, 2)}</pre>
      </td>
    </tr>);
  }

  renderPocketStories() {
    const {rows} = this.props.Sections.find(Section => Section.id === "topstories") || {};

    return (<table><tbody>
      {rows && rows.map(story => this.renderPocketStory(story))}
    </tbody></table>);
  }

  renderDiscoveryStream() {
    const {config} = this.props.DiscoveryStream;

    return (<div>
      <table><tbody>
        <tr className="message-item"><td className="min">Enabled</td><td>{config.enabled ? "yes" : "no"}</td></tr>
        <tr className="message-item"><td className="min">Endpoint</td><td>{config.endpoint || "(empty)"}</td></tr>
      </tbody></table>
    </div>);
  }

  renderAttributionParamers() {
    return (
      <div>
        <h2> Attribution Parameters </h2>
        <p> This forces the browser to set some attribution parameters, useful for testing the Return To AMO feature. Clicking on 'Force Attribution', with the default values in each field, will demo the Return To AMO flow with the addon called 'Iridium for Youtube'. If you wish to try different attribution parameters, enter them in the text boxes. If you wish to try a different addon with the Return To AMO flow, make sure the 'content' text box has the addon GUID, then click 'Force Attribution'.</p>
        <table>
          <tr>
            <td><b> Source </b></td>
            <td> <input type="text" name="source" placeholder="addons.mozilla.org" value={this.state.attributionParameters.source} onChange={this.onChangeAttributionParameters} /> </td>
          </tr>
          <tr>
            <td><b> Campaign </b></td>
            <td> <input type="text" name="campaign" placeholder="non-fx-button" value={this.state.attributionParameters.campaign} onChange={this.onChangeAttributionParameters} /> </td>
          </tr>
          <tr>
            <td><b> Content </b></td>
            <td> <input type="text" name="content" placeholder="iridium@particlecore.github.io" value={this.state.attributionParameters.content} onChange={this.onChangeAttributionParameters} /> </td>
          </tr>
          <tr>
            <td> <button className="ASRouterButton primary button" onClick={this.setAttribution} > Force Attribution </button> </td>
          </tr>
        </table>
      </div>);
  }

  renderErrorMessage({id, errors}) {
    const providerId = <td rowSpan={errors.length}>{id}</td>;
    // .reverse() so that the last error (most recent) is first
    return errors.map(({error, timestamp}, cellKey) => (<tr key={cellKey}>
      {cellKey === errors.length - 1 ? providerId : null}
      <td>{error.message}</td>
      <td>{relativeTime(timestamp)}</td>
      </tr>)
    ).reverse();
  }

  renderErrors() {
    const providersWithErrors = this.state.providers && this.state.providers
      .filter(p => p.errors && p.errors.length);

    if (providersWithErrors && providersWithErrors.length) {
      return (<table className="errorReporting">
        <thead>
          <tr>
            <th>Provider ID</th>
            <th>Message</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>{providersWithErrors.map(this.renderErrorMessage)}</tbody>
        </table>);
    }

    return <p>No errors</p>;
  }

  getSection() {
    const [section] = this.props.location.routes;
    switch (section) {
      case "targeting":
        return (<React.Fragment>
          <h2>Targeting Utilities</h2>
          <button className="button" onClick={this.expireCache}>Expire Cache</button> (This expires the cache in ASR Targeting for bookmarks and top sites)
          {this.renderTargetingParameters()}
          {this.renderAttributionParamers()}
        </React.Fragment>);
      case "pocket":
        return (<React.Fragment>
          <h2>Pocket</h2>
          {this.renderPocketStories()}
        </React.Fragment>);
      case "ds":
        return (<React.Fragment>
          <h2>Discovery Stream</h2>
          <DiscoveryStreamAdmin state={this.props.DiscoveryStream} otherPrefs={this.props.Prefs.values} dispatch={this.props.dispatch} />
        </React.Fragment>);
      case "errors":
        return (<React.Fragment>
          <h2>ASRouter Errors</h2>
          {this.renderErrors()}
          </React.Fragment>
        );
      default:
        return (<React.Fragment>
          <h2>Message Providers <button title="Restore all provider settings that ship with Firefox" className="button" onClick={this.resetPref}>Restore default prefs</button></h2>
          {this.state.providers ? this.renderProviders() : null}
          <h2>Messages</h2>
          {this.renderMessageFilter()}
          {this.renderMessages()}
          {this.renderPasteModal()}
        </React.Fragment>);
    }
  }

  render() {
    return (<div className="asrouter-admin">
      <aside className="sidebar">
        <ul>
          <li><a href="#devtools">General</a></li>
          <li><a href="#devtools-targeting">Targeting</a></li>
          <li><a href="#devtools-pocket">Pocket</a></li>
          <li><a href="#devtools-ds">Discovery Stream</a></li>
          <li><a href="#devtools-errors">Errors</a></li>
        </ul>
      </aside>
      <main className="main-panel">
      <h1>AS Router Admin</h1>

      <p className="helpLink">
        <span className="icon icon-small-spacer icon-info" />
        {" "}
        <span>
          Need help using these tools? Check out our <a target="blank" href="https://github.com/mozilla/activity-stream/blob/master/content-src/asrouter/docs/debugging-docs.md">documentation</a>
        </span>
      </p>

      {this.getSection()}
      </main>
    </div>);
  }
}

export const _ASRouterAdmin = props => (<SimpleHashRouter><ASRouterAdminInner {...props} /></SimpleHashRouter>);
export const ASRouterAdmin = connect(state => ({Sections: state.Sections, DiscoveryStream: state.DiscoveryStream, Prefs: state.Prefs}))(_ASRouterAdmin);
