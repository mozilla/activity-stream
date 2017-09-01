const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: ManualMigration} = require("content-src/components/ManualMigration/ManualMigration");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");
const {FormattedMessage} = require("react-intl");

describe("<ManualMigration>", () => {
  let wrapper;
  let dispatch;
  beforeEach(() => {
    dispatch = sinon.stub();
    wrapper = shallowWithIntl(<ManualMigration dispatch={dispatch} />);
  });
  it("should render the component", () => {
    assert.isNotNull(wrapper.getNode());
  });
  it("should render correct intl string", () => {
    const fm = wrapper.find("p").find(FormattedMessage);

    assert.isNotNull(fm.getNode());
    assert.equal(fm.props().id, "manual_migration_explanation2");
  });
  describe("actions", () => {
    it("should render two buttons", () => {
      assert.equal(wrapper.find(".actions").children().length, 2);
    });
    it("should render correct intl string", () => {
      const fm = wrapper.find(".actions").childAt(0).find(FormattedMessage);

      assert.isNotNull(fm.getNode());
      assert.equal(fm.props().id, "manual_migration_cancel_button");
    });
    it("should render correct intl string", () => {
      const fm = wrapper.find(".actions").childAt(1).find(FormattedMessage);

      assert.isNotNull(fm.getNode());
      assert.equal(fm.props().id, "manual_migration_import_button");
    });
    it("cancel btn should dispatch correct events", () => {
      const cancelBtn = wrapper.find(".actions").childAt(0);

      cancelBtn.simulate("click");

      assert.calledTwice(dispatch);
      assert.calledWith(dispatch, ac.SendToMain({type: at.MIGRATION_CANCEL}));
      assert.calledWith(dispatch, ac.UserEvent({event: at.MIGRATION_CANCEL}));
    });
    it("import btn should dispatch correct events", () => {
      const cancelBtn = wrapper.find(".actions").childAt(1);

      cancelBtn.simulate("click");

      assert.calledTwice(dispatch);
      assert.calledWith(dispatch, ac.SendToMain({type: at.MIGRATION_START}));
      assert.calledWith(dispatch, ac.UserEvent({event: at.MIGRATION_START}));
    });
  });
});
