import {RecipeExecutor} from "lib/RecipeExecutor.jsm";

describe.only("RecipeExecutor", () => {
  let mockVectorizer = {
    "tokenize": text => String(text).toLocaleLowerCase()
                          .split(/[ .,_/=&%-]/)
                          .filter(tok => tok.match(/[a-z0-9]/))
  };

  let instance = new RecipeExecutor(mockVectorizer);
  let item;

  beforeEach(() => {
    item = {
      "lhs": 2,
      "one": 1,
      "two": 2,
      "three": 3,
      "foo": "FOO",
      "bar": "BAR",
      "baz": ["one", "two", "three"],
      "qux": 42,
      "text": "This Is A_sentence.",
      "url": "http://www.wonder.example.com/dir1/dir2a-dir2b/dir3+4?key1&key2=val2&key3&%26amp=%3D3+4"
    };
  });

  describe("#_assemble_text", () => {
    it("should simply copy a single string", () => {
      assert.equal(instance._assembleText(item, ["foo"]), "FOO");
    });
    it("should append some strings with a space", () => {
      assert.equal(instance._assembleText(item, ["foo", "bar"]), "FOO BAR");
    });
    it("should give an empty string for a missing field", () => {
      assert.equal(instance._assembleText(item, ["missing"]), "");
    });
    it("should not double space an interior missing field", () => {
      assert.equal(instance._assembleText(item, ["foo", "missing", "bar"]), "FOO BAR");
    });
    it("should splice in an array of strings", () => {
      assert.equal(instance._assembleText(item, ["foo", "baz", "bar"]), "FOO one two three BAR");
    });
    it("should handle numbers", () => {
      assert.equal(instance._assembleText(item, ["foo", "qux", "bar"]), "FOO 42 BAR");
    });
  });

  describe("#acceptItemByFieldValue", () => {
    it("should implement ==", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "==", "rhsValue": 2}) !== null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "==", "rhsValue": 3}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "==", "rhsField": "two"}) !== null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "==", "rhsField": "three"}) === null);
    });
    it("should implement !=", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "!=", "rhsValue": 2}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "!=", "rhsValue": 3}) !== null);
    });
    it("should implement < ", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "<", "rhsValue": 1}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "<", "rhsValue": 2}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "<", "rhsValue": 3}) !== null);
    });
    it("should implement <= ", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "<=", "rhsValue": 1}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "<=", "rhsValue": 2}) !== null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "<=", "rhsValue": 3}) !== null);
    });
    it("should implement > ", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": ">", "rhsValue": 1}) !== null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": ">", "rhsValue": 2}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": ">", "rhsValue": 3}) === null);
    });
    it("should implement >= ", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": ">=", "rhsValue": 1}) !== null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": ">=", "rhsValue": 2}) !== null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": ">=", "rhsValue": 3}) === null);
    });
    it("should skip items with missing fields", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "no-left", "op": "==", "rhsValue": 1}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "==", "rhsField": "no-right"}) === null);
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "=="}) === null);
    });
    it("should skip items with bogus operators", () => {
      assert.isTrue(instance.acceptItemByFieldValue(item,
        {"field": "lhs", "op": "bogus", "rhsField": "two"}) === null);
    });
  });

  describe("#tokenizeUrl", () => {
    it("should tokenize the url", () => {
      item = instance.tokenizeUrl(item, {"field": "url", "dest": "url_toks"});
      assert.isTrue("url_toks" in item);
      assert.deepEqual(
        ["wonder", "example", "com", "dir1", "dir2a", "dir2b", "dir3", "4", "key1", "key2", "val2", "key3", "amp", "3", "4"],
        item.url_toks);
    });
  });

  describe("#getUrlDomain", () => {
    it("should get the hostname only", () => {
      item = instance.getUrlDomain(item, {"field": "url", "dest": "url_domain"});
      assert.isTrue("url_domain" in item);
      assert.deepEqual("wonder.example.com", item.url_domain);
    });
    it("should get the hostname and 2 levels of directories", () => {
      item = instance.getUrlDomain(item, {"field": "url", "path_length": 2, "dest": "url_plus_2"});
      assert.isTrue("url_plus_2" in item);
      assert.deepEqual("wonder.example.com/dir1/dir2a-dir2b", item.url_plus_2);
    });
  });

  describe("#tokenizeField", () => {
    it("should tokenize the field", () => {
      item = instance.tokenizeField(item, {"field": "text", "dest": "toks"});
      assert.isTrue("toks" in item);
      assert.deepEqual(["this", "is", "a", "sentence"], item.toks);
    });
  });
});
