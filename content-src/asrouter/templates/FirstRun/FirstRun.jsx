/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";
import { Interrupt } from "./Interrupt";
import { Triplets } from "./Triplets";
import { actionCreators as ac, actionTypes as at } from "common/Actions.jsm";
import { addUtmParams } from "./addUtmParams";

export const FLUENT_FILES = [
  "branding/brand.ftl",
  "browser/branding/brandings.ftl",
  "browser/branding/sync-brand.ftl",
  "browser/newtab/onboarding.ftl",
];

export const helpers = {
  selectInterruptAndTriplets(message = {}) {
    const hasInterrupt = Boolean(message.content);
    const hasTriplets = Boolean(message.bundle && message.bundle.length);
    const UTMTerm = message.utm_term || "";
    return {
      hasTriplets,
      hasInterrupt,
      interrupt: hasInterrupt ? message : null,
      triplets: hasTriplets ? message.bundle : null,
      UTMTerm,
    };
  },

  addFluent(document) {
    FLUENT_FILES.forEach(file => {
      const link = document.head.appendChild(document.createElement("link"));
      link.href = file;
      link.rel = "localization";
    });
  },

  async fetchFlowParams({ fxaEndpoint, UTMTerm, dispatch, setFlowParams }) {
    try {
      const url = new URL(
        `${fxaEndpoint}/metrics-flow?entrypoint=activity-stream-firstrun&form_type=email`
      );
      addUtmParams(url, UTMTerm);
      const response = await fetch(url, { credentials: "omit" });
      if (response.status === 200) {
        const { deviceId, flowId, flowBeginTime } = await response.json();
        setFlowParams({ deviceId, flowId, flowBeginTime });
      } else {
        dispatch(
          ac.OnlyToMain({
            type: at.TELEMETRY_UNDESIRED_EVENT,
            data: {
              event: "FXA_METRICS_FETCH_ERROR",
              value: response.status,
            },
          })
        );
      }
    } catch (error) {
      dispatch(
        ac.OnlyToMain({
          type: at.TELEMETRY_UNDESIRED_EVENT,
          data: { event: "FXA_METRICS_ERROR" },
        })
      );
    }
  },
};

const { useEffect, useState } = React;
export const FirstRun = props => {
  const {
    message,
    sendUserActionTelemetry,
    fxaEndpoint,
    dispatch,
    executeAction,
    document,
  } = props;

  const {
    hasTriplets,
    hasInterrupt,
    interrupt,
    triplets,
    UTMTerm,
  } = helpers.selectInterruptAndTriplets(message);

  const [addedFluent, setAddedFluent] = useState(false);
  useEffect(() => {
    helpers.addFluent(document);
    // We need to remove hide-main since we should show it underneath everything that has rendered
    props.document.body.classList.remove("hide-main");
    setAddedFluent(true);
  }, []);

  const [state, setState] = useState({
    isInterruptVisible: false,
    isTripletsContainerVisible: false,
    isTripletsContentVisible: false,
  });

  useEffect(() => {
    setState({
      isInterruptVisible: hasInterrupt,
      isTripletsContainerVisible: hasTriplets,
      isTripletsContentVisible: false,
    });
    if (!hasInterrupt) {
      props.document.body.classList.remove("welcome");
    }
  }, [interrupt, triplets, hasInterrupt, hasTriplets]);

  const [flowParams, setFlowParams] = useState();
  useEffect(() => {
    if (fxaEndpoint && UTMTerm) {
      helpers.fetchFlowParams({
        fxaEndpoint,
        UTMTerm,
        dispatch,
        setFlowParams,
      });
    }
  }, [fxaEndpoint, UTMTerm, dispatch]);

  const {
    isInterruptVisible,
    isTripletsContainerVisible,
    isTripletsContentVisible,
  } = state;

  const closeInterrupt = () => {
    setState(prevState => ({
      isInterruptVisible: false,
      isTripletsContainerVisible: prevState.hasTriplets,
      isTripletsContentVisible: prevState.hasTriplets,
    }));
  };

  const closeTriplets = () => setState({ isTripletsContainerVisible: false });

  const dismissAndGoNext = () => {
    // onDismiss();
    closeInterrupt();
  };

  // Don't render before we add strings;
  if (!addedFluent) return null;

  return (
    <>
      {isInterruptVisible ? (
        <Interrupt
          document={props.document}
          message={interrupt}
          onNextScene={closeInterrupt}
          UTMTerm={UTMTerm}
          sendUserActionTelemetry={sendUserActionTelemetry}
          dispatch={dispatch}
          flowParams={flowParams}
          onDismiss={dismissAndGoNext}
          fxaEndpoint={fxaEndpoint}
        />
      ) : null}
      {hasTriplets ? (
        <Triplets
          document={props.document}
          cards={triplets}
          showCardPanel={isTripletsContainerVisible}
          showContent={isTripletsContentVisible}
          hideContainer={closeTriplets}
          sendUserActionTelemetry={sendUserActionTelemetry}
          UTMTerm={`${UTMTerm}-card`}
          flowParams={flowParams}
          onAction={executeAction}
        />
      ) : null}
    </>
  );
};
