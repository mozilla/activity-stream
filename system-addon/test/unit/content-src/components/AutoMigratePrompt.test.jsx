const React = require("react");
const {_unconnected: AutoMigratePrompt} = require("content-src/components/AutoMigratePrompt/AutoMigratePrompt");
const {mountWithIntl} = require("test/unit/utils");

const DEFAULT_PROPS = {
  AutoMigrate: {
    display: false,
    stage: 0,
    msg: ""
  },
  onImportClick() {},
  onUndoClick() {}
};

describe("<AutoMigratePrompt>", () => {
  it("should render an null AutoMigratePrompt element", () => {
    const wrapper = mountWithIntl(<AutoMigratePrompt {...DEFAULT_PROPS} />);

    assert.ok(wrapper.exists());
    assert.equal(wrapper.html(), null);
  });

  it("Should show the message and the confirm dialog", () => {
    const PROPS = {
      AutoMigrate: {
        display: true,
        stage: 0,
        msg: ""
      },
      onImportClick() {},
      onUndoClick() {}
    };
    const wrapper = mountWithIntl(<AutoMigratePrompt {...PROPS} />);

    assert.ok(wrapper.find(".migate-prompt"));
    assert.ok(wrapper.find(".confirm"));
  });

  it("Should show the manual import message", () => {
    const PROPS = {
      AutoMigrate: {
        display: true,
        stage: 1,
        msg: ""
      },
      onImportClick() {},
      onUndoClick() {}
    };
    const wrapper = mountWithIntl(<AutoMigratePrompt {...PROPS} />);

    assert.ok(wrapper.find(".migate-prompt"));
    assert.ok(!wrapper.find(".migate-prompt").some(".confirm"));
  });

  describe("Click", () => {
    it("should call onUndoClick when the don't import button is clicked", () => {
      const PROPS = {
        AutoMigrate: {
          display: true,
          stage: 0,
          msg: ""
        },
        onImportClick() {},
        onUndoClick: sinon.stub()
      };
      const wrapper = mountWithIntl(<AutoMigratePrompt {...PROPS} />);

      assert.ok(wrapper.find(".confirm button"));
      wrapper.find(".confirm button").not(".primary").simulate("click", {});
      assert.calledOnce(PROPS.onUndoClick);
    });

    it("should call onImportClick when the keep it button is clicked", () => {
      const PROPS = {
        AutoMigrate: {
          display: true,
          stage: 0,
          msg: ""
        },
        onImportClick: sinon.stub(),
        onUndoClick() {}
      };
      const wrapper = mountWithIntl(<AutoMigratePrompt {...PROPS} />);

      assert.ok(wrapper.find(".confirm button.primary"));
      wrapper.find(".primary").simulate("click", {});
      assert.calledOnce(PROPS.onImportClick);
    });
  });
});
