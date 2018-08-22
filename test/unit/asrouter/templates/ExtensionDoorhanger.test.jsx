import schema from "content-src/asrouter/templates/CFR/templates/ExtensionDoorhanger.schema.json";

const DEFAULT_CONTENT = {
  "heading": {
    "title": "Recommended Extension",
    "url": "https://support.mozilla.org"
  },
  "addon": {
    "title": "Addon name",
    "icon": "base64",
    "author": "Author name"
  },
  "content": {
    "text": "Description of addon",
    "url": "https://example.com"
  }
};

describe("ExtensionDoorhanger", () => {
  it("should validate DEFAULT_CONTENT", () => {
    assert.jsonSchema(DEFAULT_CONTENT, schema);
  });
});
