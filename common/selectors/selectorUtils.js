/**
 * Returns whether or not the selectors have finished initializing.
 *
 * @param  {Object} state  The state object
 * @return {Boolean}
 */
function areSelectorsReady(state) {
  return state.TopSites.init && state.Experiments.init;
}
module.exports = {areSelectorsReady};
