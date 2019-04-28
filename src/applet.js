const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Gettext = imports.gettext;
const Settings = imports.ui.settings;
const Util = imports.misc.util;


const UUID = "nordvpn@mathieu.aguesse@free.fr"
const HOME_DIR = GLib.get_home_dir();

Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale")

function _(str) {
    return Gettext.dgettext(UUID, str);
}

function NordVPNApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

NordVPNApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        this.metadata = metadata;
        this.instance_id = instance_id;
        this.orientation = orientation;
        this.icon_path = metadata.path + "/icons";
        this.icon_active_16 = this.icon_path + "/nordvpn-16-active.png";
        this.icon_active_32 = this.icon_path + "/nordvpn-32-active.png";
        this.icon_active_48 = this.icon_path + "/nordvpn-48-active.png";
        this.icon_inactive_48 = this.icon_path + "/nordvpn-48-inactive.png";
        this.kill_switch = false;
        this.cyber_sec = false;
        this.obfuscate = false;
        this.notify = false;
        this.auto_connect = false;
        this.dns = false;

        this.running = true;
        this.vpn_active = false;

        this._update();
        this.bindSettings(metadata.uuid, instance_id);
    },

    bindSettings : function(uuid, instance_id) {
        this.settings = new Settings.AppletSettings(this, uuid, instance_id);

        this.settings.bindProperty(Settings.BindingDirection.IN, 
                "kill_switch", 
                "kill_switch", 
                this.on_settings_changed, 
                null);
        this.settings.bindProperty(Settings.BindingDirection.IN, 
                "cybersec", 
                "cybersec", 
                this.on_settings_changed, 
                null);
        this.settings.bindProperty(Settings.BindingDirection.IN, 
                "obfuscate", 
                "obfuscate", 
                this.on_settings_changed, 
                null);
        this.settings.bindProperty(Settings.BindingDirection.IN, 
                "notify", 
                "notify", 
                this.on_settings_changed, 
                null);
        this.settings.bindProperty(Settings.BindingDirection.IN, 
                "auto-connect", 
                "auto-connect", 
                this.on_settings_changed, 
                null);
        this.settings.bindProperty(Settings.BindingDirection.IN, 
                "dns", 
                "dns", 
                this.on_settings_changed, 
                null);
        this.settings.bindProperty(Settings.BindingDirection.IN, 
                "protocol", 
                "protocol", 
                this.on_settings_changed, 
                null);
    },

    on_settings_changed: function() {
        this._update_nordvpn();
    },

    on_applet_clicked: function(event) {
        // TODO : Enable/Disable NordVPN depending on its current status
        if(this.vpn_active) {
            this.vpn_active = false;
        } else {
            this.vpn_active = true;
        }
        this._update();
    },

    _update : function() {
        if (this.vpn_active) {
            this.set_applet_tooltip("");
            this.set_applet_icon_path(this.icon_active_32);
            this.set_applet_tooltip("Status : Connected");
        } else {
            this.set_applet_tooltip("");
            this.set_applet_icon_path(this.icon_inactive_48);
            this.set_applet_tooltip("Status : Disconnected");
        }
    },

    _update_nordvpn : function() {
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new NordVPNApplet(metadata, orientation, panel_height, instance_id);
}
