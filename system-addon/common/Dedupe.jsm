this.Dedupe = class Dedupe {
  constructor(createKey, compare) {
    this.createKey = createKey || this.defaultCreateKey;
    this.compare = compare || this.defaultCompare;
  }

  defaultCreateKey(item) {
    return item;
  }

  defaultCompare() {
    return false;
  }

  collection(values) {
    const valueMap = new Map();
    values.forEach(value => {
      const key = this.createKey(value);
      if (!valueMap.has(key) || this.compare(valueMap.get(key), value)) {
        valueMap.set(key, value);
      }
    });
    return Array.from(valueMap.values());
  }
};

this.EXPORTED_SYMBOLS = ["Dedupe"];
