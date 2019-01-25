import React from "react";

export class SectionTitle extends React.PureComponent {
  render() {
    const {header} = this.props;

    if (!header) {
      return null;
    }

    return (
      <div className="ds-section-title">
        <div className="title">{header.title}</div>
        {header.subtitle ? <div className="subtitle">{header.subtitle}</div> : null}
      </div>
    );
  }
}
