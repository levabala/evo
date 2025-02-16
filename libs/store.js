/* store.js - Copyright (c) 2010-2017 Marcus Westin */ ! function (e) {
  if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
  else if ("function" == typeof define && define.amd) define([], e);
  else {
    var t;
    t = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, t.store = e()
  }
}(function () {
  var define, module, exports;
  return function e(t, n, r) {
    function o(u, a) {
      if (!n[u]) {
        if (!t[u]) {
          var c = "function" == typeof require && require;
          if (!a && c) return c(u, !0);
          if (i) return i(u, !0);
          var f = new Error("Cannot find module '" + u + "'");
          throw f.code = "MODULE_NOT_FOUND", f
        }
        var s = n[u] = {
          exports: {}
        };
        t[u][0].call(s.exports, function (e) {
          var n = t[u][1][e];
          return o(n ? n : e)
        }, s, s.exports, e, t, n, r)
      }
      return n[u].exports
    }
    for (var i = "function" == typeof require && require, u = 0; u < r.length; u++) o(r[u]);
    return o
  }({
    1: [function (e, t, n) {
      "use strict";
      var r = e("../src/store-engine"),
        o = e("../storages/all"),
        i = [e("../plugins/json2")];
      t.exports = r.createStore(o, i)
    }, {
      "../plugins/json2": 2,
      "../src/store-engine": 4,
      "../storages/all": 6
    }],
    2: [function (e, t, n) {
      "use strict";

      function r() {
        return e("./lib/json2"), {}
      }
      t.exports = r
    }, {
      "./lib/json2": 3
    }],
    3: [function (require, module, exports) {
      "use strict";
      var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
        return typeof e
      } : function (e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
      };
      "object" !== ("undefined" == typeof JSON ? "undefined" : _typeof(JSON)) && (JSON = {}),
      function () {
        function f(e) {
          return e < 10 ? "0" + e : e
        }

        function this_value() {
          return this.valueOf()
        }

        function quote(e) {
          return rx_escapable.lastIndex = 0, rx_escapable.test(e) ? '"' + e.replace(rx_escapable, function (e) {
            var t = meta[e];
            return "string" == typeof t ? t : "\\u" + ("0000" + e.charCodeAt(0).toString(16)).slice(-4)
          }) + '"' : '"' + e + '"'
        }

        function str(e, t) {
          var n, r, o, i, u, a = gap,
            c = t[e];
          switch (c && "object" === ("undefined" == typeof c ? "undefined" : _typeof(c)) && "function" == typeof c.toJSON && (c = c.toJSON(e)), "function" == typeof rep && (c = rep.call(t, e, c)), "undefined" == typeof c ? "undefined" : _typeof(c)) {
            case "string":
              return quote(c);
            case "number":
              return isFinite(c) ? String(c) : "null";
            case "boolean":
            case "null":
              return String(c);
            case "object":
              if (!c) return "null";
              if (gap += indent, u = [], "[object Array]" === Object.prototype.toString.apply(c)) {
                for (i = c.length, n = 0; n < i; n += 1) u[n] = str(n, c) || "null";
                return o = 0 === u.length ? "[]" : gap ? "[\n" + gap + u.join(",\n" + gap) + "\n" + a + "]" : "[" + u.join(",") + "]", gap = a, o
              }
              if (rep && "object" === ("undefined" == typeof rep ? "undefined" : _typeof(rep)))
                for (i = rep.length, n = 0; n < i; n += 1) "string" == typeof rep[n] && (r = rep[n], o = str(r, c), o && u.push(quote(r) + (gap ? ": " : ":") + o));
              else
                for (r in c) Object.prototype.hasOwnProperty.call(c, r) && (o = str(r, c), o && u.push(quote(r) + (gap ? ": " : ":") + o));
              return o = 0 === u.length ? "{}" : gap ? "{\n" + gap + u.join(",\n" + gap) + "\n" + a + "}" : "{" + u.join(",") + "}", gap = a, o
          }
        }
        var rx_one = /^[\],:{}\s]*$/,
          rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
          rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
          rx_four = /(?:^|:|,)(?:\s*\[)+/g,
          rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
          rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        "function" != typeof Date.prototype.toJSON && (Date.prototype.toJSON = function () {
          return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null
        }, Boolean.prototype.toJSON = this_value, Number.prototype.toJSON = this_value, String.prototype.toJSON = this_value);
        var gap, indent, meta, rep;
        "function" != typeof JSON.stringify && (meta = {
          "\b": "\\b",
          "\t": "\\t",
          "\n": "\\n",
          "\f": "\\f",
          "\r": "\\r",
          '"': '\\"',
          "\\": "\\\\"
        }, JSON.stringify = function (e, t, n) {
          var r;
          if (gap = "", indent = "", "number" == typeof n)
            for (r = 0; r < n; r += 1) indent += " ";
          else "string" == typeof n && (indent = n);
          if (rep = t, t && "function" != typeof t && ("object" !== ("undefined" == typeof t ? "undefined" : _typeof(t)) || "number" != typeof t.length)) throw new Error("JSON.stringify");
          return str("", {
            "": e
          })
        }), "function" != typeof JSON.parse && (JSON.parse = function (text, reviver) {
          function walk(e, t) {
            var n, r, o = e[t];
            if (o && "object" === ("undefined" == typeof o ? "undefined" : _typeof(o)))
              for (n in o) Object.prototype.hasOwnProperty.call(o, n) && (r = walk(o, n), void 0 !== r ? o[n] = r : delete o[n]);
            return reviver.call(e, t, o)
          }
          var j;
          if (text = String(text), rx_dangerous.lastIndex = 0, rx_dangerous.test(text) && (text = text.replace(rx_dangerous, function (e) {
              return "\\u" + ("0000" + e.charCodeAt(0).toString(16)).slice(-4)
            })), rx_one.test(text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, ""))) return j = eval("(" + text + ")"), "function" == typeof reviver ? walk({
            "": j
          }, "") : j;
          throw new SyntaxError("JSON.parse")
        })
      }()
    }, {}],
    4: [function (e, t, n) {
      "use strict";

      function r() {
        var e = "undefined" == typeof console ? null : console;
        if (e) {
          var t = e.warn ? e.warn : e.log;
          t.apply(e, arguments)
        }
      }

      function o(e, t, n) {
        n || (n = ""), e && !l(e) && (e = [e]), t && !l(t) && (t = [t]);
        var o = n ? "__storejs_" + n + "_" : "",
          i = n ? new RegExp("^" + o) : null,
          v = /^[a-zA-Z0-9_\-]*$/;
        if (!v.test(n)) throw new Error("store.js namespaces can only have alphanumerics + underscores and dashes");
        var h = {
            _namespacePrefix: o,
            _namespaceRegexp: i,
            _testStorage: function (e) {
              try {
                var t = "__storejs__test__";
                e.write(t, t);
                var n = e.read(t) === t;
                return e.remove(t), n
              } catch (r) {
                return !1
              }
            },
            _assignPluginFnProp: function (e, t) {
              var n = this[t];
              this[t] = function () {
                function t() {
                  if (n) return c(arguments, function (e, t) {
                    r[t] = e
                  }), n.apply(o, r)
                }
                var r = u(arguments, 0),
                  o = this,
                  i = [t].concat(r);
                return e.apply(o, i)
              }
            },
            _serialize: function (e) {
              return JSON.stringify(e)
            },
            _deserialize: function (e, t) {
              if (!e) return t;
              var n = "";
              try {
                n = JSON.parse(e)
              } catch (r) {
                n = e
              }
              return void 0 !== n ? n : t
            },
            _addStorage: function (e) {
              this.enabled || this._testStorage(e) && (this.storage = e, this.enabled = !0)
            },
            _addPlugin: function (e) {
              var t = this;
              if (l(e)) return void c(e, function (e) {
                t._addPlugin(e)
              });
              var n = a(this.plugins, function (t) {
                return e === t
              });
              if (!n) {
                if (this.plugins.push(e), !p(e)) throw new Error("Plugins must be function values that return objects");
                var r = e.call(this);
                if (!d(r)) throw new Error("Plugins must return an object of function properties");
                c(r, function (n, r) {
                  if (!p(n)) throw new Error("Bad plugin property: " + r + " from plugin " + e.name + ". Plugins should only return functions.");
                  t._assignPluginFnProp(n, r)
                })
              }
            },
            addStorage: function (e) {
              r("store.addStorage(storage) is deprecated. Use createStore([storages])"), this._addStorage(e)
            }
          },
          m = s(h, g, {
            plugins: []
          });
        return m.raw = {}, c(m, function (e, t) {
          p(e) && (m.raw[t] = f(m, e))
        }), c(e, function (e) {
          m._addStorage(e)
        }), c(t, function (e) {
          m._addPlugin(e)
        }), m
      }
      var i = e("./util"),
        u = i.slice,
        a = i.pluck,
        c = i.each,
        f = i.bind,
        s = i.create,
        l = i.isList,
        p = i.isFunction,
        d = i.isObject;
      t.exports = {
        createStore: o
      };
      var g = {
        version: "2.0.12",
        enabled: !1,
        get: function (e, t) {
          var n = this.storage.read(this._namespacePrefix + e);
          return this._deserialize(n, t)
        },
        set: function (e, t) {
          return void 0 === t ? this.remove(e) : (this.storage.write(this._namespacePrefix + e, this._serialize(t)), t)
        },
        remove: function (e) {
          this.storage.remove(this._namespacePrefix + e)
        },
        each: function (e) {
          var t = this;
          this.storage.each(function (n, r) {
            e.call(t, t._deserialize(n), (r || "").replace(t._namespaceRegexp, ""))
          })
        },
        clearAll: function () {
          this.storage.clearAll()
        },
        hasNamespace: function (e) {
          return this._namespacePrefix == "__storejs_" + e + "_"
        },
        createStore: function () {
          return o.apply(this, arguments)
        },
        addPlugin: function (e) {
          this._addPlugin(e)
        },
        namespace: function (e) {
          return o(this.storage, this.plugins, e)
        }
      }
    }, {
      "./util": 5
    }],
    5: [function (e, t, n) {
      (function (e) {
        "use strict";

        function n() {
          return Object.assign ? Object.assign : function (e, t, n, r) {
            for (var o = 1; o < arguments.length; o++) a(Object(arguments[o]), function (t, n) {
              e[n] = t
            });
            return e
          }
        }

        function r() {
          if (Object.create) return function (e, t, n, r) {
            var o = u(arguments, 1);
            return d.apply(this, [Object.create(e)].concat(o))
          };
          var e = function () {};
          return function (t, n, r, o) {
            var i = u(arguments, 1);
            return e.prototype = t, d.apply(this, [new e].concat(i))
          }
        }

        function o() {
          return String.prototype.trim ? function (e) {
            return String.prototype.trim.call(e)
          } : function (e) {
            return e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "")
          }
        }

        function i(e, t) {
          return function () {
            return t.apply(e, Array.prototype.slice.call(arguments, 0))
          }
        }

        function u(e, t) {
          return Array.prototype.slice.call(e, t || 0)
        }

        function a(e, t) {
          f(e, function (e, n) {
            return t(e, n), !1
          })
        }

        function c(e, t) {
          var n = s(e) ? [] : {};
          return f(e, function (e, r) {
            return n[r] = t(e, r), !1
          }), n
        }

        function f(e, t) {
          if (s(e)) {
            for (var n = 0; n < e.length; n++)
              if (t(e[n], n)) return e[n]
          } else
            for (var r in e)
              if (e.hasOwnProperty(r) && t(e[r], r)) return e[r]
        }

        function s(e) {
          return null != e && "function" != typeof e && "number" == typeof e.length
        }

        function l(e) {
          return e && "[object Function]" === {}.toString.call(e)
        }

        function p(e) {
          return e && "[object Object]" === {}.toString.call(e)
        }
        var d = n(),
          g = r(),
          v = o(),
          h = "undefined" != typeof window ? window : e;
        t.exports = {
          assign: d,
          create: g,
          trim: v,
          bind: i,
          slice: u,
          each: a,
          map: c,
          pluck: f,
          isList: s,
          isFunction: l,
          isObject: p,
          Global: h
        }
      }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }, {}],
    6: [function (e, t, n) {
      "use strict";
      t.exports = [e("./localStorage"), e("./oldFF-globalStorage"), e("./oldIE-userDataStorage"), e("./cookieStorage"), e("./sessionStorage"), e("./memoryStorage")]
    }, {
      "./cookieStorage": 7,
      "./localStorage": 8,
      "./memoryStorage": 9,
      "./oldFF-globalStorage": 10,
      "./oldIE-userDataStorage": 11,
      "./sessionStorage": 12
    }],
    7: [function (e, t, n) {
      "use strict";

      function r(e) {
        if (!e || !c(e)) return null;
        var t = "(?:^|.*;\\s*)" + escape(e).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*";
        return unescape(p.cookie.replace(new RegExp(t), "$1"))
      }

      function o(e) {
        for (var t = p.cookie.split(/; ?/g), n = t.length - 1; n >= 0; n--)
          if (l(t[n])) {
            var r = t[n].split("="),
              o = unescape(r[0]),
              i = unescape(r[1]);
            e(i, o)
          }
      }

      function i(e, t) {
        e && (p.cookie = escape(e) + "=" + escape(t) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/")
      }

      function u(e) {
        e && c(e) && (p.cookie = escape(e) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/")
      }

      function a() {
        o(function (e, t) {
          u(t)
        })
      }

      function c(e) {
        return new RegExp("(?:^|;\\s*)" + escape(e).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=").test(p.cookie)
      }
      var f = e("../src/util"),
        s = f.Global,
        l = f.trim;
      t.exports = {
        name: "cookieStorage",
        read: r,
        write: i,
        each: o,
        remove: u,
        clearAll: a
      };
      var p = s.document
    }, {
      "../src/util": 5
    }],
    8: [function (e, t, n) {
      "use strict";

      function r() {
        return s.localStorage
      }

      function o(e) {
        return r().getItem(e)
      }

      function i(e, t) {
        return r().setItem(e, t)
      }

      function u(e) {
        for (var t = r().length - 1; t >= 0; t--) {
          var n = r().key(t);
          e(o(n), n)
        }
      }

      function a(e) {
        return r().removeItem(e)
      }

      function c() {
        return r().clear()
      }
      var f = e("../src/util"),
        s = f.Global;
      t.exports = {
        name: "localStorage",
        read: o,
        write: i,
        each: u,
        remove: a,
        clearAll: c
      }
    }, {
      "../src/util": 5
    }],
    9: [function (e, t, n) {
      "use strict";

      function r(e) {
        return c[e]
      }

      function o(e, t) {
        c[e] = t
      }

      function i(e) {
        for (var t in c) c.hasOwnProperty(t) && e(c[t], t)
      }

      function u(e) {
        delete c[e]
      }

      function a(e) {
        c = {}
      }
      t.exports = {
        name: "memoryStorage",
        read: r,
        write: o,
        each: i,
        remove: u,
        clearAll: a
      };
      var c = {}
    }, {}],
    10: [function (e, t, n) {
      "use strict";

      function r(e) {
        return s[e]
      }

      function o(e, t) {
        s[e] = t
      }

      function i(e) {
        for (var t = s.length - 1; t >= 0; t--) {
          var n = s.key(t);
          e(s[n], n)
        }
      }

      function u(e) {
        return s.removeItem(e)
      }

      function a() {
        i(function (e, t) {
          delete s[e]
        })
      }
      var c = e("../src/util"),
        f = c.Global;
      t.exports = {
        name: "oldFF-globalStorage",
        read: r,
        write: o,
        each: i,
        remove: u,
        clearAll: a
      };
      var s = f.globalStorage
    }, {
      "../src/util": 5
    }],
    11: [function (e, t, n) {
      "use strict";

      function r(e, t) {
        if (!v) {
          var n = c(e);
          g(function (e) {
            e.setAttribute(n, t), e.save(p)
          })
        }
      }

      function o(e) {
        if (!v) {
          var t = c(e),
            n = null;
          return g(function (e) {
            n = e.getAttribute(t)
          }), n
        }
      }

      function i(e) {
        g(function (t) {
          for (var n = t.XMLDocument.documentElement.attributes, r = n.length - 1; r >= 0; r--) {
            var o = n[r];
            e(t.getAttribute(o.name), o.name)
          }
        })
      }

      function u(e) {
        var t = c(e);
        g(function (e) {
          e.removeAttribute(t), e.save(p)
        })
      }

      function a() {
        g(function (e) {
          var t = e.XMLDocument.documentElement.attributes;
          e.load(p);
          for (var n = t.length - 1; n >= 0; n--) e.removeAttribute(t[n].name);
          e.save(p)
        })
      }

      function c(e) {
        return e.replace(/^\d/, "___$&").replace(h, "___")
      }

      function f() {
        if (!d || !d.documentElement || !d.documentElement.addBehavior) return null;
        var e, t, n, r = "script";
        try {
          t = new ActiveXObject("htmlfile"), t.open(), t.write("<" + r + ">document.w=window</" + r + '><iframe src="/favicon.ico"></iframe>'), t.close(), e = t.w.frames[0].document, n = e.createElement("div")
        } catch (o) {
          n = d.createElement("div"), e = d.body
        }
        return function (t) {
          var r = [].slice.call(arguments, 0);
          r.unshift(n), e.appendChild(n), n.addBehavior("#default#userData"), n.load(p), t.apply(this, r), e.removeChild(n)
        }
      }
      var s = e("../src/util"),
        l = s.Global;
      t.exports = {
        name: "oldIE-userDataStorage",
        write: r,
        read: o,
        each: i,
        remove: u,
        clearAll: a
      };
      var p = "storejs",
        d = l.document,
        g = f(),
        v = (l.navigator ? l.navigator.userAgent : "").match(/ (MSIE 8|MSIE 9|MSIE 10)\./),
        h = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
    }, {
      "../src/util": 5
    }],
    12: [function (e, t, n) {
      "use strict";

      function r() {
        return s.sessionStorage
      }

      function o(e) {
        return r().getItem(e)
      }

      function i(e, t) {
        return r().setItem(e, t)
      }

      function u(e) {
        for (var t = r().length - 1; t >= 0; t--) {
          var n = r().key(t);
          e(o(n), n)
        }
      }

      function a(e) {
        return r().removeItem(e)
      }

      function c() {
        return r().clear()
      }
      var f = e("../src/util"),
        s = f.Global;
      t.exports = {
        name: "sessionStorage",
        read: o,
        write: i,
        each: u,
        remove: a,
        clearAll: c
      }
    }, {
      "../src/util": 5
    }]
  }, {}, [1])(1)
});