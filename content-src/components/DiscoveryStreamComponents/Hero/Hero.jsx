import {DSCard} from "../DSCard/DSCard.jsx";
import React from "react";

export class Hero extends React.PureComponent {
  render() {
    const {data} = this.props;

    // Handle a render before feed has been fetched by displaying nothing
    if (!data || !data.recommendations) {
      return (
        <div />
      );
    }

    let [heroRec, ...otherRecs] = data.recommendations;
    let truncateText = (text, cap) => `${text.substring(0, cap)}${text.length > cap ? `...` : ``}`;

    let cards = otherRecs.slice(1, this.props.items).map((rec, index) => (
      <DSCard
        key={`dscard-${index}`}
        image_src={rec.image_src}
        title={truncateText(rec.title, 44)}
        url={rec.url}
        source={truncateText(`TODO: SOURCE`, 22)} />
    ));

    return (
      <div>
        <div className="ds-header">{this.props.title}</div>
        <div className={`ds-hero ds-hero-${this.props.style}`}>
          <a href={heroRec.url} className="wrapper">
            <div className="img-wrapper">
              <div className="img" style={{backgroundImage: `url(${heroRec.image_src})`}} />
            </div>
            <div className="meta">
              <header>{truncateText(heroRec.title, 28)}</header>
              <p>{truncateText(heroRec.excerpt, 114)}</p>
              <p>{truncateText(`TODO: SOURCE`, 22)}</p>
            </div>
          </a>
          <div className="cards">
            { cards }
          </div>
        </div>
      </div>
    );
  }
}

Hero.defaultProps = {
  data: {},
  style: `border`,
  items: 1, // Number of stories to display
};
