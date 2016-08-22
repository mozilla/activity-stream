class Chrome {
  constructor() {
    this.Cc = {};
    this.Cu = {import: sinon.spy()};
    this.Ci = {nsIDOMParser: sinon.spy()};
  }
}
module.exports = new Chrome();
module.exports.Chrome = Chrome;
