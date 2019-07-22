/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { actionCreators as ac } from "common/Actions.jsm";
import { CardGrid } from "content-src/components/DiscoveryStreamComponents/CardGrid/CardGrid";
import { CollapsibleSection } from "content-src/components/CollapsibleSection/CollapsibleSection";
import { connect } from "react-redux";
import { DSMessage } from "content-src/components/DiscoveryStreamComponents/DSMessage/DSMessage";
import { Hero } from "content-src/components/DiscoveryStreamComponents/Hero/Hero";
import { Highlights } from "content-src/components/DiscoveryStreamComponents/Highlights/Highlights";
import { HorizontalRule } from "content-src/components/DiscoveryStreamComponents/HorizontalRule/HorizontalRule";
import { List } from "content-src/components/DiscoveryStreamComponents/List/List";
import { Navigation } from "content-src/components/DiscoveryStreamComponents/Navigation/Navigation";
import React from "react";
import { SectionTitle } from "content-src/components/DiscoveryStreamComponents/SectionTitle/SectionTitle";
import { selectLayoutRender } from "content-src/lib/selectLayoutRender";
import { TopSites } from "content-src/components/DiscoveryStreamComponents/TopSites/TopSites";

const ALLOWED_CSS_URL_PREFIXES = [
  "chrome://",
  "resource://",
  "https://img-getpocket.cdn.mozilla.net/",
];
const DUMMY_CSS_SELECTOR = "DUMMY#CSS.SELECTOR";
let rickRollCache = []; // Cache of random probability values for a spoc position

/**
 * Validate a CSS declaration. The values are assumed to be normalized by CSSOM.
 */
export function isAllowedCSS(property, value) {
  // Bug 1454823: INTERNAL properties, e.g., -moz-context-properties, are
  // exposed but their values aren't resulting in getting nothing. Fortunately,
  // we don't care about validating the values of the current set of properties.
  if (value === undefined) {
    return true;
  }

  // Make sure all urls are of the allowed protocols/prefixes
  const urls = value.match(/url\("[^"]+"\)/g);
  return (
    !urls ||
    urls.every(url =>
      ALLOWED_CSS_URL_PREFIXES.some(prefix => url.slice(5).startsWith(prefix))
    )
  );
}

export class _DiscoveryStreamBase extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onStyleMount = this.onStyleMount.bind(this);
  }

  onStyleMount(style) {
    // Unmounting style gets rid of old styles, so nothing else to do
    if (!style) {
      return;
    }

    const { sheet } = style;
    const styles = JSON.parse(style.dataset.styles);
    styles.forEach((row, rowIndex) => {
      row.forEach((component, componentIndex) => {
        // Nothing to do without optional styles overrides
        if (!component) {
          return;
        }

        Object.entries(component).forEach(([selectors, declarations]) => {
          // Start with a dummy rule to validate declarations and selectors
          sheet.insertRule(`${DUMMY_CSS_SELECTOR} {}`);
          const [rule] = sheet.cssRules;

          // Validate declarations and remove any offenders. CSSOM silently
          // discards invalid entries, so here we apply extra restrictions.
          rule.style = declarations;
          [...rule.style].forEach(property => {
            const value = rule.style[property];
            if (!isAllowedCSS(property, value)) {
              console.error(`Bad CSS declaration ${property}: ${value}`); // eslint-disable-line no-console
              rule.style.removeProperty(property);
            }
          });

          // Set the actual desired selectors scoped to the component
          const prefix = `.ds-layout > .ds-column:nth-child(${rowIndex +
            1}) .ds-column-grid > :nth-child(${componentIndex + 1})`;
          // NB: Splitting on "," doesn't work with strings with commas, but
          // we're okay with not supporting those selectors
          rule.selectorText = selectors
            .split(",")
            .map(
              selector =>
                prefix +
                // Assume :pseudo-classes are for component instead of descendant
                (selector[0] === ":" ? "" : " ") +
                selector
            )
            .join(",");

          // CSSOM silently ignores bad selectors, so we'll be noisy instead
          if (rule.selectorText === DUMMY_CSS_SELECTOR) {
            console.error(`Bad CSS selector ${selectors}`); // eslint-disable-line no-console
          }
        });
      });
    });
  }

  renderComponent(component, embedWidth) {
    switch (component.type) {
      case "Highlights":
        return <Highlights />;
      case "TopSites":
        return <TopSites header={component.header} />;
      case "Message":
        return (
          <DSMessage
            title={component.header && component.header.title}
            subtitle={component.header && component.header.subtitle}
            link_text={component.header && component.header.link_text}
            link_url={component.header && component.header.link_url}
            icon={component.header && component.header.icon}
          />
        );
      case "SectionTitle":
        return <SectionTitle header={component.header} />;
      case "Navigation":
        return (
          <Navigation
            links={component.properties.links}
            alignment={component.properties.alignment}
            header={component.header}
          />
        );
      case "CardGrid":
        return (
          <CardGrid
            title={component.header && component.header.title}
            data={component.data}
            feed={component.feed}
            border={component.properties.border}
            type={component.type}
            dispatch={this.props.dispatch}
            items={component.properties.items}
          />
        );
      case "Hero":
        return (
          <Hero
            subComponentType={embedWidth >= 9 ? `cards` : `list`}
            feed={component.feed}
            title={component.header && component.header.title}
            data={component.data}
            border={component.properties.border}
            type={component.type}
            dispatch={this.props.dispatch}
            items={component.properties.items}
          />
        );
      case "HorizontalRule":
        return <HorizontalRule />;
      case "List":
        return (
          <List
            data={component.data}
            feed={component.feed}
            fullWidth={component.properties.full_width}
            hasBorders={component.properties.border === "border"}
            hasImages={component.properties.has_images}
            hasNumbers={component.properties.has_numbers}
            items={component.properties.items}
            type={component.type}
            header={component.header}
          />
        );
      default:
        return <div>{component.type}</div>;
    }
  }

  renderStyles(styles) {
    // Use json string as both the key and styles to render so React knows when
    // to unmount and mount a new instance for new styles.
    const json = JSON.stringify(styles);
    return <style key={json} data-styles={json} ref={this.onStyleMount} />;
  }

  componentWillReceiveProps(oldProps) {
    if (this.props.DiscoveryStream.layout !== oldProps.DiscoveryStream.layout) {
      rickRollCache = [];
    }
  }

  render() {
    // Select layout render data by adding spocs and position to recommendations
    const { layoutRender, spocsFill } = selectLayoutRender(
      this.props.DiscoveryStream,
      this.props.Prefs.values,
      rickRollCache
    );
    const { spocs, feeds } = this.props.DiscoveryStream;

    // Send SPOCS Fill if any. Note that it should not send it again if the same
    // page gets re-rendered by state changes.
    if (
      spocs.loaded &&
      feeds.loaded &&
      spocsFill.length &&
      !this._spocsFillSent
    ) {
      this.props.dispatch(
        ac.DiscoveryStreamSpocsFill({ spoc_fills: spocsFill })
      );
      this._spocsFillSent = true;
    }

    return this.renderLayout(layoutRender);
  }

  renderLayout(layoutRender) {

    const { TopSites, DiscoveryStream } = this.props;
    const { collapsible } = DiscoveryStream.config;
    const styles = [];

    // Find the first component of a type and remove it from layout
    const extractComponent = (type, components) => {
      for (const [index, component] of Object.entries(components)) {
        if (component.type === type) {
          components.splice(index, 1);
          return component;
        }
      }
      return null;
    };

    const renderComponents = (row, rowIndex) => {
      return row.components.map((component, componentIndex) => {
        if (!component) {
          return null;
        }
        styles[rowIndex] = [
          ...(styles[rowIndex] || []),
          component.styles,
        ];
        return (
          <div key={`component-${componentIndex}`}>
            {this.renderComponent(component, row.width)}
          </div>
        );
      });
    };

    return (
      <div className="discovery-stream ds-layout">
        {layoutRender.map((row, rowIndex) => {
          if (collapsible) {
            // Weird collapse transition
            // Ensure disable works.
            // Fix context menus
            // Ensure backwards comp
            const message = extractComponent("Message", row.components);
            const firstComponent = row.components[0];
            let id = "topstories";
            if (firstComponent && firstComponent.type && ['TopSites', 'Highlights'].indexOf(firstComponent.type) >= 0) {
              id = firstComponent.type.toLocaleLowerCase();
            }
            let section = this.props.Sections.find(s => s.id === id);
            // TopSites is a special case
            if (id === "topsites") {
              section = TopSites;
            }
            console.log(section, id, this.props.Sections, TopSites);
            return (
              <CollapsibleSection
                key={`row-${rowIndex}`}
                className={`ds-column ds-layout ds-column-${row.width}`}
                collapsed={section.pref.collapsed}
                dispatch={this.props.dispatch}
                icon={message.header.icon}
                id={id}
                isFixed={true}
                learnMore={{
                  link: {
                    href: message.header.link_url,
                    message: message.header.link_text,
                  },
                }}
                privacyNoticeURL={section.privacyNoticeURL}
                showPrefName={section.pref.feed}
                title={message.header.title}
              >
                <div className="ds-column-grid">
                  {renderComponents(row, rowIndex)}
                </div>
              </CollapsibleSection>
            );
          }
          return (
            <div
              key={`row-${rowIndex}`}
              className={`ds-column ds-column-${row.width}`}
            >
              <div className="ds-column-grid">
                {renderComponents(row, rowIndex)}
              </div>
            </div>
          );
        })}
        {this.renderStyles(styles)}
      </div>
    );
  }
}

export const DiscoveryStreamBase = connect(state => ({
  DiscoveryStream: state.DiscoveryStream,
  Prefs: state.Prefs,
  Sections: state.Sections,
  TopSites: state.TopSites,
}))(_DiscoveryStreamBase);
