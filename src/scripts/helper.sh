#!/usr/bin/env sh
# MIT License - Copyright (c) 2019 Mahtieu AGUESSE
[ ${DEBUG} ] && set -x
usage() {
    cat<<!
Usage: $0 <action> [arguments]
    action:
        status
        toggle-status
        connect
        disconnect
        settings
        set
!
}

die() {
    msg=$1
    echo "${msg}"
    exit 2
}


parse_output() {
        awk '
    BEGIN { RS="[\r\n]"; FS=": "; ORS=""; print "{\n" }
    {
        gsub("[ -]", "_", $1)
        if (NF >= 2) {printf "%s\"%s\":\"%s\"", sep, tolower($1), $2;
        sep = ",\n"}}
    END { print "\n}" }'
}

## Shows NordVPN connection status
status() {
    nordvpn status | parse_output
}


## Shows current settings
settings() {
    nordvpn settings | parse_output
}

## Toggles NordVPN status
toggle_status() {
    st=$(status | jq -r '.status' | tr '[[:upper:]]' '[[:lower:]]')
    case ${st} in
        "disconnected")
            connect
            ;;
        "connected")
            disconnect
            ;;
        "*")
            die "Status unknown [${st}]"
            ;;
    esac
}

## Connects to NordVPN
connect() {
    nordvpn connect || die "Unable to connect"
}

## Disconnects from NordVPN
disconnect() {
    nordvpn disconnect || die "Unable to disconnect"
}

process() {
    action=$1;shift
    case ${action} in
        "status")
            status
            ;;
        "settings")
            settings
            ;;
        "connect")
            connect
            ;;
        "disconnect")
            disconnect
            ;;
        "toggle-status")
            toggle_status
            ;;
        "set")
            ;;
    esac
}

if [ $# -lt 1 ]; then
    usage
    exit 1;
fi

process $*
