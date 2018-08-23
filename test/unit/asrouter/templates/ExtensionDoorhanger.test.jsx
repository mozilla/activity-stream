import schema from "content-src/asrouter/templates/CFR/templates/ExtensionDoorhanger.schema.json";

const DEFAULT_CONTENT = {
  "notification_text": "Recommendation",
  "heading_text": "Recommended Extension",
  "info_icon": {
    "label": "why_seeing_this",
    "url": "https://support.mozilla.org"
  },
  "addon": {
    "title": "Addon name",
    "icon": "https://mozilla.org/icon",
    "author": "Author name"
  },
  "text": "Description of addon",
  "amo_url": "https://example.com",
  "buttons": {
    "primary": {
      "label": "btn_ok",
      "action": {
        "type": "INSTALL_ADDON_FROM_URL",
        "data": {"url": "https://example.com"}
      }
    },
    "secondary": {"label": "btn_cancel"}
  }
};

describe("ExtensionDoorhanger", () => {
  it("should validate DEFAULT_CONTENT", () => {
    assert.jsonSchema(DEFAULT_CONTENT, schema);
  });
});
