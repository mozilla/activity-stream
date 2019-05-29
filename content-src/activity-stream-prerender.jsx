import React from "react";
import ReactDOMServer from "react-dom/server";

export function prerender(locale, strings,
                          renderToString = ReactDOMServer.renderToString) {
  const html = renderToString(<div />);

  // If this happens, it means pre-rendering is effectively disabled, so we
  // need to sound the alarms:
  if (!html || !html.length) {
    throw new Error("no HTML returned");
  }

  return {
    html,
    state: {},
    store: {getState() {}},
  };
}
