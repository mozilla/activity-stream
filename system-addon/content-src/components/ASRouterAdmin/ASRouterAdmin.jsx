import {ASRouterUtils} from "../../asrouter/asrouter-content";
import React from "react";

export class ASRouterAdmin extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMessage = this.onMessage.bind(this);
    this.state = {};
  }

  onMessage({data: action}) {
    if (action.type === "ADMIN_SET_STATE") {
      this.setState(action.data);
    }
  }

  componentWillMount() {
    ASRouterUtils.sendMessage({type: "ADMIN_CONNECT_STATE"});
    ASRouterUtils.addListener(this.onMessage);
  }

  componentWillUnmount() {
    ASRouterUtils.removeListener(this.onMessage);
  }

  handleBlock(id) {
    return () => ASRouterUtils.blockById(id);
  }

  handleUnblock(id) {
    return () => ASRouterUtils.unblockById(id);
  }

  renderMessageItem(msg) {
    const isCurrent = msg.id === this.state.currentId;
    const isBlocked = this.state.blockList[msg.id];

    let itemClassName = "message-item";
    if (isCurrent) { itemClassName += " current"; }
    if (isBlocked) { itemClassName += " blocked"; }

    return (<tr className={itemClassName} key={msg.id}>
      <td className="message-id"><span>{msg.id}</span></td>
      <td>
        <button className={`button ${(isBlocked ? "" : " primary")}`} onClick={isBlocked ? this.handleUnblock(msg.id) : this.handleBlock(msg.id)}>{isBlocked ? "Unblock" : "Block"}</button>
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
    return (<table><tbody>
      {this.state.messages.map(msg => this.renderMessageItem(msg))}
    </tbody></table>);
  }

  render() {
    return (<div className="asrouter-admin outer-wrapper">
      <h1>AS Router Admin</h1>
      <button className="button primary" onClick={ASRouterUtils.getNextMessage}>Refresh Current Message</button>
      <h2>Messages</h2>
      {this.renderMessages()}
    </div>);
  }
}
