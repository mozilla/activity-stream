import {actionCreators as ac} from "common/Actions.jsm";
import {OUTGOING_MESSAGE_NAME as AS_GENERAL_OUTGOING_MESSAGE_NAME} from "content-src/lib/init-store";
import {ImpressionsWrapper} from "content-src/components/Sections/ImpressionsWrapper";
import React from "react";
import ReactDOM from "react-dom";
import {SimpleSnippet} from "./templates/SimpleSnippet/SimpleSnippet";

const INCOMING_MESSAGE_NAME = "ASRouter:parent-to-child";
const OUTGOING_MESSAGE_NAME = "ASRouter:child-to-parent";

// Note: Provider is hardcoded right now since we only have one message provider.
// When we have more than one, it will need to come from the message data.
const PROVIDER = "snippets";

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
  sendUserActionTelemetry(data) {
    const eventType =  `${PROVIDER}_user_event`;
    const payload = ac.ASRouterUserEvent(Object.assign({}, data, {action: eventType}));
    global.sendAsyncMessage(AS_GENERAL_OUTGOING_MESSAGE_NAME, payload);
  },
  sendImpressionStats({id, campaign, template}) {
    const eventType =  `${PROVIDER}_impression`;
    const payload = ac.ASRouterUserEvent(Object.assign({}, {id, campaign, template}, {action: eventType}));
    global.sendAsyncMessage(AS_GENERAL_OUTGOING_MESSAGE_NAME, payload);
  },
  getNextMessage() {
    ASRouterUtils.sendMessage({type: "GET_NEXT_MESSAGE"});
  },
  overrideMessage(id) {
    ASRouterUtils.sendMessage({type: "OVERRIDE_MESSAGE", data: {id}});
  }
};

export class ASRouterUISurface extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMessageFromParent = this.onMessageFromParent.bind(this);
    this.state = {message: {}};
    this.dispatchImpressionStats = this.dispatchImpressionStats.bind(this);
    this.shouldSendImpressionsOnUpdate = this.shouldSendImpressionsOnUpdate.bind(this);
  }

  dispatchImpressionStats() {
    ASRouterUtils.sendImpressionStats(this.state.message);
  }

  shouldSendImpressionsOnUpdate(prevProps) {
    const {state} = this;
    if (state.message.id && (!prevProps.message || prevProps.message.id !== state.message.id)) {
      return true;
    }

    return false;
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
    ASRouterUtils.removeMessageListener(this.onMessageFromParent);
  }

  render() {
    const {message} = this.state;
    if (!message.id) { return null; }
    return (<ImpressionsWrapper document={global.document}
        dispatchImpressionStats={this.dispatchImpressionStats}
        message={message}
        sendOnMount={true}
        shouldSendImpressionsOnUpdate={this.shouldSendImpressionsOnUpdate}>
        <SimpleSnippet
          {...message}
          UISurface={this.props.id}
          getNextMessage={ASRouterUtils.getNextMessage}
          onBlock={this.onBlockById(message.id)}
          sendUserActionTelemetry={ASRouterUtils.sendUserActionTelemetry} />
      </ImpressionsWrapper>
    );
  }
}

export function initASRouter() {
  ReactDOM.render(<ASRouterUISurface id="NEWTAB_FOOTER_BAR" />, document.getElementById("snippets-container"));
}
