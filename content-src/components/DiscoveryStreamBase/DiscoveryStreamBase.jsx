import {CardGrid} from "content-src/components/DiscoveryStreamComponents/CardGrid/CardGrid";
import {connect} from "react-redux";
import {Hero} from "content-src/components/DiscoveryStreamComponents/Hero/Hero";
import {HorizontalRule} from "content-src/components/DiscoveryStreamComponents/HorizontalRule/HorizontalRule";
import {ImpressionStats} from "content-src/components/DiscoveryStreamImpressionStats/ImpressionStats";
import {List} from "content-src/components/DiscoveryStreamComponents/List/List";
import React from "react";
import {SectionTitle} from "content-src/components/DiscoveryStreamComponents/SectionTitle/SectionTitle";
import {TopSites} from "content-src/components/DiscoveryStreamComponents/TopSites/TopSites";

// According to the Pocket API endpoint specs, `component.properties.items` is a required property with following values:
//   - Lists 1-5 items
//   - Hero 1-5 items
//   - CardGrid 1-8 items
// To enforce that, we define various maximium items for individual components as an extra check.
// Note that these values are subject to the future changes of the specs.
const MAX_ROWS_HERO = 5;
// const MAX_ROWS_LISTS = 5;
// const MAX_ROWS_CARDGRID = 8;

export class _DiscoveryStreamBase extends React.PureComponent {
  renderComponent(component) {
    switch (component.type) {
      case "TopSites":
        return (<TopSites />);
      case "SectionTitle":
        return (<SectionTitle />);
      case "CardGrid":
        return (<CardGrid
          title={component.header.title}
          feed={component.feed}
          style={component.properties.style}
          items={component.properties.items} />);
      case "Hero":
        const feed = this.props.DiscoveryStream.feeds[component.feed.url];
        const items = Math.min(component.properties.items, MAX_ROWS_HERO);
        const rows = feed ? feed.data.recommendations.slice(0, items) : [];
        return (
          <ImpressionStats rows={rows} dispatch={this.props.dispatch} source={component.type}>
            <Hero
              title={component.header.title}
              feed={component.feed}
              style={component.properties.style}
              items={items} />
          </ImpressionStats>
        );
      case "HorizontalRule":
        return (<HorizontalRule />);
      case "List":
        return (<List
          feed={component.feed}
          header={component.header} />);
      default:
        return (<div>{component.type}</div>);
    }
  }

  render() {
    const {layout} = this.props.DiscoveryStream;
    return (
      <div className="discovery-stream ds-layout">
        {layout.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className={`ds-column ds-column-${row.width}`}>
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
