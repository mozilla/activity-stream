import {PanelTestProvider} from "lib/PanelTestProvider.jsm";
const messages = PanelTestProvider.getMessages();

describe("PanelTestProvider", () => {
  it("should have a message", () => {
    assert.lengthOf(messages, 1);
  });
});
