import "whatwg-fetch";
import "mutationobserver-shim";

(global as any).Response = Response;
(global as any).Headers = Headers;
(global as any).Request = Request;
(global as any).regeneratorRuntime = { mark: jest.fn(), wrap: jest.fn() };

// polyfill code from https://github.com/ungap/from-entries, idea from https://github.com/facebook/jest/issues/3687
/* tslint:disable */
Object.fromEntries =
  Object.fromEntries ||
  function (e: any) {
    for (
      var r, n = Array.isArray(e) ? createEntries(e) : ("entries" in e) ? e.entries() : e, t = {};
      (r = n.next()) && !r.done;

    ) {
      var a = r.value;
      Object.defineProperty(t, a[0], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        value: a[1],
      });
    }
    return t;
  };
function createEntries(r: any) {
  var n = -1;
  return {
    next: function () {
      var e = r.length <= ++n;
      return { done: e, value: e ? void 0 : r[n] };
    },
  };
}
/* tslint:enable */
