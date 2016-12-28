const React = require("react");
const DebugPage = require("components/DebugPage/DebugPage");
const {renderWithProvider} = require("test/test-utils");

describe("DebugPage", () => {
  it("should load", () => {
    renderWithProvider(<DebugPage />);
  });
});
