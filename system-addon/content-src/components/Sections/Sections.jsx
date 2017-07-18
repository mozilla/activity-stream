const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");

class Section extends React.Component {
  render() {
    const {title, initialized, rows, infoOption} = this.props;
    // <Section> <-- React component
    // <section> <-- HTML5 element
    // Dummy component, finished card component needs to be substituted in here
    return (<section>
        <div className="section-top-bar">
          <h3 className="section-title"><FormattedMessage {...title} /></h3>
          {infoOption && <span className="section-info-option">
            <span className="sr-only">Info</span>
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
