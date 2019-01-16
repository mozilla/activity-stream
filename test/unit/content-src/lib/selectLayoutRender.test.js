import {combineReducers, createStore} from "redux";
import {actionTypes as at} from "common/Actions.jsm";
import {reducers} from "common/Reducers.jsm";
import {selectLayoutRender} from "content-src/lib/selectLayoutRender";

const FAKE_LAYOUT = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}}]}];
const FAKE_FEEDS = {"foo.com": {data: ["foo", "bar"]}};

describe("selectLayoutRender", () => {
  let store;

  beforeEach(() => {
    store = createStore(combineReducers(reducers));
  });

  it("should return an empty array given initial state", () => {
    const result = selectLayoutRender(store.getState());
    assert.deepEqual(result, []);
  });

  it("should add .data property from feeds to each compontent in .layout", () => {
    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: FAKE_LAYOUT}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});

    const result = selectLayoutRender(store.getState());

    assert.lengthOf(result, 1);
    assert.propertyVal(result[0], "width", 3);
    assert.deepEqual(result[0].components[0], {type: "foo", feed: {url: "foo.com"}, data: ["foo", "bar"]});
  });

  it("should return layout property without data if feed isn't available", () => {
    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: FAKE_LAYOUT}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: {}});

    const result = selectLayoutRender(store.getState());

    assert.lengthOf(result, 1);
    assert.propertyVal(result[0], "width", 3);
    assert.deepEqual(result[0].components[0], FAKE_LAYOUT[0].components[0]);
  });
});
