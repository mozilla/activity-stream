const Task = require("co-task");
module.exports = {
  // These are so we don't interupt the browser by an alert/confirm window
  alert: () => {},
  confirm: () => true,

  // These are Firefox globals that are often used
  Services: {obs: {notifyObservers: sinon.spy()}},
  Task
};
