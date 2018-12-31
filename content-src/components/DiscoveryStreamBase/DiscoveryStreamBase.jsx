import {CardGrid} from "content-src/components/DiscoveryStreamComponents/CardGrid/CardGrid";
import {connect} from "react-redux";
import {Hero} from "content-src/components/DiscoveryStreamComponents/Hero/Hero";
import {HorizontalRule} from "content-src/components/DiscoveryStreamComponents/HorizontalRule/HorizontalRule";
import {List} from "content-src/components/DiscoveryStreamComponents/List/List";
import React from "react";
import {SectionTitle} from "content-src/components/DiscoveryStreamComponents/SectionTitle/SectionTitle";
import {TopSites} from "content-src/components/DiscoveryStreamComponents/TopSites/TopSites";

export class _DiscoveryStreamBase extends React.PureComponent {
  renderComponent(component) {
    switch (component.type) {
      case "TopSites":
        return (<TopSites {...component.properties} />);
      case "SectionTitle":
        return (<SectionTitle {...component.properties} />);
      case "CardGrid":
        return (<CardGrid {...component.properties} />);
      case "Hero":
        return (<Hero {...component.properties} />);
      case "HorizontalRule":
        return (<HorizontalRule {...component.properties} />);
      case "List":
        return (<List {...component.properties} />);
      default:
        return (<div>{component.type}</div>);
    }
  }

  render() {
    const {layout} = this.props.DiscoveryStream;
    return (
      <div className="discovery-stream layout">
        {layout.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className={`column column-${row.width}`}>
            {row.components.map((component, componentIndex) => (
              <div key={`component-${componentIndex}`}>
                {this.renderComponent(component)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}

export const DiscoveryStreamBase = connect(state => ({DiscoveryStream: state.DiscoveryStream}))(_DiscoveryStreamBase);
