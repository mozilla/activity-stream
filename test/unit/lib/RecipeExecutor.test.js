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
      "url": "http://www.wonder.example.com/dir1/dir2a-dir2b/dir3+4?key1&key2=val2&key3&%26amp=%3D3+4",
      "map": {
        "c": 3,
        "a": 1,
        "b": 2
      },
      "map2": {
        "b": 2,
        "c": 3,
        "d": 4
      },
      "arr1": [2, 3, 4],
      "arr2": [3, 4, 5]
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

  describe("#_typeOf", () => {
    it("should know this is a map", () => {
      assert.equal(instance._typeOf({}), "map");
    });
    it("should know this is an array", () => {
      assert.equal(instance._typeOf([]), "array");
    });
    it("should know this is a string", () => {
      assert.equal(instance._typeOf("blah"), "string");
    });
  });

  describe("#_lookupScalar", () => {
    it("should return the constant", () => {
      assert.equal(instance._lookupScalar({}, 1, 0), 1);
    });
    it("should return the default", () => {
      assert.equal(instance._lookupScalar({}, "blah", 42), 42);
    });
    it("should return the field's value", () => {
      assert.equal(instance._lookupScalar({"blah": 11}, "blah", 42), 11);
    });
  });

  describe("#copyValue", () => {
    it("should copy values", () => {
      item = instance.copyValue(item, {"src": "one", "dest": "again"});
      assert.isTrue("again" in item);
      assert.equal(item.again, 1);
    });
  });

  describe("#keepTopK", () => {
    it("should keep the 2 smallest", () => {
      item = instance.keepTopK(item, {"field": "map", "k": 2, "descending": false});
      assert.equal(Object.keys(item.map).length, 2);
      assert.isTrue("a" in item.map);
      assert.equal(item.map.a, 1);
      assert.isTrue("b" in item.map);
      assert.equal(item.map.b, 2);
      assert.isTrue(!("c" in item.map));
    });
    it("should keep the 2 largest", () => {
      item = instance.keepTopK(item, {"field": "map", "k": 2, "descending": true});
      assert.equal(Object.keys(item.map).length, 2);
      assert.isTrue(!("a" in item.map));
      assert.isTrue("b" in item.map);
      assert.equal(item.map.b, 2);
      assert.isTrue("c" in item.map);
      assert.equal(item.map.c, 3);
    });
    it("should still keep the 2 largest", () => {
      item = instance.keepTopK(item, {"field": "map", "k": 2});
      assert.equal(Object.keys(item.map).length, 2);
      assert.isTrue(!("a" in item.map));
      assert.isTrue("b" in item.map);
      assert.equal(item.map.b, 2);
      assert.isTrue("c" in item.map);
      assert.equal(item.map.c, 3);
    });
  });

  describe("#scalarMultiply", () => {
    it("should use constants", () => {
      item = instance.scalarMultiply(item, {"field": "map", "k": 2});
      assert.equal(item.map.a, 2);
      assert.equal(item.map.b, 4);
      assert.equal(item.map.c, 6);
    });
    it("should use fields", () => {
      item = instance.scalarMultiply(item, {"field": "map", "k": "three"});
      assert.equal(item.map.a, 3);
      assert.equal(item.map.b, 6);
      assert.equal(item.map.c, 9);
    });
    it("should use default", () => {
      item = instance.scalarMultiply(item, {"field": "map", "k": "missing", "default": 4});
      assert.equal(item.map.a, 4);
      assert.equal(item.map.b, 8);
      assert.equal(item.map.c, 12);
    });
  });

  describe("#elementwiseMultiply", () => {
    it("should handle maps", () => {
      item = instance.elementwiseMultiply(item, {"left": "map", "right": "map2"});
      assert.equal(item.map.a, 0);
      assert.equal(item.map.b, 4);
      assert.equal(item.map.c, 9);
    });
    it("should handle arrays", () => {
      item = instance.elementwiseMultiply(item, {"left": "arr1", "right": "arr2"});
      assert.equal(item.arr1.length, 3);
      assert.equal(item.arr1[0], 6);
      assert.equal(item.arr1[1], 12);
      assert.equal(item.arr1[2], 20);
    });
  });

  describe("#vectorMultiply", () => {
    it("should calculate dot products from maps", () => {
      item = instance.vectorMultiply(item, {"left": "map", "right": "map2", "dest": "dot"});
      assert.equal(item.dot, 13);
    });
    it("should calculate dot products from arrays", () => {
      item = instance.vectorMultiply(item, {"left": "arr1", "right": "arr2", "dest": "dot"});
      assert.equal(item.dot, 38);
    });
  });

  describe("#scalarAdd", () => {
    it("should add a constant to every cell on a map", () => {
      item = instance.scalarAdd(item, {"field": "map", "k": 10});
      assert.deepEqual(item.map, {"a": 11, "b": 12, "c": 13});
    });
    it("should add a value from a field to every cell on a map", () => {
      item = instance.scalarAdd(item, {"field": "map", "k": "qux"});
      assert.deepEqual(item.map, {"a": 43, "b": 44, "c": 45});
    });
    it("should add a constant to every cell on an array", () => {
      item = instance.scalarAdd(item, {"field": "arr1", "k": 10});
      assert.deepEqual(item.arr1, [12, 13, 14]);
    });
  });

  describe("#vectorAdd", () => {
    it("should calculate add vectors from maps", () => {
      item = instance.vectorAdd(item, {"left": "map", "right": "map2"});
      assert.equal(Object.keys(item.map).length, 4);
      assert.isTrue("a" in item.map);
      assert.equal(item.map.a, 1);
      assert.isTrue("b" in item.map);
      assert.equal(item.map.b, 4);
      assert.isTrue("c" in item.map);
      assert.equal(item.map.c, 6);
      assert.isTrue("d" in item.map);
      assert.equal(item.map.d, 4);
    });
    it("should calculate add vectors from arrays", () => {
      item = instance.vectorAdd(item, {"left": "arr1", "right": "arr2"});
      assert.deepEqual(item.arr1, [5, 7, 9]);
    });
  });

  describe("#makeBoolean", () => {
    it("should 0/1 a map", () => {
      item = instance.makeBoolean(item, {"field": "map", "threshold": 2});
      assert.deepEqual(item.map, {"a": 0, "b": 0, "c": 1});
    });
    it("should a map of all 1s", () => {
      item = instance.makeBoolean(item, {"field": "map"});
      assert.deepEqual(item.map, {"a": 1, "b": 1, "c": 1});
    });
    it("should -1/1 a map", () => {
      item = instance.makeBoolean(item, {"field": "map", "threshold": 2, "keep_negative": true});
      assert.deepEqual(item.map, {"a": -1, "b": -1, "c": 1});
    });
    it("should work an array", () => {
      item = instance.makeBoolean(item, {"field": "arr1", "threshold": 3});
      assert.deepEqual(item.arr1, [0, 0, 1]);
    });
  });

  describe("#whitelistFields", () => {
    it("should filter the keys out of a map", () => {
      item = instance.whitelistFields(item, {"fields": ["foo", "bar"]});
      assert.deepEqual(item, {"foo": "FOO", "bar": "BAR"});
    });
  });

  describe("#filterByValue", () => {
    it("should filter the keys out of a map", () => {
      item = instance.filterByValue(item, {"field": "map", "threshold": 2});
      assert.deepEqual(item.map, {"c": 3});
    });
  });
});
