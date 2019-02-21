var util = require('util');
var Strategy = require('passport-strategy');
var md5 = require('md5');
var axios = require('axios');
var querystring = require('querystring');
var debug = require('debug')('qgame');

var ACCESS_TOKEN_URI = 'https://passport.vivo.com.cn/oauth/2.0/access_token';
var USER_URI = 'https://passport.vivo.com.cn/oauth/2.0/resource';

/**
 * Creates an instance of `Strategy`.
 *
 * @varructor
 * @api public
 */
function VivoQgameStrategy(options, verify) {
  Strategy.call(this);

  this.name = 'qgame';

  options = options || {};

  this._key = options.key;
  this._secret = options.secret;

  if (!this._key || !this._secret) {
    throw new TypeError('qgame key/secret required.');
  }

  this._verify = verify;
  if (!this._verify) {
    throw new TypeError('VivoQgameStrategy requires a verify callback');
  }

  this._passReqToCallback = options.passReqToCallback;
}

util.inherits(VivoQgameStrategy, Strategy);

/**
 * Authenticate request.
 * @param {Object} req The request to authenticate.
 * @param {Object} [options] Strategy-specific options.
 * @api public
 */
VivoQgameStrategy.prototype.authenticate = function(req, options) {
  var code = req.body.code || req.query.code;

  if (!code) {
    return this.fail('code is required.');
  }

  var self = this;

  this.fetchAccessToken(code).then(function(data) {
    return self.fetchUser(data.access_token).then(function(user) {
      data.provider = 'qgame';
      Object.assign(data, user);

      debug(data);

      var verified = function(err, user, info) {
        if (err) {
          return self.error(err);
        } else if (!user) {
          return self.fail(info);
        } else {
          return self.success(user, info);
        }
      };

      try {
        if (self._passReqToCallback) {
          self._verify(req, data, verified);
        } else {
          self._verify(data, verified);
        }
      } catch (err) {
        self.error(err);
      }
    }).catch(function(err) {
      self.fail(err.message);
    });
  }).catch(function(err) {
    self.fail(err.message);
  });
};

VivoQgameStrategy.prototype.sign = function(params) {
  if (params.sign) {
    delete params.sign;
  }

  if (!params.timestamp) {
    params.timestamp = Date.now();
  }

  if (!params.nonce) {
    params.nonce = ('' + Math.random()).replace('.', '');
  }

  params.client_id = this._key;

  var keys = Object.keys(params);
  keys.sort();

  var str = keys.map(k => `${k}=${params[k]}`).join('&') + this._secret;
  return md5(str);
}

VivoQgameStrategy.prototype.fetchAccessToken = function(code) {
  var params = {
    code,
    grant_type: 'authorization_code',
  };
  params.sign = this.sign(params);

  debug(params);

  return axios({
    method: 'POST',
    url: ACCESS_TOKEN_URI,
    data: querystring.stringify(params),
    timeout: 10000,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
  }).then(res => {
    var data = res.data;
    
    debug(data);

    if (res.status === 200 && data && data.access_token) {
      return Promise.resolve(data);
    }

    return Promise.reject(new Error(data && data.msg || 'qgame fetch access token error'));
  });
};

VivoQgameStrategy.prototype.fetchUser = function(access_token) {
  var params = { access_token };

  params.sign = this.sign(params);

  return axios({
    method: 'GET',
    url: USER_URI + '?' + querystring.stringify(params),
    timeout: 10000,
  }).then(res => {
    var data = res.data;

    debug(data);

    if (data && data.openid) {
      return Promise.resolve(data);
    }

    return Promise.reject(new Error(data && data.msg || 'qgame fetch user error'));
  });
};


/**
 * Expose `Strategy`.
 */
module.exports = VivoQgameStrategy;
