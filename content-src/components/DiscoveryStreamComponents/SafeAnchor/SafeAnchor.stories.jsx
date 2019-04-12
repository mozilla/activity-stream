import React from "react";
import {SafeAnchor} from "SafeAnchor";
import {storiesOf} from "@storybook/react";

storiesOf("SafeAnchor", module)
  .add("basic",
    () => <SafeAnchor url="http://localhost" className="monkey">monkey</SafeAnchor>
  );
