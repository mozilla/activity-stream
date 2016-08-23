class Chrome {
  constructor() {
    this.Cc = {};
    this.Cu = {import: sinon.spy()};
    this.Ci = {};
  }
}
module.exports = new Chrome();
module.exports.Chrome = Chrome;
