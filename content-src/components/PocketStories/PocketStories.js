const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {FormattedMessage} = require("react-intl");
const CollapsibleSection = require("components/CollapsibleSection/CollapsibleSection");
const {SpotlightItem, renderPlaceholderList} = require("components/Spotlight/Spotlight");
const {actions} = require("common/action-manager");
const {pocket_read_more_endpoint, pocket_learn_more_endpoint, pocket_survey_link} = require("../../../pocket.json");
const {POCKET_TOPICS_LENGTH} = require("common/constants");

const PocketStories = React.createClass({
  getDefaultProps() { return {prefs: {}}; },
  onClickFactory(index, story) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "RECOMMENDED",
        action_position: index
      };
      this.props.dispatch(actions.NotifyEvent(payload));

      this.props.dispatch(actions.NotifyImpressionStats({
        source: "pocket",
        click: 0,
        tiles: [{id: story.guid, pos: index}]
      }));
    };
  },

  onTopicClick(index, topic, topic_url) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "RECOMMENDED",
        action_position: index,
        recommender_type: topic,
        url: topic_url
      };
      this.props.dispatch(actions.NotifyEvent(payload));
    };
  },

  renderStories() {
    const stories = this.props.stories.slice(0, this.props.length);

    this.props.dispatch(actions.NotifyImpressionStats({
      source: "pocket",
      tiles: stories.map(story => ({id: story.guid}))
    }));

    return stories.map((story, i) =>
        <SpotlightItem
          index={i}
          key={story.url || i}
          page={this.props.page}
          source="RECOMMENDED"
          onClick={this.onClickFactory(i, story)}
          dispatch={this.props.dispatch}
          {...story}
          prefs={this.props.prefs} />
      );
  },

  renderReadMoreTopic(index, topic, url) {
    return (<li><a key={topic}
      onClick={this.onTopicClick(index, topic, url)}
      className="pocket-read-more-link"
      href={url}>{topic}</a></li>);
  },

  renderReadMoreTopics() {
    return (
      <div className="pocket-read-more">
        <span><FormattedMessage id="pocket_read_more" /></span>
        <ul>{this.props.topics.map((t, i) => this.renderReadMoreTopic(i, t.name, t.url))}</ul>

        <a className="pocket-read-even-more"
           onClick={this.onTopicClick(POCKET_TOPICS_LENGTH, "trending", pocket_read_more_endpoint)}
           href={pocket_read_more_endpoint}>
          <FormattedMessage id="pocket_read_even_more" />
          <span className="pocket-read-even-more-logo" />
        </a>
      </div>
    );
  },

  render() {
    if (this.props.stories.length < 1) {
      console.log("No Pocket stories available."); // eslint-disable-line no-console
      return null;
    }

    return (
      <CollapsibleSection className="pocket-stories spotlight" titleId="header_stories" prefName="collapsePocket" prefs={this.props.prefs}>
        <div className="pocket-links">
          <span className="section-title-logo" >
            <a href={pocket_learn_more_endpoint}>
              <span className="pocket-logo-text">
                <FormattedMessage id="header_stories_from" />
              </span>
              <span className="pocket-logo">
                <span className="sr-only">Pocket</span>
              </span>
            </a>
            <span className="pocket-info">
              <span className="sr-only">Info</span>
              <div className="pocket-feedback-wrapper">
                <div className="pocket-feedback">
                  <div className="pocket-feedback-header"><FormattedMessage id="pocket_feedback_header" /></div>
                  <p><FormattedMessage id="pocket_feedback_body" /></p>
                  <a href={pocket_survey_link} target="_blank" rel="noopener noreferrer" className="pocket-send-feedback">
                    <FormattedMessage id="pocket_send_feedback" />
                  </a>
                </div>
              </div>
            </span>
          </span>
        </div>
        <ul className="spotlight-list">
          {this.props.placeholder ? renderPlaceholderList() : this.renderStories()}
        </ul>
        {this.renderReadMoreTopics()}
      </CollapsibleSection>
    );
  }
});

PocketStories.propTypes = {
  page: React.PropTypes.string.isRequired,
  stories: React.PropTypes.array.isRequired,
  topics: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  prefs: React.PropTypes.object
};

module.exports = connect(justDispatch)(PocketStories);
module.exports.PocketStories = PocketStories;
