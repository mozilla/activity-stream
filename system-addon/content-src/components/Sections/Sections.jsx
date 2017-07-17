const React = require("react");
const {connect} = require("react-redux");

class Section extends React.Component {
  render() {
    const {title, initialized, rows} = this.props;
    // <Section> <-- React component
    // <section> <-- HTML5 element
    // Dummy component, finished card component needs to be substituted in here
    return (<section>
        <h3 className="section-title">{title}</h3>
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
