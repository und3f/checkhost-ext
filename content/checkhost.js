//Components.utils.import("resource://checkhost/integrators.js");
Components.utils.import("resource://checkhost/pref_listener.js");
Components.utils.import("resource://checkhost/install_button.js");

var CheckHost = new (function() {
    var slaves;
    var default_action;
    var context_integration;

    var set_default_action = function(new_default_action) {
        if (default_action !== undefined) {
            let old_button = document.getElementById("ch-button-" + default_action);
            if (old_button != null)
                old_button.removeAttribute("default");
        }

        default_action = new_default_action;
        let button = document.getElementById("ch-button-" + default_action);
        if (button != null) 
            button.setAttribute("default", true);
    }

    this.initialize = function() {
        window.removeEventListener("load", CheckHost.initialize, false);

        // Preferences
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.checkhost.");

        if ( !prefs.getBoolPref("integration.toolbar-button-installed") ) {
            InstallButton(document, "nav-bar", "ch-toolbar-button");
            prefs.setBoolPref("integration.toolbar-button-installed", true);
        };

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
                    case "use_new_tab":
                        var use_new_tab = prefs.getBoolPref("use_new_tab");
                        CheckHost.open_window = prefs.getBoolPref("use_new_tab") ? 
                            CheckHost.open_new_tab : CheckHost.open_in_current_window;
                        break;
                    case "integration.context":
                        context_integration =
                            prefs.getBoolPref("integration.context");
                        break;
                    case "integration.neterror":
                        if (prefs.getBoolPref("integration.neterror"))
                            gBrowser.addEventListener(
                                'DOMContentLoaded', on_page_load, false);
                        else
                            gBrowser.removeEventListener(
                                'DOMContentLoaded', on_page_load, false);
                        break;
                    }
            });
            listener.register(true);

        document.getElementById('contentAreaContextMenu')
            .addEventListener('popupshowing', function(event) {
                var onDocument=!(
                    gContextMenu.isContentSelected ||
                    gContextMenu.onTextInput ||
                    gContextMenu.onLink || gContextMenu.onImage
                );

                document.getElementById('ch-context-check-website')
                    .setAttribute('hidden',
                        !(context_integration && onDocument));

                document.getElementById('ch-context-check-link')
                    .setAttribute('hidden',
                        !(context_integration && gContextMenu.onLink));
            }, false);
    };

    this.checkURL = function(target, check_type) {
        if (check_type === undefined)
            check_type = default_action;

        var url = "http://check-host.net/check-" + check_type 
                + "?&slaves_limit=" + slaves 
                +"&host="
                + encodeURIComponent(target);

        this.open_window(url);
    }
        
    this.check = function(event, check_type) {
        var target = content.window.location;
        this.checkURL(target, check_type);
        event.stopPropagation();
    };

    this.checkLink = function(event) {
        var el=document.popupNode;
        while (el && el.tagName && 'A'!=el.tagName.toUpperCase()) {
            el=el.parentNode;
        };

        this.checkURL(el.href);
        event.stopPropagation();
    }

    var on_page_load = function(event) {
        var contentDoc=event.target;
        var contentWin=contentDoc.defaultView;

        if (contentDoc.documentURI.match(/^about:neterror/)) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'chrome://checkhost/content/netError.xhtml', false);
            xhr.send(null);

            var node_orig = xhr.responseXML
                .getElementById('ch-neterror');
            var container = contentDoc.getElementById('errorPageContainer');

            var node = contentDoc.adoptNode(node_orig);
            container.appendChild(node);

            // ...including the CSS.
            var link = contentDoc.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', 'chrome://checkhost/skin/netError.css');
            link.setAttribute('type', 'text/css');
            link.setAttribute('media', 'all');
            contentDoc.getElementsByTagName('head')[0].appendChild(link);

            var setup_handler = function(id, action_param) {
                contentDoc.getElementById(id).addEventListener(
                    'click',
                    function(event){CheckHost.check(event, action_param)},
                    false);
            };

            setup_handler('ch-item-info', 'info');
            setup_handler('ch-item-ping', 'ping');
            setup_handler('ch-item-http', 'http');
            setup_handler('ch-item-port', 'tcp');
            setup_handler('ch-item-dns', 'dns');
            setup_handler('ch-item-udp', 'udp');
        }
    }

    this.open_in_current_window = function(url) {
        content.window.location = url;
    }

    this.open_new_tab = function(url) {
        var tab = gBrowser.addTab(url, {relatedToCurrent: true});
        gBrowser.selectedTab = tab;
    }

    this.open_window = this.open_in_current_window;

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
