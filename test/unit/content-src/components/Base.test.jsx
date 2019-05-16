import {_Base as Base, BaseContent} from "content-src/components/Base/Base";
import {ASRouterAdmin} from "content-src/components/ASRouterAdmin/ASRouterAdmin";
import {ASRouterUISurface} from "content-src/asrouter/asrouter-content";
import {DiscoveryStreamBase} from "content-src/components/DiscoveryStreamBase/DiscoveryStreamBase";
import {ErrorBoundary} from "content-src/components/ErrorBoundary/ErrorBoundary";
import React from "react";
import {Search} from "content-src/components/Search/Search";
import {Sections} from "content-src/components/Sections/Sections";
import {shallow} from "enzyme";

describe("<Base>", () => {
  let defaultBaseProps;
  beforeEach(() => {
    defaultBaseProps = {
      store: {getState: () => {}},
      App: {initialized: true},
      Prefs: {values: {}},
      Sections: [],
      DiscoveryStream: {config: {enabled: false}},
      dispatch: () => {},
      isStaticRender: false,
      isPrerendered: false,
    };
  });

  it("should render Base component", () => {
    const wrapper = shallow(<Base {...defaultBaseProps} />);
    assert.ok(wrapper.exists());
  });

  it("should render the BaseContent component, passing through all props", () => {
    const wrapper = shallow(<Base {...defaultBaseProps} />);

    assert.deepEqual(wrapper.find(BaseContent).props(), defaultBaseProps);
  });

  it("should render an ErrorBoundary with class base-content-fallback", () => {
    const wrapper = shallow(<Base {...defaultBaseProps} />);

    assert.equal(
      wrapper.find(ErrorBoundary).first().prop("className"), "base-content-fallback");
  });

  it("should render an ASRouterAdmin if the devtools pref is true", () => {
    const wrapper = shallow(<Base {...defaultBaseProps} Prefs={{values: {"asrouter.devtoolsEnabled": true}}} />);
    assert.lengthOf(wrapper.find(ASRouterAdmin), 1);
  });

  it("should not render an ASRouterAdmin if the devtools pref is false", () => {
    const wrapper = shallow(<Base {...defaultBaseProps} Prefs={{values: {"asrouter.devtoolsEnabled": false}}} />);
    assert.lengthOf(wrapper.find(ASRouterAdmin), 0);
  });

  describe("<BaseContent>", () => {
    it("should render an ErrorBoundary with a Search child", () => {
      const wrapper = shallow(<BaseContent {...defaultBaseProps} Prefs={{values: {showSearch: true}}} />);

      assert.isTrue(wrapper.find(Search).parent().is(ErrorBoundary));
    });
    it("should only render Search (not ASRouterUISurface, DiscoveryStreamBase, or Sections) on a static render", () => {
      const wrapper = shallow(<BaseContent {...defaultBaseProps} Prefs={{values: {showSearch: true}}} isStaticRender={true} />);
      assert.lengthOf(wrapper.find(Search), 1);
      assert.lengthOf(wrapper.find(DiscoveryStreamBase), 0);
      assert.lengthOf(wrapper.find(ASRouterUISurface), 0);
      assert.lengthOf(wrapper.find(Sections), 0);
    });
    it("should render ASRouterUISurface", () => {
      const wrapper = shallow(<BaseContent {...defaultBaseProps} Prefs={{values: {showSearch: true}}} />);
      assert.lengthOf(wrapper.find(Search), 1);
      assert.lengthOf(wrapper.find(ASRouterUISurface), 1);
    });
  });

  it("should render only search if no Sections are enabled", () => {
    const onlySearchProps =
      Object.assign({}, defaultBaseProps, {Sections: [{id: "highlights", enabled: false}], Prefs: {values: {showSearch: true}}});

    const wrapper = shallow(<BaseContent {...onlySearchProps} />);
    assert.lengthOf(wrapper.find(".only-search"), 1);
  });

  it("should render only search if only highlights is available in DS", () => {
    const onlySearchProps =
      Object.assign({}, defaultBaseProps, {Sections: [{id: "highlights", enabled: true}], DiscoveryStream: {config: {enabled: true}}, Prefs: {values: {showSearch: true}}});

    const wrapper = shallow(<BaseContent {...onlySearchProps} />);
    assert.lengthOf(wrapper.find(".only-search"), 1);
  });
});
