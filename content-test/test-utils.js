const React = require("react");
const {Provider} = require("react-redux");
const fakeSites = require("lib/shim").data;

const mockData = {
  Bookmarks: {rows: fakeSites.fakeBookmarks},
  Sites: {frecent: fakeSites.fakeFrecent}
};

module.exports = {
  mockData,
  createMockProvider(data = mockData) {
    const store = {
      getState: () => data,
      dispatch: () => {},
      subscribe: () => {}
    };
    store.subscribe = () => {};
    return React.createClass({
      render() {
        return (<Provider store={store}>{this.props.children}</Provider>);
      }
    });
  }
};
