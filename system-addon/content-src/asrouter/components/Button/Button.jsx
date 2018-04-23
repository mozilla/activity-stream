import React from "react";

export const Button = props => (<a href={props.url}
  onClick={props.onClick}
  className="ASRouterButton">
  {props.children}
</a>);
