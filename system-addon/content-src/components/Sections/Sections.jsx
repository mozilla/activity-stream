const React = require("react");
const {connect} = require("react-redux");

class Section extends React.Component {
  render() {
    const options = this.props.options;
    return (
      <ul className="section-list">
        {options && options.catUrls.map(url => url && <img src={url} />)}
      </ul>
    );
  }
}

class Sections extends React.Component {
  render() {
    const enabledIds = this.props.enabled;
    const enabledSections = this.props.Sections.filter(section => enabledIds.includes(section.id));
    return (
      <ul className="sections-list">
        {enabledSections.map(section => <section>
            <h3 className="section-title">{section.title}</h3>
            <Section options={section.options} />
          </section>)}
      </ul>
    );
  }
}

module.exports = connect(state => ({Sections: state.Sections}))(Sections);
module.exports._unconnected = Sections;
module.exports.Section = Section;
