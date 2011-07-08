//Components.utils.import("resource://checkhost/integrators.js");
Components.utils.import("resource://checkhost/pref_listener.js");

var CheckHost = (function() {
    const POPUP_NAME = "checkhost-check-popup";

    var slaves;
    var default_action;
    var open_new_window;

    var popup;

    var set_default_action = function(new_default) {
        if (default_action !== undefined)
            document.getElementById("menu_status_" + default_action).removeAttribute("default");

        default_action = new_default;
        document.getElementById("menu_status_" + default_action).setAttribute("default", true);
    }

    var initialize = function() {
        // Preferences
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.checkhost.");

        //set_default_action(prefs.getCharPref("default_action"));
        //slaves = prefs.getIntPref("slaves");

        var listener = new PrefListener("extensions.checkhost.",
            function(branch, name) {
                switch (name) {
                    case "slaves":
                        slaves = prefs.getIntPref("slaves");
                        break;
                    case "default_action":
                        set_default_action(prefs.getCharPref("default_action"));
                        break;
                    case "open_new_window":
                        open_new_window = prefs.getBoolPref("open_new_window");
                        break;
                }
        });
        listener.register(true);

        //gBrowser.addEventListener('DOMContentLoaded', on_page_load, true);
    }
    
    var execute_check = function(event, check_type) {
        if (check_type === undefined)
            check_type = default_action;

        var target = content.window.location;

        if (content.window.name === POPUP_NAME) {
            popup = content.window;

            var host_match = /host=([^\&]+)(&|$)/.exec(popup.location.search);
            if (host_match !== null) {
                target = decodeURIComponent(host_match[1]);
            }
        }

        var url = "http://check-host.net/check-" + check_type 
                + "?minimal=1&slaves_limit=" + slaves 
                +"&host="
                + encodeURIComponent(target);

        if (open_new_window || popup === undefined || popup.closed) {
            popup = window.open(url, open_new_window ? "_blank" : POPUP_NAME,
                "status,scrollbars,width=770,height=330");
        } else {
            popup.location = url;
        }

        popup.focus();
        event.stopPropagation();
    }

    var on_page_load = function(event) {
    }

    return {
        initialize: initialize
        , check: execute_check
        , aboutDialog: function(event) {
            try {
                Components.utils
                    .import("resource://gre/modules/AddonManager.jsm");
                AddonManager.getAddonByID('checkhost@check-host.net',
                    function(addon) {
                        openDialog(
                            "chrome://mozapps/content/extensions/about.xul",
                            "", "chrome,centerscreen,modal", addon);
                });
            } catch (e) {
                var extension_manager = Components
                    .classes['@mozilla.org/extensions/manager;1']
                    .getService(Components.interfaces['nsIExtensionManager']);
                openDialog('chrome://mozapps/content/extensions/about.xul',
                    '', 'chrome, centerscreen, modal', 
                    'urn:mozilla:item:checkhost@check-host.net', 
                    extension_manager.datasource);
            }
            event.stopPropagation();
        }
        , prefDialog: function(event) {
            window.openDialog(
                    "chrome://checkhost/content/preferences.xul",
                    "checkhost-preferences",
                    "chrome,titlebar,toolbar,centerscreen,modal");
        }
    }
})()

window.addEventListener("load", function(e) {CheckHost.initialize(e)}, false);

