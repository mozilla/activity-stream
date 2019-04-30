import {combineReducers, createStore} from "redux";
import {actionTypes as at} from "common/Actions.jsm";
import {GlobalOverrider} from "test/unit/utils";
import {reducers} from "common/Reducers.jsm";
import {selectLayoutRender} from "content-src/lib/selectLayoutRender";

const FAKE_LAYOUT = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}}]}];
const FAKE_FEEDS = {"foo.com": {data: {recommendations: ["foo", "bar"]}}};

describe("selectLayoutRender", () => {
  let store;
  let globals;

  beforeEach(() => {
    globals = new GlobalOverrider();
    store = createStore(combineReducers(reducers));
  });

  afterEach(() => {
    globals.restore();
  });

  it("should return an empty array given initial state", () => {
    const {layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);
    assert.deepEqual(layoutRender, []);
  });

  it("should return an empty SPOCS fill array given initial state", () => {
    const {spocsFill} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);
    assert.deepEqual(spocsFill, []);
  });

  it("should add .data property from feeds to each compontent in .layout", () => {
    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: FAKE_LAYOUT}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});

    const {layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);

    assert.lengthOf(layoutRender, 1);
    assert.propertyVal(layoutRender[0], "width", 3);
    assert.deepEqual(layoutRender[0].components[0], {type: "foo", feed: {url: "foo.com"}, data: {recommendations: ["foo", "bar"]}});
  });

  it("should return layout property without data if feed isn't available", () => {
    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: FAKE_LAYOUT}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: {}});

    const {layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);

    assert.lengthOf(layoutRender, 1);
    assert.propertyVal(layoutRender[0], "width", 3);
    assert.deepEqual(layoutRender[0].components[0], FAKE_LAYOUT[0].components[0]);
  });

  it("should return feed data offset by layout set prop", () => {
    const fakeLayout = [{width: 3, components: [{type: "foo", properties: {offset: 1}, feed: {url: "foo.com"}}]}];
    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});

    const {layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);

    assert.deepEqual(layoutRender[0].components[0].data, {recommendations: ["bar"]});
  });

  it("should return spoc result and spocs fill for rolls below the probability", () => {
    const fakeSpocConfig = {positions: [{index: 0}, {index: 1}], probability: 0.5};
    const fakeLayout = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}, spocs: fakeSpocConfig}]}];
    const fakeSpocsData = {lastUpdated: 0, spocs: {spocs: ["fooSpoc", "barSpoc"]}};

    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});
    store.dispatch({type: at.DISCOVERY_STREAM_SPOCS_UPDATE, data: fakeSpocsData});
    const randomStub = globals.sandbox.stub(global.Math, "random").returns(0.1);

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);

    assert.calledTwice(randomStub);
    assert.lengthOf(layoutRender, 1);
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[0], "fooSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[1], "barSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[2], "foo");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[3], "bar");

    assert.deepEqual(spocsFill, [
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
    ]);
  });

  it("should return spoc result and spocs fill when there are more positions than spocs", () => {
    const fakeSpocConfig = {positions: [{index: 0}, {index: 1}, {index: 2}], probability: 0.5};
    const fakeLayout = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}, spocs: fakeSpocConfig}]}];
    const fakeSpocsData = {lastUpdated: 0, spocs: {spocs: ["fooSpoc", "barSpoc"]}};

    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});
    store.dispatch({type: at.DISCOVERY_STREAM_SPOCS_UPDATE, data: fakeSpocsData});
    const randomStub = globals.sandbox.stub(global.Math, "random").returns(0.1);

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);

    assert.calledTwice(randomStub);
    assert.lengthOf(layoutRender, 1);
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[0], "fooSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[1], "barSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[2], "foo");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[3], "bar");

    assert.deepEqual(spocsFill, [
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
    ]);
  });

  it("should report non-displayed spocs with reason as probability_selection and out_of_position", () => {
    const fakeSpocConfig = {positions: [{index: 0}, {index: 1}, {index: 2}], probability: 0.5};
    const fakeLayout = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}, spocs: fakeSpocConfig}]}];
    const fakeSpocsData = {lastUpdated: 0, spocs: {spocs: ["fooSpoc", "barSpoc", "lastSpoc"]}};

    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});
    store.dispatch({type: at.DISCOVERY_STREAM_SPOCS_UPDATE, data: fakeSpocsData});
    const randomStub = globals.sandbox.stub(global.Math, "random");

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, [0.7, 0.3, 0.8]);

    assert.notCalled(randomStub);
    assert.lengthOf(layoutRender, 1);
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[0], "foo");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[1], "fooSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[2], "bar");

    assert.deepEqual(spocsFill, [
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
      {id: undefined, reason: "probability_selection", displayed: 0, full_recalc: 0},
      {id: undefined, reason: "out_of_position", displayed: 0, full_recalc: 0},
    ]);
  });

  it("should not return spoc result for rolls above the probability", () => {
    const fakeSpocConfig = {positions: [{index: 0}, {index: 1}], probability: 0.5};
    const fakeLayout = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}, spocs: fakeSpocConfig}]}];
    const fakeSpocsData = {lastUpdated: 0, spocs: {spocs: ["fooSpoc", "barSpoc"]}};

    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});
    store.dispatch({type: at.DISCOVERY_STREAM_SPOCS_UPDATE, data: fakeSpocsData});
    const randomStub = globals.sandbox.stub(global.Math, "random").returns(0.6);

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);

    assert.calledTwice(randomStub);
    assert.lengthOf(layoutRender, 1);
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[0], "foo");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[1], "bar");

    assert.deepEqual(spocsFill, [
      {id: undefined, reason: "probability_selection", displayed: 0, full_recalc: 0},
      {id: undefined, reason: "out_of_position", displayed: 0, full_recalc: 0},
    ]);
  });

  it("Subsequent render should return spoc result for cached rolls below the probability", () => {
    const fakeSpocConfig = {positions: [{index: 0}, {index: 1}], probability: 0.5};
    const fakeLayout = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}, spocs: fakeSpocConfig}]}];
    const fakeSpocsData = {lastUpdated: 0, spocs: {spocs: ["fooSpoc", "barSpoc"]}};

    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});
    store.dispatch({type: at.DISCOVERY_STREAM_SPOCS_UPDATE, data: fakeSpocsData});
    const randomStub = globals.sandbox.stub(global.Math, "random");

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, [0.4, 0.3]);

    assert.notCalled(randomStub);
    assert.lengthOf(layoutRender, 1);
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[0], "fooSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[1], "barSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[2], "foo");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[3], "bar");

    assert.deepEqual(spocsFill, [
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
    ]);
  });

  it("Subsequent render should not return spoc result for cached rolls above the probability", () => {
    const fakeSpocConfig = {positions: [{index: 0}, {index: 1}], probability: 0.5};
    const fakeLayout = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}, spocs: fakeSpocConfig}]}];
    const fakeSpocsData = {lastUpdated: 0, spocs: {spocs: ["fooSpoc", "barSpoc"]}};

    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});
    store.dispatch({type: at.DISCOVERY_STREAM_SPOCS_UPDATE, data: fakeSpocsData});
    const randomStub = globals.sandbox.stub(global.Math, "random");

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, [0.6, 0.7]);

    assert.notCalled(randomStub);
    assert.lengthOf(layoutRender, 1);
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[0], "foo");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[1], "bar");

    assert.deepEqual(spocsFill, [
      {id: undefined, reason: "probability_selection", displayed: 0, full_recalc: 0},
      {id: undefined, reason: "out_of_position", displayed: 0, full_recalc: 0},
    ]);
  });

  it("Subsequent render should return spoc result by cached rolls probability", () => {
    const fakeSpocConfig = {positions: [{index: 0}, {index: 1}], probability: 0.5};
    const fakeLayout = [{width: 3, components: [{type: "foo", feed: {url: "foo.com"}, spocs: fakeSpocConfig}]}];
    const fakeSpocsData = {lastUpdated: 0, spocs: {spocs: ["fooSpoc", "barSpoc"]}};

    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: FAKE_FEEDS});
    store.dispatch({type: at.DISCOVERY_STREAM_SPOCS_UPDATE, data: fakeSpocsData});
    const randomStub = globals.sandbox.stub(global.Math, "random");

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, [0.7, 0.2]);

    assert.notCalled(randomStub);
    assert.lengthOf(layoutRender, 1);
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[0], "foo");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[1], "fooSpoc");
    assert.deepEqual(layoutRender[0].components[0].data.recommendations[2], "bar");

    assert.deepEqual(spocsFill, [
      {id: undefined, reason: "n/a", displayed: 1, full_recalc: 0},
      {id: undefined, reason: "out_of_position", displayed: 0, full_recalc: 0},
    ]);
  });

  it("should return a layout with feeds of items length with positions", () => {
    const fakeLayout = [{width: 3, components: [{type: "foo", properties: {items: 3}, feed: {url: "foo.com"}}]}];
    const fakeRecommendations = [
      {name: "item1"},
      {name: "item2"},
      {name: "item3"},
      {name: "item4"},
    ];
    const fakeFeeds = {"foo.com": {data: {recommendations: fakeRecommendations}}};
    store.dispatch({type: at.DISCOVERY_STREAM_LAYOUT_UPDATE, data: {layout: fakeLayout}});
    store.dispatch({type: at.DISCOVERY_STREAM_FEEDS_UPDATE, data: fakeFeeds});

    const {spocsFill, layoutRender} = selectLayoutRender(store.getState().DiscoveryStream, {}, []);

    const {recommendations} = layoutRender[0].components[0].data;
    assert.equal(recommendations.length, 4);
    assert.equal(recommendations[0].pos, 0);
    assert.equal(recommendations[1].pos, 1);
    assert.equal(recommendations[2].pos, 2);
    assert.equal(recommendations[3].pos, undefined);

    assert.lengthOf(spocsFill, 0);
  });
});
