var EXPORTED_SYMBOLS = ["FlagFoxIntegration"];

function FlagFoxIntegration() {
    const actions_config_branch = "flagfox.";
    const actions_config_pref   = "actions";
    
    const integration_actions = ["tcp", "http", "ping"];

    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService)
            .getBranch(actions_config_branch);

    var getFFActions = function() {
        return JSON.parse(prefs.getCharPref(actions_config_pref))
    }

    this.isIntegrationPossible = function(cb) {
        const flagfox_extension_id = "{1018e4d6-728f-4b20-ad56-37578a4de76b}";
        Components.utils.import("resource://gre/modules/AddonManager.jsm");
        AddonManager.getAddonByID(flagfox_extension_id,
            function(addon) {cb(addon !== null);}
        );
    }

    this.isIntegrated = function() {
        var actions = getFFActions();
        var re = new RegExp(command_names.ch);
        for (var i in actions) {
            if (re.test(actions[i].name))
                return true;
        }
        return false;
    }

    this.integrate = function() {
        if (!this.isIntegrated()) {
            var actions = getFFActions();
            for (var i in integration_actions) {
                var action = integration_actions[i];
                actions.push({
                    name: command_names.ch + " " + command_names[action],
                    template: "http://check-host.net/check-" + action + "?host={fullURL}",
                    custom: true,
                    show: true
                });
            }
            prefs.setCharPref(actions_config_pref, JSON.stringify(actions))
        }
    }

    this.deintegrate = function() {
    }
}
