//Components.utils.import("resource://checkhost/integrators.js");
Components.utils.import("resource://checkhost/pref_listener.js");

var CheckHost = new (function() {
    const POPUP_NAME = "checkhost-check-popup";

    var slaves;
    var default_action;
    var use_popup;

    var popup;

    var set_default_action = function(new_default_action) {
        if (default_action !== undefined)
            document.getElementById("ch-status-" + default_action)
                .removeAttribute("default");

        default_action = new_default_action;
        document.getElementById("ch-status-" + default_action)
            .setAttribute("default", true);
    }

    this.initialize = function() {
        window.removeEventListener("load", CheckHost.initialize, false);

        // Preferences
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.checkhost.");

        var listener = new CheckHostPrefListener("extensions.checkhost.",
            function(branch, name) {
                switch (name) {
                    case "slaves":
                        slaves = prefs.getIntPref("slaves");
                        break;
                    case "default_action":
                        set_default_action(
                            prefs.getCharPref("default_action"));
                        break;
                    case "use_popup":
                        use_popup =
                            prefs.getBoolPref("use_popup");
                        break;
                    }
            });
            listener.register(true);

        //gBrowser.addEventListener('DOMContentLoaded', on_page_load, true);
    };
        
    this.check = function(event, check_type) {
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
                + "?&slaves_limit=" + slaves 
                +"&host="
                + encodeURIComponent(target);

        if (!use_popup) {
            content.window.location = url;
        } else {
            url += "&minimal=1";
            if (popup === undefined || popup.closed) {
                popup = window.open(url, POPUP_NAME,
                    "status,scrollbars,width=770,height=330");
            } else {
                popup.location = url;
            }
        }

        popup.focus();
        event.stopPropagation();
    };

    this.aboutDialog = function(event) {
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
    };
        
    this.prefDialog = function(event) {
        window.openDialog(
            "chrome://checkhost/content/preferences.xul",
            "checkhost-preferences",
            "chrome,titlebar,toolbar,centerscreen,modal");
    }

})();

window.addEventListener("load", CheckHost.initialize, false);
