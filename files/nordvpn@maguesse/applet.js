/*
 * nordvpn@maguesse Applet
 *
 * Cinnamon applet displaying NordVPN status.
 */
const Applet    = imports.ui.applet;
const Gettext   = imports.gettext;
const Gio       = imports.gi.Gio;
const GLib      = imports.gi.GLib;
const Lang      = imports.lang;
const Main      = imports.ui.main;
const Settings  = imports.ui.settings;
const St        = imports.gi.St;
const Util      = imports.misc.util;

const UUID = "nordvpn@maguesse"
const HOME_DIR = GLib.get_home_dir();
const APPLET_DIR = HOME_DIR + "/.local/share/cinnammon/applets/" + UUID;
const SCRIPTS_DIR = APPLET_DIR + "/scripts";
const ICONS_PATH = APPLET_DIR + "/icons";

// I18N
Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale")
function _(str) {
    return Gettext.dgettext(UUID, str);
}


// Log Utilities
function log(message) {
    global.log("\n[%s]: %s\n".format(UUID, message));
}

function logError(message) {
    global.logError("\n[%s]: %s\n".format(UUID, message));
}

// Applet's code
function NordVPNApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

NordVPNApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        this.metadata = metadata;
        this.instance_id = instance_id;
        this.orientation = orientation;
        this.scripts_dir = metadata.path + "/scripts";
        this.icons_dir = metadata.path + "/icons";
        // Icons paths
        this.icon_active_16 = this.icons_dir + "/nordvpn-16-active.png";
        this.icon_active_32 = this.icons_dir + "/nordvpn-32-active.png";
        this.icon_active_48 = this.icons_dir + "/nordvpn-48-active.png";
        this.icon_inactive_48 = this.icons_dir + "/nordvpn-48-inactive.png";
        // Commands
        this.main_command = this.scripts_dir + "/helper.sh";
        this.status_command = this.main_command + " status";
        this.settings_command = this.main_command + " settings";
        this.connect_command = this.main_command + " connect";
        this.disconnect_command = this.main_command + " disconnect";
        this.toggle_command = this.main_command + " toggle-status";
        // NordVPN settings
        this.kill_switch = false;
        this.cyber_sec = false;
        this.obfuscate = false;
        this.notify = false;
        this.auto_connect = false;
        this.dns = false;

        // Ensure that scripts are runnable.
        this._grant_executable_permission(this.main_command);
        this.running = true;
        this.vpn_active = false;
        this.vpn_status = {};
        // Check that NordVPN is installed
        this.nordvpn_installed = true;
        if(!GLib.find_program_in_path("nordvpn")) {
            let icon = new St.Icon(
                    { icon_name: 'error',
                        icon_type: St.IconType.FULLCOLOR,
                        icon_size: 36});
            Main.criticalNotify(_("Nord VPN application not installed !"), _("\nPlease see the readme."), icon);
            this.nordvpn_installed = false;
            this.set_applet_tooltip(_("Nord VPN application not found."));
            this.set_applet_label(_("Error"));
        } else {
            this.bind_settings(metadata.uuid, instance_id);
            this._check_status();
        }
    },

    _grant_executable_permission: function(file) {
        GLib.spawn_command_line_async("bash -c 'cd %s && chmod 755 *.sh'".format(this.scripts_dir))
    },

    bind_settings : function(uuid, instance_id) {
        this.settings = new Settings.AppletSettings(this, uuid, instance_id);

        this.settings.bindProperty(Settings.BindingDirection.IN,
                "kill_switch",  // The setting key
                "kill_switch",  // The property to bind the setting to
                this.on_settings_changed, // Callback function when value changes
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
    },

    on_applet_clicked: function(event) {
        this._toggle_nordvpn();
    },

    on_applet_removed_from_panel: function() {
        this.running = false;
        this.settings.finalize();
    },

    _update_applet: function() {
        if (this.vpn_active) {
            this.set_applet_tooltip("");
            this.set_applet_icon_path(this.icon_active_32);
            this.set_applet_tooltip(
                    _("Status : Connected to %s (IP: %s).").format(
                        this.vpn_status.current_server,
                        this.vpn_status.your_new_ip));
        } else {
            this.set_applet_tooltip("");
            this.set_applet_icon_path(this.icon_inactive_48);
            this.set_applet_tooltip(_("Status : Disconnected."));
        }
    },

    _check_status: function() {
        try {
            this._exec_cmd(this.status_command,
                    this._on_status_updated);
        } catch (e) {
            logError(e);
        }
    },

    _on_status_updated: function(process, pid, status) {
        let [stdout, stderr] = process.get_content();
        var obj = JSON.parse(stdout);
        if(obj.status === "Connected") {
            this.vpn_active = true;
        } else {
            this.vpn_active = false;
        }
        this.vpn_status = obj;
        this._update_applet();
    },

    _toggle_nordvpn: function() {
        try {
            this._exec_cmd(this.toggle_command,
                    function(process, pid, status) {
                        this._check_status();
                    });
        } catch (e) {
            logError(e);
        }
    },

    _exec_cmd : function(cmd, callback=null) {
        wait_process = new AsyncProcess(cmd);
        wait_process.set_callback(this, callback);
        wait_process.spawn_async();
    },

};

// Utility class used to spawn command asynchronously
// Should belong on its own module...
function AsyncProcess(command) {
    this._init(command);
};

AsyncProcess.prototype = {
    _init: function(command) {
        this.command = command;
        this.callback_function = null;
        this.callback_object = null;

        this.stdout_content = "";
        this.stderr_content = "";
    },

    spawn_async: function() {
        let [success, argv] = GLib.shell_parse_argv(this.command);
        let flags = GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD;
        if (success) {
            var [exit_code, pid, stdin, stdout, stderr] =
                GLib.spawn_async_with_pipes(null, argv, null, flags, null);
            this.exit_code = exit_code;
            this.pid = pid;
            this._init_streams(stdin, stdout, stderr);
            this._add_exit_callback();
            this._read_streams();
        }
    },

    set_callback: function(callback_object, callback_function) {
        this.callback_object = callback_object;
        this.callback_function = callback_function;
    },

    get_content: function() {
        return [ this.stdout_content, this.stderr_content];
    },

    _add_exit_callback: function() {
        GLib.child_watch_add(GLib.PRIORITY_DEFAULT_IDLE,
                this.pid,
                Lang.bind(this, this._on_exit));
    },

    _on_exit: function(pid, status) {
        GLib.spawn_close_pid(pid);
        this._close_streams();

        if(this.callback_function !== null) {
            this.callback_function.call(this.callback_object, this, pid, status);
        }
    },

    _init_streams: function(stdin, stdout, stderr) {
        this._stdinStream = this._make_data_output_stream(stdin);
        this._stdoutStream = this._make_data_input_stream(stdout);
        this._stderrStream = this._make_data_input_stream(stderr);
        this._cancellableStderr = new Gio.Cancellable();
        this._cancellableStdout = new Gio.Cancellable();
    },

    _read_streams: function() {
        this._read_input_stream(this._stdoutStream, this._cancellableStdout, 
                Lang.bind(this, function(out) {
                    this.stdout_content += out;}));
        this._read_input_stream(this._stderrStream, this._cancellableStderr, 
                Lang.bind(this, function(out) {
                    this.stderr_content += out;}));
    },

    _close_streams: function() {
        this._close_outputstream(this._stdinStream);
        this._close_inputstream(this._stdoutStream, this._cancellableStdout);
        this._close_inputstream(this._stderrStream, this._cancellableStderr);
    },

    _read_input_stream: function(stream, cancellable, callback) {
        this._async_reader(stream, callback);
    },

    _close_outputstream: function(stream) {
        try {
            stream.close(null);
        } catch (e) {
            logError(e);
        }
    },

    _close_inputstream: function(stream, cancellable) {
        try {
            stream.close_async(GLib.PRIORITY_DEFAULT, cancellable, null);
        } catch (e) {
            logError(e);
        }
    },

    _make_data_input_stream: function(filedescriptor) {
        return new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({
                fd: filedescriptor,
                close_fd: true
            })
        });
    },

    _make_data_output_stream: function(filedescriptor) {
        return new Gio.DataOutputStream({
            base_stream: new Gio.UnixOutputStream({
                fd: filedescriptor,
                close_fd: true
            })
        });
    },

    _async_reader: function(stream, callback) {
        stream.read_line_async(GLib.PRIORITY_DEFAULT, null,
                Lang.bind(this, function(source, result) {
                    let out, length;
                    [out, length] = source.read_line_finish(result);
                    if(out !== null) {
                        callback(out);
                        this._async_reader(source, callback);
                    }
                }));
    },

};

function main(metadata, orientation, panel_height, instance_id) {
    return new NordVPNApplet(metadata, orientation, panel_height, instance_id);
}
