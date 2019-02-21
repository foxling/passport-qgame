/* global describe, it, expect */

var Strategy = require('../lib/strategy');

describe('Strategy', function() {

  var options = require('./bootstrap/options');

  it('should be named qgame', function() {
    var strategy = new Strategy(options, function() {});
    expect(strategy.name).to.equal('qgame');
  });

  it('should throw if constructed without a verify callback', function() {
    expect(function() {
      new Strategy(options);
    }).to.throw(TypeError, 'VivoQgameStrategy requires a verify callback');
  });

});
