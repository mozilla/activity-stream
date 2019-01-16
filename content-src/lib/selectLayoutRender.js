import {createSelector} from "reselect";

export const selectLayoutRender = createSelector(
  // Selects layout, feeds, spocs so that we only recompute if
  // any of these values change.
  [
    state => state.DiscoveryStream.layout,
    state => state.DiscoveryStream.feeds,
    state => state.DiscoveryStream.spocs,
  ],

  // Adds data to each component from feeds. This function only re-runs if one of the inputs change.
  // TODO: calculate spocs
  function layoutRender(layout, feeds, spocs) {
    return layout.map(row => ({
      ...row,

      // Loops through all the components and adds a .data property
      // containing data from feeds
      components: row.components.map(component => {
        if (!component.feed || !feeds[component.feed.url]) {
          return component;
        }
        return {...component, data: feeds[component.feed.url].data};
      }),
    }));
  }
);
