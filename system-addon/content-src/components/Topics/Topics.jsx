const React = require("react");
const {FormattedMessage} = require("react-intl");

class Topic extends React.PureComponent {
  render() {
    const {url, name} = this.props;
    return (<li><a key={name} className="topic-link" href={url}>{name}</a></li>);
  }
}

class Topics extends React.PureComponent {
  render() {
    const {topics, read_more_endpoint} = this.props;
    return (
      <div className="topic">
        <span><FormattedMessage id="pocket_read_more" /></span>
        <ul>{topics && topics.map(t => <Topic key={t.name} url={t.url} name={t.name} />)}</ul>

        {read_more_endpoint && <a className="topic-read-more" href={read_more_endpoint}>
          <FormattedMessage id="pocket_read_even_more" />
        </a>}
      </div>
    );
  }
}

module.exports = Topics;
module.exports._unconnected = Topics;
module.exports.Topic = Topic;
