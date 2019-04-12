import {CardGrid} from "CardGrid";
import {IntlProvider} from "react-intl";
import React from "react";
import {storiesOf} from "@storybook/react";

const messages = require("data/locales.json")["en-US"]; // eslint-disable-line import/no-commonjs

const intlProvider = new IntlProvider({locale: "en-US", messages});

const DEFAULT_CARD_PROPS = {
  image_src: "https://img-getpocket.cdn.mozilla.net/direct?url=https%3A%2F%2Fmedia.nature.com%2Flw1024%2Fmagazine-assets%2Fd41586-019-00505-2%2Fd41586-019-00505-2_16443400.jpg&resize=w450",
  excerpt: "Since it has such a big impact on the quality of our lives, why aren't we managing our mood better?",
  title: "How To Manage Your Mood",
  source: "dariusforoux.com",
  url: "http://localhost",
  intl: {intlProvider},
  campaignId: "10",
  type: "foo",
  pos: "1",
  pocket_id: "333",
  id: "8",
  bookmarkGuid: "444",
};

const DEFAULT_PROPS = {
  data: {
    recommendations: [DEFAULT_CARD_PROPS, DEFAULT_CARD_PROPS, DEFAULT_CARD_PROPS, DEFAULT_CARD_PROPS],
    items: 4,
    title: "A Test CardGrid",
  },
};

function embedItem(item, colNum) {
  return (
    <div className="discovery-stream ds-layout">
      <div key="row-1" className={`ds-column ds-column-${colNum}`}>
        <div className="ds-column-grid">
          <div key="component-1">
            {item}
          </div>
        </div>
      </div>
    </div>
  );
}

storiesOf("CardGrid", module)
  .add("4 cards, column-5",
    () => embedItem(<CardGrid {...DEFAULT_PROPS} />, 5))
  .add("4 cards, column-8",
    () => embedItem(<CardGrid {...DEFAULT_PROPS} />, 8));
