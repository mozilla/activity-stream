const React = require("react");
const {connect} = require("react-redux");

class Section extends React.Component {
  render() {
    const {title, initialized, rows} = this.props;
    // <Section> <-- React component
    // <section> <-- HTML5 element
    return (<section>
        <h3 className="section-title">{title}</h3>
        {initialized ? (<ul className="section-list">
          {rows.map(url => url && <img src={url} />)}
        </ul>) : <p>Uninitialized</p>}
      </section>);
  }
}

class Sections extends React.Component {
  render() {
    const sections = this.props.Sections;
    return (
      <ul className="sections-list">
        {sections.map(section => <Section key={section.id} {...section} />)}
      </ul>
    );
  }
}

module.exports = connect(state => ({Sections: state.Sections}))(Sections);
module.exports._unconnected = Sections;
module.exports.Section = Section;
