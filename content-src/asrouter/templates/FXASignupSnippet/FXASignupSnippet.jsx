import React from "react";
import {SubmitFormSnippet} from "../SubmitFormSnippet/SubmitFormSnippet.jsx";

export const FXASignupSnippet = props => {
  const extendedContent = {
    form_action: "https://accounts.firefox.com/",
    ...props.content,
    hidden_inputs: {
      action: "email",
      context: "fx_desktop_v3",
      entrypoint: "snippets",
      service: "sync",
      utm_source: "snippet", // TODO: Add Firefox version
      utm_campaign: props.content.utm_campaign,
      utm_term: props.content.utm_term,
      ...props.content.hidden_inputs,
    },
  };

  return (<SubmitFormSnippet
    {...props}
    content={extendedContent}
    form_method="GET" />);
};
