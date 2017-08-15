const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");
const Card = require("content-src/components/Card/Card");
const Topics = require("content-src/components/Topics/Topics");
const {actionCreators: ac} = require("common/Actions.jsm");

class Section extends React.Component {

  getFormattedMessage(message) {
    return typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />;
  }

  render() {
    const {id, eventSource, title, icon, rows, infoOption, emptyState, dispatch, maxRows, contextMenuOptions} = this.props;
    const maxCards = 3 * maxRows;
    const initialized = rows && rows.length > 0;
    const shouldShowTopics = (id === "TopStories" && this.props.topics && this.props.read_more_endpoint);

    if (dispatch) {
      dispatch(ac.ImpressionStats({
        source: eventSource,
        tiles: rows.slice(0, maxCards).map(link => ({id: link.guid}))
      }));
    }

    // <Section> <-- React component
    // <section> <-- HTML5 element
    return (<section>
        <div className="section-top-bar">
          <h3 className="section-title">
            <span className={`icon icon-small-spacer icon-${icon || "webextension"}`} />
            {this.getFormattedMessage(title)}
          </h3>
          {infoOption && <span className="section-info-option">
            <span className="sr-only">{this.getFormattedMessage({id: "section_info_option"})}</span>
            <img className="info-option-icon" />
            <div className="info-option">
              {infoOption.header &&
                <div className="info-option-header">
                  {this.getFormattedMessage(infoOption.header)}
                </div>}
              {infoOption.body &&
                <p className="info-option-body">
                  {this.getFormattedMessage(infoOption.body)}
                </p>}
              {infoOption.link &&
                <a href={infoOption.link.href} target="_blank" rel="noopener noreferrer" className="info-option-link">
                  {this.getFormattedMessage(infoOption.link.title || infoOption.link)}
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
                {this.getFormattedMessage(emptyState.message)}
              </p>
            </div>
          </div>}
        {shouldShowTopics && <Topics topics={this.props.topics} read_more_endpoint={this.props.read_more_endpoint} />}
      </section>);
  }
}

class Sections extends React.Component {
  render() {
    const sections = this.props.Sections;
    return (
      <div className="sections-list">
        {sections.map(section => <Section key={section.id} {...section} dispatch={this.props.dispatch} />)}
      </div>
    );
  }
}

module.exports = connect(state => ({Sections: state.Sections}))(Sections);
module.exports._unconnected = Sections;
module.exports.Section = Section;
