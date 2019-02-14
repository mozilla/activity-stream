import React from "react";
import {SafeAnchor} from "../SafeAnchor/SafeAnchor";

export class Topic extends React.PureComponent {
  render() {
    const {url, name} = this.props;
    return (<li><SafeAnchor key={name} url={url}>{name}</SafeAnchor></li>);
  }
}

export class Navigation extends React.PureComponent {
  render() {
    const {links} = this.props || [];
    const {alignment} = this.props || "centered";
    const header = this.props.header || {};
    return (
      <div className={`ds-navigation ds-navigation-${alignment}`}>
        {header.title ? <div className="ds-header">{header.title}</div> : null}
        <div>
          <ul>
            {links && links.map(t => <Topic key={t.name} url={t.url} name={t.name} />)}
          </ul>
        </div>
      </div>
    );
  }
}
