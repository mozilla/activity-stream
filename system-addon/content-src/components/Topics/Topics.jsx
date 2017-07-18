const React = require("react");
const {FormattedMessage} = require("react-intl");

class Topic extends React.Component {
  render() {
    const {url, name} = this.props;
    return (<li><a key={name} className="topic-link" href={url}>{name}</a></li>);
  }
}

class Topics extends React.Component {
  render() {
    const {topics, read_more_endpoint} = this.props;
    return (
      <div className="topic">
        <span><FormattedMessage id="pocket_read_more" /></span>
        <ul>{topics.map(t => <Topic key={t.name} url={t.url} name={t.name} />)}</ul>

        <a className="topic-read-more" href={read_more_endpoint}>
          <FormattedMessage id="pocket_read_even_more" />
          <span className="topic-read-more-logo" />
        </a>
      </div>
    );
  }
}

module.exports._unconnected = Topics;
module.exports.Topic = Topic;
