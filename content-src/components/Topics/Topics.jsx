import {FormattedMessage} from "react-intl";
import React from "react";

export class Topic extends React.PureComponent {
  render() {
    const {url, name} = this.props;
    return (<li><a key={name} href={url}>{name}</a></li>);
  }
}

export class Topics extends React.PureComponent {
  render() {
    const {topics} = this.props;
    return (
      <span className="topics">
        <span><FormattedMessage id="pocket_read_more" /></span>
        <ul>{topics && topics.map(t => <Topic key={t.name} url={t.url} name={t.name} />)}</ul>
      </span>
    );
  }
}

export class TopicsHeader extends React.PureComponent {
  render() {
    const {props} = this;
    const {topics} = props;
    const showLearnMoreMessage = !!props.learnMoreMessage;
    const showLearnMoreText = (props.learnMoreText && props.learnMoreLink);
    const showLearnMore = showLearnMoreMessage || showLearnMoreText;
    return (
      <span className="topics-header">
        <h3>{props.headerText}</h3>
        <ul>
          {topics && topics.map(t => <Topic key={t.name} url={t.url} name={t.name} />)}
          {topics && (
            <li><a href={props.moreRecommendationsLink}>{props.moreRecommendationsText}</a></li>
          )}
        </ul>
        {showLearnMore && (
          <ul>
            {props.learnMoreMessage && (<li>{props.learnMoreMessage}</li>)}
            {props.learnMoreText && props.learnMoreLink && (<li><a href={props.learnMoreLink}>{props.learnMoreText}</a></li>)}
          </ul>
        )}
      </span>
    );
  }
}
