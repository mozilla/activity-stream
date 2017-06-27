const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: ConfirmDialog} = require("content-src/components/ConfirmDialog/ConfirmDialog");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");
const {FormattedMessage} = require("react-intl");

describe("<ConfirmDialog>", () => {
  let wrapper;
  let dispatch;
  let ConfirmDialogProps;
  beforeEach(() => {
    dispatch = sinon.stub();
    ConfirmDialogProps = {
      visible: true,
      data: {onConfirm: []}
    };
    wrapper = shallowWithIntl(<ConfirmDialog dispatch={dispatch} {...ConfirmDialogProps} />);
  });
  it("should render an overlay", () => {
    assert.ok(wrapper.find(".modal-overlay"));
  });
  it("should render a modal", () => {
    assert.ok(wrapper.find(ConfirmDialog));
  });
  it("should not render if visible is false", () => {
    ConfirmDialogProps.visible = false;
    wrapper = shallowWithIntl(<ConfirmDialog dispatch={dispatch} {...ConfirmDialogProps} />);

    assert.lengthOf(wrapper.find(".confirmation-dialog"), 0);
  });
  describe("intl message check", () => {
    it("should render the message body sent via props", () => {
      ConfirmDialogProps.data = {body_string_id: ["foo", "bar"]};
      wrapper = shallowWithIntl(<ConfirmDialog dispatch={dispatch} {...ConfirmDialogProps} />);

      let msgs = wrapper.find(".modal-message").find(FormattedMessage);
      assert.equal(msgs.length, ConfirmDialogProps.data.body_string_id.length);

      msgs.forEach((fm, i) => assert.equal(fm.props().id, ConfirmDialogProps.data.body_string_id[i]));
    });
    it("should render the correct primary button text", () => {
      ConfirmDialogProps.data = {confirm_button_string_id: "primary_foo"};
      wrapper = shallowWithIntl(<ConfirmDialog dispatch={dispatch} {...ConfirmDialogProps} />);

      let doneLabel = wrapper.find(".actions").childAt(1).find(FormattedMessage);
      assert.ok(doneLabel);
      assert.equal(doneLabel.props().id, ConfirmDialogProps.data.confirm_button_string_id);
    });
  });
  describe("click events", () => {
    it("should emit SendToMain DIALOG_CANCEL when you click the overlay", () => {
      let overlay = wrapper.find(".modal-overlay");

      assert.ok(overlay);
      overlay.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.propertyVal(dispatch.firstCall.args[0], "type", at.DIALOG_CANCEL);
      assert.calledWith(dispatch, {type: at.DIALOG_CANCEL});
    });
    it("should emit UserEvent DIALOG_CANCEL when you click the overlay", () => {
      let overlay = wrapper.find(".modal-overlay");

      assert.ok(overlay);
      overlay.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.isUserEventAction(dispatch.secondCall.args[0]);
      assert.calledWith(dispatch, ac.UserEvent({event: at.DIALOG_CANCEL}));
    });
    it("should emit SendToMain DIALOG_CANCEL on cancel", () => {
      let cancelButton = wrapper.find(".actions").childAt(0);

      assert.ok(cancelButton);
      cancelButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.propertyVal(dispatch.firstCall.args[0], "type", at.DIALOG_CANCEL);
      assert.calledWith(dispatch, {type: at.DIALOG_CANCEL});
    });
    it("should emit UserEvent DIALOG_CANCEL on cancel", () => {
      let cancelButton = wrapper.find(".actions").childAt(0);

      assert.ok(cancelButton);
      cancelButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.isUserEventAction(dispatch.secondCall.args[0]);
      assert.calledWith(dispatch, ac.UserEvent({event: at.DIALOG_CANCEL}));
    });
    it("should emit UserEvent on primary button", () => {
      ConfirmDialogProps.data = {
        body_string_id: ["foo", "bar"],
        onConfirm: [
          ac.SendToMain({type: at.DELETE_URL, data: "foo.bar"}),
          ac.UserEvent({event: "DELETE"})
        ]
      };
      wrapper = shallowWithIntl(<ConfirmDialog dispatch={dispatch} {...ConfirmDialogProps} />);
      let doneButton = wrapper.find(".actions").childAt(1);

      assert.ok(doneButton);
      doneButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.isUserEventAction(dispatch.secondCall.args[0]);

      assert.calledTwice(dispatch);
      assert.calledWith(dispatch, ConfirmDialogProps.data.onConfirm[1]);
    });
    it("should emit SendToMain on primary button", () => {
      ConfirmDialogProps.data = {
        body_string_id: ["foo", "bar"],
        onConfirm: [
          ac.SendToMain({type: at.DELETE_URL, data: "foo.bar"}),
          ac.UserEvent({event: "DELETE"})
        ]
      };
      wrapper = shallowWithIntl(<ConfirmDialog dispatch={dispatch} {...ConfirmDialogProps} />);
      let doneButton = wrapper.find(".actions").childAt(1);

      assert.ok(doneButton);
      doneButton.simulate("click");

      // Two events are emitted: UserEvent+SendToMain.
      assert.calledTwice(dispatch);
      assert.calledWith(dispatch, ConfirmDialogProps.data.onConfirm[0]);
    });
  });
});
