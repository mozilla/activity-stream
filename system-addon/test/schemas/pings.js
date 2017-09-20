const Joi = require("joi-browser");
const {MAIN_MESSAGE_TYPE, CONTENT_MESSAGE_TYPE} = require("common/Actions.jsm");

const baseKeys = {
  // client_id will be set by PingCentre if it doesn't exist.
  client_id: Joi.string().optional(),
  addon_version: Joi.string().required(),
  locale: Joi.string().required(),
  session_id: Joi.string(),
  page: Joi.valid(["about:home", "about:newtab", "unknown"]),
  user_prefs: Joi.number().integer().required()
};

const BasePing = Joi.object().keys(baseKeys).options({allowUnknown: true});

const UserEventPing = Joi.object().keys(Object.assign({}, baseKeys, {
  session_id: baseKeys.session_id.required(),
  page: baseKeys.page.required(),
  source: Joi.string().required(),
  event: Joi.string().required(),
  action: Joi.valid("activity_stream_user_event").required(),
  metadata_source: Joi.string(),
  highlight_type: Joi.valid(["bookmarks", "recommendation", "history"]),
  recommender_type: Joi.string()
}));

// Use this to validate actions generated from Redux
const UserEventAction = Joi.object().keys({
  type: Joi.string().required(),
  data: Joi.object().keys({
    event: Joi.valid([
      "CLICK",
      "SEARCH",
      "BLOCK",
      "DELETE",
      "DELETE_CONFIRM",
      "DIALOG_CANCEL",
      "DIALOG_OPEN",
      "OPEN_NEW_WINDOW",
      "OPEN_PRIVATE_WINDOW",
      "OPEN_NEWTAB_PREFS",
      "CLOSE_NEWTAB_PREFS",
      "BOOKMARK_DELETE",
      "BOOKMARK_ADD",
      "PIN",
      "UNPIN",
      "SAVE_TO_POCKET"
    ]).required(),
    source: Joi.valid(["TOP_SITES", "TOP_STORIES"]),
    action_position: Joi.number().integer()
  }).required(),
  meta: Joi.object().keys({
    to: Joi.valid(MAIN_MESSAGE_TYPE).required(),
    from: Joi.valid(CONTENT_MESSAGE_TYPE).required()
  }).required()
});

const UndesiredPing = Joi.object().keys(Object.assign({}, baseKeys, {
  source: Joi.string().required(),
  event: Joi.string().required(),
  action: Joi.valid("activity_stream_undesired_event").required(),
  value: Joi.number().required()
}));

const TileSchema = Joi.object().keys({
  id: Joi.number().integer().required(),
  pos: Joi.number().integer()
});

const ImpressionStatsPing = Joi.object().keys(Object.assign({}, baseKeys, {
  source: Joi.string().required(),
  action: Joi.valid("activity_stream_impression_stats").required(),
  tiles: Joi.array().items(TileSchema).required(),
  click: Joi.number().integer(),
  block: Joi.number().integer(),
  pocket: Joi.number().integer()
}));

const PerfPing = Joi.object().keys(Object.assign({}, baseKeys, {
  source: Joi.string(),
  event: Joi.string().required(),
  action: Joi.valid("activity_stream_performance_event").required(),
  value: Joi.number().required()
}));

const SessionPing = Joi.object().keys(Object.assign({}, baseKeys, {
  session_id: baseKeys.session_id.required(),
  page: baseKeys.page.required(),
  session_duration: Joi.number().integer(),
  action: Joi.valid("activity_stream_session").required(),
  perf: Joi.object().keys({
    // Timestamp of the action perceived by the user to trigger the load
    // of this page.
    //
    // Not required at least for the error cases where the
    // observer event doesn't fire
    load_trigger_ts: Joi.number().positive()
      .notes(["server counter", "server counter alert"]),

    // What was the perceived trigger of the load action?
    //
    // Not required at least for the error cases where the observer event
    // doesn't fire
    load_trigger_type: Joi.valid(["first_window_opened",
      "menu_plus_or_keyboard", "unexpected"])
      .notes(["server counter", "server counter alert"]).required(),

    // When did the topsites element finish painting?  Note that, at least for
    // the first tab to be loaded, and maybe some others, this will be before
    // topsites has yet to receive screenshots updates from the add-on code,
    // and is therefore just showing placeholder screenshots.
    topsites_first_painted_ts: Joi.number().positive()
      .notes(["server counter", "server counter alert"]),

    // When the page itself receives an event that document.visibilityState
    // == visible.
    //
    // Not required at least for the (error?) case where the
    // visibility_event doesn't fire.  (It's not clear whether this
    // can happen in practice, but if it does, we'd like to know about it).
    visibility_event_rcvd_ts: Joi.number().positive()
      .notes(["server counter", "server counter alert"])
  }).required()
}));

function chaiAssertions(_chai, utils) {
  const {Assertion} = _chai;

  Assertion.addMethod("validate", function(schema, schemaName) {
    const {error} = Joi.validate(this._obj, schema, {allowUnknown: false});
    this.assert(
      !error,
      `Expected to be ${schemaName ? `a valid ${schemaName}` : "valid"} but there were errors: ${error}`
    );
  });

  const assertions = {
    /**
     * assert.validate - Validates an item given a Joi schema
     *
     * @param  {any} actual The item to validate
     * @param  {obj} schema A Joi schema
     */
    validate(actual, schema, schemaName) {
      new Assertion(actual).validate(schema, schemaName);
    },

    /**
     * isUserEventAction - Passes if the item is a valid UserEvent action
     *
     * @param  {any} actual The item to validate
     */
    isUserEventAction(actual) {
      new Assertion(actual).validate(UserEventAction, "UserEventAction");
    }
  };

  Object.assign(_chai.assert, assertions);
}

module.exports = {
  baseKeys,
  BasePing,
  UndesiredPing,
  UserEventPing,
  UserEventAction,
  ImpressionStatsPing,
  PerfPing,
  SessionPing,
  chaiAssertions
};
