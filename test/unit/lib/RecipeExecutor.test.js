import {RecipeExecutor} from "lib/RecipeExecutor.jsm";

describe("RecipeExecutor", () => {
  let mockVectorizer = {
    "tokenize": text => String(text).toLocaleLowerCase()
                          .split(/[ .,_/=&%-]/)
                          .filter(tok => tok.match(/[a-z0-9]/))
  };

  let makeItem = () => {
    let x = {
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
      "arr2": [3, 4, 5],
      "tags": {
        "a": {
          "aa": 0.1,
          "ab": 0.2,
          "ac": 0.3
        },
        "b": {
          "ba": 4,
          "bb": 5,
          "bc": 6
        }
      }
    };
    return x;
  };

  /*
  let mockNbTagger = {
    constructor: (tag, prob) => {
      this.tag = tag;
      this.prob = prob;
    },
    tagTokens: tokens => {
      let conf = this.prob >= 0.85;
      return {
        label: this.tag,
        logProb: Math.log(this.prob),
        confident: conf
      };
    },
    tag: text => this.tagTokens([text])
  };
  */
  let EPSILON = 0.00001;

  /*
  let nbTaggers = [
    new this.mockNbTagger("tag1", 0.70),
    new this.mockNbTagger("tag2", 0.86),
    new this.mockNbTagger("tag3", 0.90)
  ];
  */
  let instance = new RecipeExecutor(mockVectorizer);
  let item = null;

  beforeEach(() => {
    item = makeItem();
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

  describe("#l2Normalize", () => {
    it("should L2 normalize an array", () => {
      item = instance.l2Normalize(item, {"field": "arr1"});
      assert.deepEqual(item.arr1, [0.3713906763541037, 0.5570860145311556, 0.7427813527082074]);
    });
    it("should L2 normalize a map", () => {
      item = instance.l2Normalize(item, {"field": "map"});
      assert.deepEqual(item.map, {"a": 0.2672612419124244, "b": 0.5345224838248488, "c": 0.8017837257372732});
    });
  });

  describe("#probNormalize", () => {
    it("should normalize an array to sum to 1", () => {
      item = instance.probNormalize(item, {"field": "arr1"});
      assert.deepEqual(item.arr1, [0.2222222222222222, 0.3333333333333333, 0.4444444444444444]);
    });
    it("should normalize a map to sum to 1", () => {
      item = instance.probNormalize(item, {"field": "map"});
      assert.equal(Object.keys(item.map).length, 3);
      assert.isTrue("a" in item.map);
      assert.isTrue(Math.abs(item.map.a - 0.16667) <= EPSILON);
      assert.isTrue("b" in item.map);
      assert.isTrue(Math.abs(item.map.b - 0.33333) <= EPSILON);
      assert.isTrue("c" in item.map);
      assert.isTrue(Math.abs(item.map.c - 0.5) <= EPSILON);
    });
  });

  describe("#setDefault", () => {
    it("should store a missing value", () => {
      item = instance.setDefault(item, {"field": "missing", "value": 1111});
      assert.equal(item.missing, 1111);
    });
    it("should not overwrite an existing value", () => {
      item = instance.setDefault(item, {"field": "lhs", "value": 1111});
      assert.equal(item.lhs, 2);
    });
  });

  describe("#lookupValue", () => {
    it("should promote a value", () => {
      item = instance.lookupValue(item, {"haystack": "map", "needle": "c", "dest": "ccc"});
      assert.equal(item.ccc, 3);
    });
    it("should handle a missing haystack", () => {
      item = instance.lookupValue(item, {"haystack": "missing", "needle": "c", "dest": "ccc"});
      assert.isTrue(!("ccc" in item));
    });
    it("should handle a missing needle", () => {
      item = instance.lookupValue(item, {"haystack": "map", "needle": "missing", "dest": "ccc"});
      assert.isTrue(!("ccc" in item));
    });
  });

  describe("#copyToMap", () => {
    it("should copy a value to a map", () => {
      item = instance.copyToMap(item, {"src": "qux", "dest_map": "map", "dest_key": "zzz"});
      assert.isTrue("zzz" in item.map);
      assert.equal(item.map.zzz, item.qux);
    });
    it("should create a new map to hold the key", () => {
      item = instance.copyToMap(item, {"src": "qux", "dest_map": "missing", "dest_key": "zzz"});
      assert.equal(Object.keys(item.missing).length, 1);
      assert.equal(item.missing.zzz, item.qux);
    });
    it("should not create an empty map if the src is missing", () => {
      item = instance.copyToMap(item, {"src": "missing", "dest_map": "no_map", "dest_key": "zzz"});
      assert.isTrue(!("no_map" in item));
    });
  });

  describe("#applySoftmaxTags", () => {
    it("should apply softmax across the subtags", () => {
      item = instance.applySoftmaxTags(item, {"field": "tags"});
      assert.isTrue("a" in item.tags);
      assert.isTrue("aa" in item.tags.a);
      assert.isTrue("ab" in item.tags.a);
      assert.isTrue("ac" in item.tags.a);
      assert.isTrue(Math.abs(item.tags.a.aa - 0.30061) <= EPSILON);
      assert.isTrue(Math.abs(item.tags.a.ab - 0.33222) <= EPSILON);
      assert.isTrue(Math.abs(item.tags.a.ac - 0.36717) <= EPSILON);

      assert.isTrue("b" in item.tags);
      assert.isTrue("ba" in item.tags.b);
      assert.isTrue("bb" in item.tags.b);
      assert.isTrue("bc" in item.tags.b);
      assert.isTrue(Math.abs(item.tags.b.ba - 0.09003) <= EPSILON);
      assert.isTrue(Math.abs(item.tags.b.bb - 0.24473) <= EPSILON);
      assert.isTrue(Math.abs(item.tags.b.bc - 0.66524) <= EPSILON);
    });
  });

  describe("#combinerAdd", () => {
    it("should do nothing when right field is missing", () => {
      let right = makeItem();
      let combined = instance.combinerAdd(item, right, {"field": "missing"});
      assert.deepEqual(combined, item);
    });
    it("should add equal sized maps", () => {
      let right = makeItem();
      let combined = instance.combinerAdd(item, right, {"field": "map"});
      assert.deepEqual(combined.map, {"a": 2, "b": 4, "c": 6});
    });
    it("should add long map to short map", () => {
      let right = makeItem();
      right.map.d = 999;
      let combined = instance.combinerAdd(item, right, {"field": "map"});
      assert.deepEqual(combined.map, {"a": 2, "b": 4, "c": 6, "d": 999});
    });
    it("should add short map to long map", () => {
      let right = makeItem();
      item.map.d = 999;
      let combined = instance.combinerAdd(item, right, {"field": "map"});
      assert.deepEqual(combined.map, {"a": 2, "b": 4, "c": 6, "d": 999});
    });
    it("should add equal sized arrays", () => {
      let right = makeItem();
      let combined = instance.combinerAdd(item, right, {"field": "arr1"});
      assert.deepEqual(combined.arr1, [4, 6, 8]);
    });
    it("should add long array to short array", () => {
      let right = makeItem();
      right.arr1 = [2, 3, 4, 12];
      let combined = instance.combinerAdd(item, right, {"field": "arr1"});
      assert.deepEqual(combined.arr1, [4, 6, 8, 12]);
    });
    it("should add short array to long array", () => {
      let right = makeItem();
      item.arr1 = [2, 3, 4, 12];
      let combined = instance.combinerAdd(item, right, {"field": "arr1"});
      assert.deepEqual(combined.arr1, [4, 6, 8, 12]);
    });
    it("should add numbers", () => {
      let right = makeItem();
      let combined = instance.combinerAdd(item, right, {"field": "lhs"});
      assert.equal(combined.lhs, 4);
    });
  });

  describe("#combinerMax", () => {
    it("should do nothing when right field is missing", () => {
      let right = makeItem();
      let combined = instance.combinerMax(item, right, {"field": "missing"});
      assert.deepEqual(combined, item);
    });
    it("should handle equal sized maps", () => {
      let right = makeItem();
      right.map = {"a": 5, "b": -1, "c": 3};
      let combined = instance.combinerMax(item, right, {"field": "map"});
      assert.deepEqual(combined.map, {"a": 5, "b": 2, "c": 3});
    });
    it("should handle short map to long map", () => {
      let right = makeItem();
      right.map = {"a": 5, "b": -1, "c": 3, "d": 999};
      let combined = instance.combinerMax(item, right, {"field": "map"});
      assert.deepEqual(combined.map, {"a": 5, "b": 2, "c": 3, "d": 999});
    });
    it("should handle long map to short map", () => {
      let right = makeItem();
      right.map = {"a": 5, "b": -1, "c": 3};
      item.map.d = 999;
      let combined = instance.combinerMax(item, right, {"field": "map"});
      assert.deepEqual(combined.map, {"a": 5, "b": 2, "c": 3, "d": 999});
    });
    it("should handle equal sized arrays", () => {
      let right = makeItem();
      right.arr1 = [5, 1, 4];
      let combined = instance.combinerMax(item, right, {"field": "arr1"});
      assert.deepEqual(combined.arr1, [5, 3, 4]);
    });
    it("should handle short array to long array", () => {
      let right = makeItem();
      right.arr1 = [5, 1, 4, 7];
      let combined = instance.combinerMax(item, right, {"field": "arr1"});
      assert.deepEqual(combined.arr1, [5, 3, 4, 7]);
    });
    it("should handle long array to short array", () => {
      let right = makeItem();
      right.arr1 = [5, 1, 4];
      item.arr1.push(7);
      let combined = instance.combinerMax(item, right, {"field": "arr1"});
      assert.deepEqual(combined.arr1, [5, 3, 4, 7]);
    });
    it("should handle big number", () => {
      let right = makeItem();
      right.lhs = 99;
      let combined = instance.combinerMax(item, right, {"field": "lhs"});
      assert.equal(combined.lhs, 99);
    });
    it("should handle small number", () => {
      let right = makeItem();
      item.lhs = 99;
      let combined = instance.combinerMax(item, right, {"field": "lhs"});
      assert.equal(combined.lhs, 99);
    });
  });

  describe("#combinerCollectValues", () => {
    it("should sum when missing left", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 41;
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "sum"});
      assert.deepEqual(combined.combined_map, {"maseratiusa.com/maserati": 41});
    });
    it("should sum when missing right", () => {
      let right = makeItem();
      item.combined_map = {"fake": 42};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "sum"});
      assert.deepEqual(combined.combined_map, {"fake": 42});
    });
    it("should sum when both", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 41;
      item.combined_map = {"fake": 42, "maseratiusa.com/maserati": 41};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "sum"});
      assert.deepEqual(combined.combined_map, {"fake": 42, "maseratiusa.com/maserati": 82});
    });

    it("should max when missing left", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 41;
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "max"});
      assert.deepEqual(combined.combined_map, {"maseratiusa.com/maserati": 41});
    });
    it("should max when missing right", () => {
      let right = makeItem();
      item.combined_map = {"fake": 42};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "max"});
      assert.deepEqual(combined.combined_map, {"fake": 42});
    });
    it("should max when both (right)", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 99;
      item.combined_map = {"fake": 42, "maseratiusa.com/maserati": 41};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "max"});
      assert.deepEqual(combined.combined_map, {"fake": 42, "maseratiusa.com/maserati": 99});
    });
    it("should max when both (left)", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = -99;
      item.combined_map = {"fake": 42, "maseratiusa.com/maserati": 41};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "max"});
      assert.deepEqual(combined.combined_map, {"fake": 42, "maseratiusa.com/maserati": 41});
    });

    it("should overwrite when missing left", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 41;
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "overwrite"});
      assert.deepEqual(combined.combined_map, {"maseratiusa.com/maserati": 41});
    });
    it("should overwrite when missing right", () => {
      let right = makeItem();
      item.combined_map = {"fake": 42};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "overwrite"});
      assert.deepEqual(combined.combined_map, {"fake": 42});
    });
    it("should overwrite when both", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 41;
      item.combined_map = {"fake": 42, "maseratiusa.com/maserati": 77};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "overwrite"});
      assert.deepEqual(combined.combined_map, {"fake": 42, "maseratiusa.com/maserati": 41});
    });

    it("should count when missing left", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 41;
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "count"});
      assert.deepEqual(combined.combined_map, {"maseratiusa.com/maserati": 1});
    });
    it("should count when missing right", () => {
      let right = makeItem();
      item.combined_map = {"fake": 42};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "count"});
      assert.deepEqual(combined.combined_map, {"fake": 42});
    });
    it("should count when both", () => {
      let right = makeItem();
      right.url_domain = "maseratiusa.com/maserati";
      right.time = 41;
      item.combined_map = {"fake": 42, "maseratiusa.com/maserati": 1};
      let combined = instance.combinerCollectValues(item, right,
        {"left_field": "combined_map", "right_key_field": "url_domain", "right_value_field": "time", "operation": "count"});
      assert.deepEqual(combined.combined_map, {"fake": 42, "maseratiusa.com/maserati": 2});
    });
  });
});
