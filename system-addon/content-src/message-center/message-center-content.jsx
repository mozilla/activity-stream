import {actionCreators as ac} from "common/Actions.jsm";
import {OUTGOING_MESSAGE_NAME as AS_GENERAL_OUTGOING_MESSAGE_NAME} from "content-src/lib/init-store";
import React from "react";
import ReactDOM from "react-dom";
import {SimpleSnippet} from "./templates/SimpleSnippet";

const INCOMING_MESSAGE_NAME = "MessageCenter:parent-to-child";
const OUTGOING_MESSAGE_NAME = "MessageCenter:child-to-parent";

// Note: Provider is hardcoded right now since we only have one message provider.
// When we have more than one, it will need to come from the message data.
const PROVIDER = "snippets";

export const MessageCenterUtils = {
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
    MessageCenterUtils.sendMessage({type: "BLOCK_MESSAGE_BY_ID", data: {id}});
  },
  unblockById(id) {
    MessageCenterUtils.sendMessage({type: "UNBLOCK_MESSAGE_BY_ID", data: {id}});
  },
  sendUserActionTelemetry(data) {
    const eventType =  `${PROVIDER}_user_event`;
    const payload = ac.ASRouterUserEvent(Object.assign({}, data, {action: eventType}));
    global.sendAsyncMessage(AS_GENERAL_OUTGOING_MESSAGE_NAME, payload);
  },
  getNextMessage() {
    MessageCenterUtils.sendMessage({type: "GET_NEXT_MESSAGE"});
  }
};

class MessageCenterUISurface extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMessageFromParent = this.onMessageFromParent.bind(this);
    this.state = {message: {}};
  }

  onBlockById(id) {
    return () => MessageCenterUtils.blockById(id);
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
    MessageCenterUtils.addListener(this.onMessageFromParent);
    MessageCenterUtils.sendMessage({type: "CONNECT_UI_REQUEST"});
  }

  componentWillUnmount() {
    MessageCenterUtils.removeMessageListener(this.onMessageFromParent);
  }

  render() {
    const {message} = this.state;
    if (!message.id) { return null; }

    return (<SimpleSnippet
      {...message}
      UISurface={this.props.id}
      getNextMessage={MessageCenterUtils.getNextMessage}
      onBlock={this.onBlockById(message.id)}
      sendUserActionTelemetry={MessageCenterUtils.sendUserActionTelemetry} />
    );
  }
}

export function initMessageCenter() {
  ReactDOM.render(<MessageCenterUISurface id="NEWTAB_FOOTER_BAR" />, document.getElementById("snippets-container"));
}
