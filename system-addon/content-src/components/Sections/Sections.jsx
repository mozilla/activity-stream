const React = require("react");
const {connect} = require("react-redux");
const {injectIntl, FormattedMessage} = require("react-intl");
const Card = require("content-src/components/Card/Card");
const Topics = require("content-src/components/Topics/Topics");

class Section extends React.Component {
  constructor(props) {
    super(props);
    this.onInfoEnter = this.onInfoEnter.bind(this);
    this.onInfoLeave = this.onInfoLeave.bind(this);
    this.state = {infoActive: false};
  }

  onInfoEnter() {
    this.setState({infoActive: true});
  }

  onInfoLeave(event) {
    // If we have a related target, check to see if it is within the current
    // target (section-info-option) to keep infoActive true. False otherwise.
    this.setState({
      infoActive: event && event.relatedTarget && (
        event.relatedTarget.compareDocumentPosition(event.currentTarget) &
          Node.DOCUMENT_POSITION_CONTAINS)
    });
  }

  render() {
    const {id, eventSource, title, icon, rows, infoOption, emptyState, dispatch, maxCards, contextMenuOptions, intl} = this.props;
    const initialized = rows && rows.length > 0;
    const shouldShowTopics = (id === "TopStories" && this.props.topics && this.props.read_more_endpoint);

    const infoOptionIconA11yAttrs = {
      "aria-haspopup": "true",
      "aria-controls": "info-option",
      "aria-expanded": this.state.infoActive ? "true" : "false",
      "role": "note",
      "tabIndex": 0
    };

    const sectionInfoTitle = intl.formatMessage({id: "section_info_option"});

    // <Section> <-- React component
    // <section> <-- HTML5 element
    return (<section>
        <div className="section-top-bar">
          <h3 className="section-title"><span className={`icon icon-small-spacer icon-${icon}`} /><FormattedMessage {...title} /></h3>
          {infoOption &&
          <span className="section-info-option"
            onBlur={this.onInfoLeave}
            onFocus={this.onInfoEnter}
            onMouseOut={this.onInfoLeave}
            onMouseOver={this.onInfoEnter}>
            <img className="info-option-icon" title={sectionInfoTitle}
              {...infoOptionIconA11yAttrs} />
            <div className="info-option">
              {infoOption.header &&
                <div className="info-option-header" role="heading">
                  <FormattedMessage {...infoOption.header} />
                </div>}
              {infoOption.body &&
                <p className="info-option-body">
                  <FormattedMessage {...infoOption.body} />
                </p>}
              {infoOption.link &&
                <a href={infoOption.link.href} target="_blank" rel="noopener noreferrer" className="info-option-link">
                  <FormattedMessage {...infoOption.link} />
                </a>}
            </div>
          </span>}
        </div>
        {(<ul className="section-list" style={{padding: 0}}>
          {rows.slice(0, maxCards).map((link, index) => link &&
            <Card index={index} dispatch={dispatch} link={link} contextMenuOptions={contextMenuOptions} eventSource={eventSource} />)}
        </ul>)}
        {!initialized &&
          <div className="section-empty-state">
            <div className="empty-state">
              <img className={`empty-state-icon icon icon-${emptyState.icon}`} />
              <p className="empty-state-message">
                <FormattedMessage {...emptyState.message} />
              </p>
            </div>
          </div>}
        {shouldShowTopics && <Topics topics={this.props.topics} read_more_endpoint={this.props.read_more_endpoint} />}
      </section>);
  }
}

const SectionIntl = injectIntl(Section);

class Sections extends React.Component {
  render() {
    const sections = this.props.Sections;
    return (
      <div className="sections-list">
        {sections.map(section => <SectionIntl key={section.id} {...section} dispatch={this.props.dispatch} />)}
      </div>
    );
  }
}

module.exports = connect(state => ({Sections: state.Sections}))(Sections);
module.exports._unconnected = Sections;
module.exports.SectionIntl = SectionIntl;
module.exports._unconnectedSection = Section;
