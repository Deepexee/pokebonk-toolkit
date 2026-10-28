(function () {
  if (window.__pbAndroid) return;
  window.__pbAndroid = true;

  var fsEl = null;
  function fire() {
    document.dispatchEvent(new Event("fullscreenchange"));
    document.dispatchEvent(new Event("webkitfullscreenchange"));
  }
  ["fullscreenElement", "webkitFullscreenElement"].forEach(function (k) {
    try { Object.defineProperty(Document.prototype, k, { configurable: true, get: function () { return fsEl; } }); } catch (e) {}
  });
  Element.prototype.requestFullscreen = function () { fsEl = document.documentElement; fire(); return Promise.resolve(); };
  Element.prototype.webkitRequestFullscreen = function () { fsEl = document.documentElement; fire(); };
  Document.prototype.exitFullscreen = function () { fsEl = null; fire(); return Promise.resolve(); };
  Document.prototype.webkitExitFullscreen = function () { fsEl = null; fire(); };
  try {
    if (navigator.keyboard) {
      navigator.keyboard.lock = function () { return Promise.resolve(); };
      navigator.keyboard.unlock = function () {};
    }
    if (screen.orientation) screen.orientation.lock = function () { return Promise.resolve(); };
  } catch (e) {}

  var A = window.PBAndroid;
  if (A) {
    window.pywebview = {
      api: {
        save_runs: function (t) { return Promise.resolve(A.saveRuns(t)); },
        load_runs: function () { return Promise.resolve(A.loadRuns()); },
        open_data_folder: function () {
          var t = "[]";
          try { t = localStorage.getItem("pokebonk_runs_v1") || "[]"; } catch (e) {}
          A.shareRuns(t);
          return Promise.resolve();
        },
        set_fullscreen: function () { return Promise.resolve(true); }
      }
    };
    window.dispatchEvent(new Event("pywebviewready"));
  }
})();
