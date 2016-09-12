module.exports = store => next => action => {
  console.log("ACTION", action); // eslint-disable-line no-console
  next(action);
};
