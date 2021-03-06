'use strict';

var Promise = require('promise');
var isPromise = require('is-promise');
var toRegex = require('path-to-regexp');
var clone = require('clone');

module.exports = Route;
function Route(method, path, handler) {
  this.method = method;

  this.keys = [];
  this.regex = toRegex((path === '*') ? '(.*)' : path, this.keys);
  this.handler = handler;
}
Route.prototype.handle = function (req, args) {
  if (req.method !== this.method && this.method !== 'all') return;
  var match;
  if (match = this.regex.exec(req.path)) {
    var before = req.params;
    req.params = clone(req.params);
    for (var i = 0; i < this.keys.length; i++) {
      req.params[this.keys[i].name] = match[i + 1];
    }
    var result = this.handler.apply(null, [req].concat(args));
    if (isPromise(result)) {
      return Promise.resolve(result).then(function (res) {
        if (res === undefined) req.params = before;
        return res;
      });
    } else {
      if (result === undefined) req.params = before;
      return result;
    }
  }
};
