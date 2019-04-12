import {addDecorator, configure, storiesOf} from "@storybook/react";
import {Button, Welcome} from "@storybook/react/demo";

import {action} from "@storybook/addon-actions";
import {IntlProvider} from "react-intl";
import {linkTo} from "@storybook/addon-links";
import React from "react";

const req = require.context("../content-src/components/", true, /\.stories\.jsx$/);

const messages = require("data/locales.json")["en-US"]; // eslint-disable-line import/no-commonjs

import "css/asm.css";

function loadStories() {
  req.keys().forEach(filename => req(filename));

  addDecorator(story => (
    <IntlProvider locale="en-US" key="en-US" messages={messages}>
      {story()}
    </IntlProvider>
  ));
}

configure(loadStories, module);

// storiesOf("Welcome", module).add("to Storybook", () => <Welcome showApp={linkTo("Button")} />);

// storiesOf("Button", module)
//   .add("with text", () => <Button onClick={action("clicked")}>Hello Button</Button>)
//   .add("with some emoji", () => (
//     <Button onClick={action("clicked")}>
//       <span role="img" aria-label="so cool">
//         😀 😎 👍 💯
//       </span>
//     </Button>
//   ));
