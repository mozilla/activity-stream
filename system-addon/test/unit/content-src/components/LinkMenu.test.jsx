import {ContextMenu} from "content-src/components/ContextMenu/ContextMenu";
import {IntlProvider} from "react-intl";
import {_LinkMenu as LinkMenu} from "content-src/components/LinkMenu/LinkMenu";
import React from "react";
import {shallow} from "enzyme";
import {shallowWithIntl} from "test/unit/utils";

const messages = require("data/locales.json")["en-US"]; // eslint-disable-line import/no-commonjs

describe("<LinkMenu>", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: ""}} options={["CheckPinTopSite", "CheckBookmark", "OpenInNewWindow"]} dispatch={() => {}} />);
  });
  it("should render a ContextMenu element", () => {
    assert.ok(wrapper.find(ContextMenu));
  });
  it("should pass visible, onUpdate, and options to ContextMenu", () => {
    assert.ok(wrapper.find(ContextMenu));
    const contextMenuProps = wrapper.find(ContextMenu).props();
    ["visible", "onUpdate", "options"].forEach(prop => assert.property(contextMenuProps, prop));
  });
  it("should give ContextMenu the correct tabbable options length for a11y", () => {
    const {options} = wrapper.find(ContextMenu).props();
    const [firstItem] = options;
    const lastItem = options[options.length - 1];

    // first item should have {first: true}
    assert.isTrue(firstItem.first);
    assert.ok(!firstItem.last);

    // last item should have {last: true}
    assert.isTrue(lastItem.last);
    assert.ok(!lastItem.first);

    // middle items should have neither
    for (let i = 1; i < options.length - 1; i++) {
      assert.ok(!options[i].first && !options[i].last);
    }
  });
  it("should show the correct options for default sites", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", isDefault: true}} options={["CheckBookmark"]} source={"TOP_SITES"} dispatch={() => {}} />);
    const {options} = wrapper.find(ContextMenu).props();
    let i = 0;
    assert.propertyVal(options[i++], "id", "menu_action_pin");
    assert.propertyVal(options[i++], "id", "edit_topsites_button_text");
    assert.propertyVal(options[i++], "type", "separator");
    assert.propertyVal(options[i++], "id", "menu_action_open_new_window");
    assert.propertyVal(options[i++], "id", "menu_action_open_private_window");
    assert.propertyVal(options[i++], "type", "separator");
    assert.propertyVal(options[i++], "id", "menu_action_dismiss");
    assert.propertyVal(options, "length", i);
    // Double check that delete options are not included for default top sites
    options.filter(o => o.type !== "separator").forEach(o => {
      assert.notInclude(["menu_action_delete"], o.id);
    });
  });
  it("should show Unpin option for a pinned site if CheckPinTopSite in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", isPinned: true}} source={"TOP_SITES"} options={["CheckPinTopSite"]} dispatch={() => {}} />);
    const {options} = wrapper.find(ContextMenu).props();
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_unpin")));
  });
  it("should show Pin option for an unpinned site if CheckPinTopSite in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", isPinned: false}} source={"TOP_SITES"} options={["CheckPinTopSite"]} dispatch={() => {}} />);
    const {options} = wrapper.find(ContextMenu).props();
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_pin")));
  });
  it("should show Unbookmark option for a bookmarked site if CheckBookmark in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", bookmarkGuid: 1234}} source={"TOP_SITES"} options={["CheckBookmark"]} dispatch={() => {}} />);
    const {options} = wrapper.find(ContextMenu).props();
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_remove_bookmark")));
  });
  it("should show Bookmark option for an unbookmarked site if CheckBookmark in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", bookmarkGuid: 0}} source={"TOP_SITES"} options={["CheckBookmark"]} dispatch={() => {}} />);
    const {options} = wrapper.find(ContextMenu).props();
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_bookmark")));
  });
  it("should show Edit option", () => {
    const props = {url: "foo", label: "label"};
    const index = 5;
    wrapper = shallowWithIntl(<LinkMenu site={props} index={5} source={"TOP_SITES"} options={["EditTopSite"]} dispatch={() => {}} />);
    const {options} = wrapper.find(ContextMenu).props();
    const option = options.find(o => (o.id && o.id === "edit_topsites_button_text"));
    assert.isDefined(option);
    assert.equal(option.action.data.index, index);
  });
  it("should call intl.formatMessage with the correct string ids", () => {
    const FAKE_OPTIONS = ["AddBookmark", "OpenInNewWindow"];
    const intlProvider = new IntlProvider({locale: "en", messages});
    const {intl} = intlProvider.getChildContext();
    const spy = sinon.spy(intl, "formatMessage");

    // Identical to calling shallowWithIntl, but passing in the mocked intl object
    const node = <LinkMenu site={{url: ""}} options={FAKE_OPTIONS} dispatch={() => {}} />;
    shallow(React.cloneElement(node, {intl}), {context: {intl}});

    // Called once for each option in the menu
    assert.ok(spy.callCount === FAKE_OPTIONS.length);

    // Called with correct ids both times
    assert.ok(spy.firstCall.calledWith(sinon.match({id: "menu_action_bookmark"})));
    assert.ok(spy.secondCall.calledWith(sinon.match({id: "menu_action_open_new_window"})));
  });
  describe(".onClick", () => {
    const FAKE_INDEX = 3;
    const FAKE_SOURCE = "TOP_SITES";
    const FAKE_SITE = {url: "https://foo.com", referrer: "https://foo.com/ref", title: "bar", bookmarkGuid: 1234, hostname: "foo", type: "history"};
    const dispatch = sinon.stub();
    const propOptions = ["Separator", "RemoveBookmark", "AddBookmark", "OpenInNewWindow", "OpenInPrivateWindow", "BlockUrl", "DeleteUrl", "PinTopSite", "UnpinTopSite", "SaveToPocket", "WebExtDismiss"];
    const expectedActionData = {
      menu_action_remove_bookmark: FAKE_SITE.bookmarkGuid,
      menu_action_bookmark: {url: FAKE_SITE.url, title: FAKE_SITE.title, type: FAKE_SITE.type},
      menu_action_open_new_window: {url: FAKE_SITE.url, referrer: FAKE_SITE.referrer},
      menu_action_open_private_window: {url: FAKE_SITE.url, referrer: FAKE_SITE.referrer},
      menu_action_dismiss: FAKE_SITE.url,
      menu_action_webext_dismiss: {source: "TOP_SITES", url: FAKE_SITE.url, action_position: 3},
      menu_action_delete: {url: FAKE_SITE.url, forceBlock: FAKE_SITE.bookmarkGuid},
      menu_action_pin: {site: {url: FAKE_SITE.url}, index: FAKE_INDEX},
      menu_action_unpin: {site: {url: FAKE_SITE.url}},
      menu_action_save_to_pocket: {site: {url: FAKE_SITE.url, title: FAKE_SITE.title}}
    };

    const {options} = shallowWithIntl(<LinkMenu site={FAKE_SITE} dispatch={dispatch} index={FAKE_INDEX} options={propOptions} source={FAKE_SOURCE} shouldSendImpressionStats={true} />)
      .find(ContextMenu).props();
    afterEach(() => dispatch.reset());
    options.filter(o => o.type !== "separator").forEach(option => {
      it(`should fire a ${option.action.type} action for ${option.id} with the expected data`, () => {
        option.onClick();

        if (option.impression && option.userEvent) {
          assert.calledThrice(dispatch);
        } else if (option.impression || option.userEvent) {
          assert.calledTwice(dispatch);
        } else {
          assert.calledOnce(dispatch);
        }

        // option.action is dispatched
        assert.ok(dispatch.firstCall.calledWith(option.action));

        // option.action has correct data
        // (delete is a special case as it dispatches a nested DIALOG_OPEN-type action)
        // in the case of this FAKE_SITE, we send a bookmarkGuid therefore we also want
        // to block this if we delete it
        if (option.id === "menu_action_delete") {
          assert.deepEqual(option.action.data.onConfirm[0].data, expectedActionData[option.id]);
          // Test UserEvent send correct meta about item deleted
          assert.propertyVal(option.action.data.onConfirm[1].data, "action_position", FAKE_INDEX);
          assert.propertyVal(option.action.data.onConfirm[1].data, "source", FAKE_SOURCE);
        } else {
          assert.deepEqual(option.action.data, expectedActionData[option.id]);
        }
      });
      it(`should fire a UserEvent action for ${option.id} if configured`, () => {
        if (option.userEvent) {
          option.onClick();
          const [action] = dispatch.secondCall.args;
          assert.isUserEventAction(action);
          assert.propertyVal(action.data, "source", FAKE_SOURCE);
          assert.propertyVal(action.data, "action_position", FAKE_INDEX);
        }
      });
      it(`should send impression stats for ${option.id}`, () => {
        if (option.impression) {
          option.onClick();
          const [action] = dispatch.thirdCall.args;
          assert.deepEqual(action, option.impression);
        }
      });
    });
    it(`should not send impression stats if not configured`, () => {
      const fakeOptions = shallowWithIntl(<LinkMenu site={FAKE_SITE} dispatch={dispatch} index={FAKE_INDEX} options={propOptions} source={FAKE_SOURCE} shouldSendImpressionStats={false} />)
        .find(ContextMenu).props().options;

      fakeOptions.filter(o => o.type !== "separator").forEach(option => {
        if (option.impression) {
          option.onClick();
          assert.calledTwice(dispatch);
          assert.notEqual(dispatch.firstCall.args[0], option.impression);
          assert.notEqual(dispatch.secondCall.args[0], option.impression);
          dispatch.reset();
        }
      });
    });
  });
});
