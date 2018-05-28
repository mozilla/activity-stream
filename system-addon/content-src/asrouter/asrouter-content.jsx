import {actionCreators as ac} from "common/Actions.jsm";
import {OUTGOING_MESSAGE_NAME as AS_GENERAL_OUTGOING_MESSAGE_NAME} from "content-src/lib/init-store";
import {ImpressionsWrapper} from "./components/ImpressionsWrapper/ImpressionsWrapper";
import React from "react";
import ReactDOM from "react-dom";
import {SimpleSnippet} from "./templates/SimpleSnippet/SimpleSnippet";

const INCOMING_MESSAGE_NAME = "ASRouter:parent-to-child";
const OUTGOING_MESSAGE_NAME = "ASRouter:child-to-parent";

export const ASRouterUtils = {
  addListener(listener) {
    global.addMessageListener(INCOMING_MESSAGE_NAME, listener);
  },
  removeListener(listener) {
    global.removeMessageListener(INCOMING_MESSAGE_NAME, listener);
  },
  sendMessage(action) {
    global.sendAsyncMessage(OUTGOING_MESSAGE_NAME, action);
  },
  blockById(id) {
    ASRouterUtils.sendMessage({type: "BLOCK_MESSAGE_BY_ID", data: {id}});
  },
  unblockById(id) {
    ASRouterUtils.sendMessage({type: "UNBLOCK_MESSAGE_BY_ID", data: {id}});
  },
  getNextMessage() {
    ASRouterUtils.sendMessage({type: "GET_NEXT_MESSAGE"});
  },
  overrideMessage(id) {
    ASRouterUtils.sendMessage({type: "OVERRIDE_MESSAGE", data: {id}});
  },
  sendTelemetry(ping) {
    const payload = ac.ASRouterUserEvent(ping);
    global.sendAsyncMessage(AS_GENERAL_OUTGOING_MESSAGE_NAME, payload);
  }
};

// Note: nextProps/prevProps refer to props passed to <ImpressionsWrapper />, not <ASRouterUISurface />
function shouldSendImpressionOnUpdate(nextProps, prevProps) {
  return (nextProps.message.id && (!prevProps.message || prevProps.message.id !== nextProps.message.id));
}

export class ASRouterUISurface extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMessageFromParent = this.onMessageFromParent.bind(this);
    this.sendImpression = this.sendImpression.bind(this);
    this.sendUserActionTelemetry = this.sendUserActionTelemetry.bind(this);
    this.state = {message: {}};
  }

  sendUserActionTelemetry(extraProps = {}) {
    const {message} = this.state;
    const eventType =  `${message.provider}_user_event`;

    ASRouterUtils.sendTelemetry(Object.assign({
      message_id: message.id,
      source: this.props.id,
      action: eventType
    }, extraProps));
  }

  sendImpression() {
    this.sendUserActionTelemetry({event: "IMPRESSION"});
  }

  onBlockById(id) {
    return () => ASRouterUtils.blockById(id);
  }

  onMessageFromParent({data: action}) {
    switch (action.type) {
      case "SET_MESSAGE":
        this.setState({message: action.data});
        break;
      case "CLEAR_MESSAGE":
        this.setState({message: {}});
        break;
    }
  }

  componentWillMount() {
    ASRouterUtils.addListener(this.onMessageFromParent);
    ASRouterUtils.sendMessage({type: "CONNECT_UI_REQUEST"});
  }

  componentWillUnmount() {
    ASRouterUtils.removeListener(this.onMessageFromParent);
  }

  render() {
    const {message} = this.state;
    if (!message.id) { return null; }
    return (<ImpressionsWrapper
        message={message}
        sendImpression={this.sendImpression}
        shouldSendImpressionOnUpdate={shouldSendImpressionOnUpdate}
        // This helps with testing
        document={this.props.document}>
        <SimpleSnippet
          {...message}
          UISurface={this.props.id}
          getNextMessage={ASRouterUtils.getNextMessage}
          onBlock={this.onBlockById(message.id)}
          sendUserActionTelemetry={this.sendUserActionTelemetry} />
      </ImpressionsWrapper>
    );
  }
}

ASRouterUISurface.defaultProps = {document: global.document};

export class ASRouterContent {
  constructor() {
    this.initialized = false;
    this.containerElement = null;
  }

  _mount() {
    this.containerElement = global.document.getElementById("snippets-container");
    ReactDOM.render(<ASRouterUISurface id="NEWTAB_FOOTER_BAR" />, this.containerElement);
  }

  _unmount() {
    ReactDOM.unmountComponentAtNode(this.containerElement);
  }

  init() {
    this._mount();
    this.initialized = true;
  }

  uninit() {
    if (this.initialized) {
      this._unmount();
      this.initialized = false;
    }
  }
}
