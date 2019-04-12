import {DSCard} from "DSCard";
import {IntlProvider} from "react-intl";
import React from "react";
import {storiesOf} from "@storybook/react";

const messages = require("data/locales.json")["en-US"]; // eslint-disable-line import/no-commonjs

const intlProvider = new IntlProvider({locale: "en-US", messages});

storiesOf("DSCard", module)
  .add("basic",
    () => (
      <div className="discovery-stream ds-layout">
      <DSCard
      image_src="https://img-getpocket.cdn.mozilla.net/direct?url=https%3A%2F%2Fmedia.nature.com%2Flw1024%2Fmagazine-assets%2Fd41586-019-00505-2%2Fd41586-019-00505-2_16443400.jpg&resize=w450"
              excerpt="Since it has such a big impact on the quality of our lives, why aren't we managing our mood better?"
              title="How To Manage Your Mood"
              source="dariusforoux.com"
              url="http://localhost"
              id="8"
              campaignId="10"
              pos="1"
              type="foo"
              pocket_id="333"
              intl={intlProvider}
          bookmarkGuid="444" />
        </div>)
);
