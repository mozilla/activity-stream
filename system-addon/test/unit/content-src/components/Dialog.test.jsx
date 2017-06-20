const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: Dialog} = require("content-src/components/Dialog/Dialog");
const {actionTypes, actionCreators: ac} = require("common/Actions.jsm");
const {FormattedMessage} = require("react-intl");

describe("<Dialog>", () => {
  let wrapper;
  let dispatch;
  let DialogProps;
  beforeEach(() => {
    dispatch = sinon.stub();
    DialogProps = {
      visible: true,
      data: {}
    };
    wrapper = shallowWithIntl(<Dialog dispatch={dispatch} Dialog={DialogProps} />);
  });
  it("should render an overlay", () => {
    assert.ok(wrapper.find(".modal-overlay"));
  });
  it("should render a modal", () => {
    assert.ok(wrapper.find(Dialog));
  });
  it("should not render if visible is false", () => {
    DialogProps.visible = false;
    wrapper = shallowWithIntl(<Dialog dispatch={dispatch} Dialog={DialogProps} />);

    assert.lengthOf(wrapper.find(".confirmation-dialog"), 0);
  });
  describe("intl message check", () => {
    it("should render the message body sent via props", () => {
      DialogProps.data = {message_body: ["foo", "bar"]};
      wrapper = shallowWithIntl(<Dialog dispatch={dispatch} Dialog={DialogProps} />);

      let msgs = wrapper.find(".modal-message").find(FormattedMessage);
      assert.equal(msgs.length, DialogProps.data.message_body.length);

      msgs.forEach((fm, i) => assert.equal(fm.props().id, DialogProps.data.message_body[i]));
    });
    it("should render the correct primary button text", () => {
      DialogProps.data = {confirm_btn_id: "primary_foo"};
      wrapper = shallowWithIntl(<Dialog dispatch={dispatch} Dialog={DialogProps} />);

      let doneLabel = wrapper.find(".actions").childAt(1).find(FormattedMessage);
      assert.ok(doneLabel);
      assert.equal(doneLabel.props().id, DialogProps.data.confirm_btn_id);
    });
  });
  describe("click events", () => {
    it("should emit SendToMain DIALOG_CANCEL on cancel", () => {
      let cancelButton = wrapper.find(".actions").childAt(0);

      assert.ok(cancelButton);
      cancelButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.propertyVal(dispatch.firstCall.args[0], "type", actionTypes.DIALOG_CANCEL);
      assert.calledWith(dispatch, ac.SendToMain({type: actionTypes.DIALOG_CANCEL}));
    });
    it("should emit UserEvent DIALOG_CANCEL on cancel", () => {
      let cancelButton = wrapper.find(".actions").childAt(0);

      assert.ok(cancelButton);
      cancelButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.isUserEventAction(dispatch.secondCall.args[0]);
      assert.calledWith(dispatch, ac.UserEvent({event: actionTypes.DIALOG_CANCEL}));
    });
    it("should emit prop UserEvent on primary button", () => {
      DialogProps.data = {
        message_body: ["foo", "bar"],
        userEvent: "DELETE"
      };
      wrapper = shallowWithIntl(<Dialog dispatch={dispatch} Dialog={DialogProps} />);
      let doneButton = wrapper.find(".actions").childAt(1);

      assert.ok(doneButton);
      doneButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.isUserEventAction(dispatch.secondCall.args[0]);
      assert.calledWith(dispatch, ac.UserEvent({event: DialogProps.data.userEvent}));
    });
    it("should emit prop SendToMain on primary button", () => {
      DialogProps.data = {
        message_body: ["foo", "bar"],
        action: "DELETE_HISTORY_URL",
        payload: "fake-url"
      };
      wrapper = shallowWithIntl(<Dialog dispatch={dispatch} Dialog={DialogProps} />);
      let doneButton = wrapper.find(".actions").childAt(1);

      assert.ok(doneButton);
      doneButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.propertyVal(dispatch.firstCall.args[0], "type", DialogProps.data.action);
      assert.calledWith(dispatch, ac.SendToMain({
        type: actionTypes[DialogProps.data.action],
        data: DialogProps.data.payload
      }));
    });
  });
});
