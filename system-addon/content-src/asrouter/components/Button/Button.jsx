import React from "react";
import {safeURI} from "../../template-utils";

export const Button = props => (<a href={safeURI(props.url)}
  onClick={props.onClick}
  className="ASRouterButton">
  {props.children}
</a>);
