const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");

class Section extends React.Component {
  render() {
    const {title, rows, infoOption, emptyState} = this.props;
    const initialized = rows && rows.length > 0;
    // <Section> <-- React component
    // <section> <-- HTML5 element
    // Dummy component, finished card component needs to be substituted in here
    return (<section>
        <div className="section-top-bar">
          <h3 className="section-title"><FormattedMessage {...title} /></h3>
          {infoOption && <span className="section-info-option">
            <span className="sr-only"><FormattedMessage id="section_info_option" /></span>
            <img className="info-option-icon" />
            <div className="info-option">
              {infoOption.header &&
                <div className="info-option-header">
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
        {initialized && (<ul className="section-list" style={{padding: 0}}>
          {rows.map(url => url && <img style={{maxHeight: "10em"}} src={url} />)}
        </ul>)}
        {!initialized &&
          <div className="section-empty-state">
            <div className="empty-state">
              <img className="empty-state-icon icon-top-stories" />
              <p className="empty-state-message">
                <FormattedMessage {...emptyState.message} />
              </p>
            </div>
          </div>}
      </section>);
  }
}

class Sections extends React.Component {
  render() {
    const sections = this.props.Sections;
    return (
      <div className="sections-list">
        {sections.map(section => <Section key={section.id} {...section} />)}
      </div>
    );
  }
}

module.exports = connect(state => ({Sections: state.Sections}))(Sections);
module.exports._unconnected = Sections;
module.exports.Section = Section;
