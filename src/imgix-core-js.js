(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define('Imgix', ['exports', 'js-md5', 'js-base64'], factory);
  } else if (typeof exports !== 'undefined') {
    module.exports = factory(exports, require('js-md5'), require('js-base64').Base64);
  } else {
    var mod = {
      exports: {}
    };
    global.ImgixClient = factory(mod.exports, global.md5, global.Base64);
  }
})(this, function (exports, _jsMd5, _jsBase64) {
  var md5 = _jsMd5;
  var Base64 = _jsBase64;

  var VERSION = '1.0.6';
  var DEFAULTS = {
    host: null,
    useHTTPS: true,
    includeLibraryParam: true
  };

  var ImgixClient = (function() {
    function ImgixClient(opts) {
      var key, val;

      this.settings = {};

      for (key in DEFAULTS) {
        val = DEFAULTS[key];
        this.settings[key] = val;
      }

      for (key in opts) {
        val = opts[key];
        this.settings[key] = val;
      }

      if (!this.settings.host) {
        throw new Error('ImgixClient must be passed a valid host');
      }

      if (this.settings.includeLibraryParam) {
        this.settings.libraryParam = "js-" + VERSION;
      }

      this.settings.urlPrefix = this.settings.useHTTPS ? 'https://' : 'http://'
    }

    ImgixClient.prototype.buildURL = function(path, params) {
      path = this._sanitizePath(path);

      if (params == null) {
        params = {};
      }

      var queryParams = this._buildParams(params);
      if (!!this.settings.secureURLToken) {
        queryParams = this._signParams(path, queryParams);
      }

      return this.settings.urlPrefix + this.settings.host + path + queryParams;
    };

    ImgixClient.prototype._sanitizePath = function(path) {
      // Strip leading slash first (we'll re-add after encoding)
      path = path.replace(/^\//, '');

      if (/^https?:\/\//.test(path)) {
        // Use de/encodeURIComponent to ensure *all* characters are handled,
        // since it's being used as a path
        path = encodeURIComponent(path);
      } else if (/^https?%3A%2F%2F/.test(path)) {
        // Decode and re-encode the path, to ensure that it's fully, correctly encoded.
        // Use de/encodeURIComponent to ensure *all* characters are handled,
        // since it's being used as a path
        path = decodeURIComponent(encodeURIComponent(path));
      } else {
        // Use de/encodeURI if we think the path is just a path,
        // so it leaves legal characters like '/' and '@' alone
        path = decodeURI(encodeURI(path));
      }

      return '/' + path;
    };

    ImgixClient.prototype._buildParams = function(params) {
      if (this.settings.libraryParam) {
        params.ixlib = this.settings.libraryParam
      }

      var queryParams = [];
      var key, val, encodedKey, encodedVal;
      for (key in params) {
        val = params[key];
        encodedKey = encodeURIComponent(key);
        encodedVal;

        if (key.substr(-2) === '64') {
          encodedVal = Base64.encodeURI(val);
        } else {
          encodedVal = encodeURIComponent(val);
        }
        queryParams.push(encodedKey + "=" + encodedVal);
      }

      if (queryParams[0]) {
        queryParams[0] = "?" + queryParams[0];
      }
      return queryParams.join('&');
    };

    ImgixClient.prototype._signParams = function(path, queryParams) {
      var signatureBase = this.settings.secureURLToken + path + queryParams;
      var signature = md5(signatureBase);

      if (queryParams.length > 0) {
        return queryParams = queryParams + "&s=" + signature;
      } else {
        return queryParams = "?s=" + signature;
      }
    };

    ImgixClient.VERSION = VERSION;

    return ImgixClient;
  })();

  return ImgixClient;
});
