"use strict";

let Ci = Components.interfaces, Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

let deiObserver;

function startup(data, reason) {
	deiObserver = {
		QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver, Ci.nsISupportsWeakReference]),

		observe: function(aSubject, aTopic, aData) {
			if (aTopic == "document-element-inserted" && aSubject instanceof Ci.nsIDOMDocument
					&& aSubject.defaultView && aSubject.defaultView == aSubject.defaultView.top
					&& aSubject.location.protocol == "https:"
					&& aSubject.location.hostname == "www.youtube.com"
					&& aSubject.contentType == "text/html") {
				let script = aSubject.createElement("script");
				script.textContent = `
function onYouTubePlayerReady (e) {
  try {
    let pathname = document.location.pathname;
    if (pathname.startsWith("/user") || pathname.startsWith("/channel")) {
      e.stopVideo();
    }
  }
  catch(e) {}
}
(function (observe) {
  observe(window, "ytplayer", (ytplayer) => {
    observe(ytplayer, "config", (config) => {
      if (config && config.args) {
        Object.defineProperty(config.args, "autoplay", {
          configurable: true,
          get: () => "0"
        });
        config.args.fflags = config.args.fflags.replace("legacy_autoplay_flag=true", "legacy_autoplay_flag=false");
        config.args.jsapicallback = "onYouTubePlayerReady";
        delete config.args.ad3_module;
      }
    });
  });
})(function (object, property, callback) {
  let value;
  let descriptor = Object.getOwnPropertyDescriptor(object, property);
  Object.defineProperty(object, property, {
    enumerable: true,
    configurable: true,
    get: () => value,
    set: (v) => {
      callback(v);
      if (descriptor && descriptor.set) {
        descriptor.set(v);
      }
      value = v;
      return value;
    }
  });
});
// HTML5 spf forward
document.addEventListener("spfpartprocess", function (e) {
  if (e.detail && e.detail.part && e.detail.part.data && e.detail.part.data.swfcfg) {
    delete e.detail.part.data.swfcfg.args.ad3_module;
    if (document.location.href.indexOf("&list=") !== -1 && document.location.href.indexOf("&index=") !== -1) {
      return;
    }
    e.detail.part.data.swfcfg.args.autoplay = "0";
  }
});
(function(doc, win) {
  function stopVideo() {
    var player = doc.getElementById('movie_player');
    if (player != null && player.nodeType == 1 && player.tagName == 'DIV') {
      player.stopVideo();
    } else {
      win.setTimeout(stopVideo, 50);
    }
  }

  if (doc.location.pathname.startsWith("/watch")) {
    stopVideo();
  }
})(document, document.defaultView);
`;
				aSubject.documentElement.appendChild(script);
			}
		}
	};

	Services.obs.addObserver(deiObserver, "document-element-inserted", false);
}

function shutdown(data, reason) {
	if (reason == APP_SHUTDOWN) {
		return;
	}

	Services.obs.removeObserver(deiObserver, "document-element-inserted", false);
}

function install() {}

function uninstall() {}
