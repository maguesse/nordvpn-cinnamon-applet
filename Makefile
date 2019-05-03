.PHONY: install uninstall reinstall reload update update_and_reload

SHELL = /bin/bash

APPLET_UUID = nordvpn@mathieu.aguesse@free.fr
APPLETS_DIR = $(HOME)/.local/share/cinnamon/applets
APPLET_DEST=$(APPLETS_DIR)/$(APPLET_UUID)

install:
	mkdir -p $(APPLET_DEST) ;\
	cd src ;\
	cp -R  . $(APPLET_DEST) ;\

uninstall: 
	-rm -rf $(APPLET_DEST)

reinstall: uninstall install reload

update: install
	dbus-send --session --dest=org.Cinnamon.LookingGlass \
		--type=method_call /org/Cinnamon/LookingGlass \
		org.Cinnamon.LookingGlass.ReloadExtension string:'$(APPLET_UUID)' string:'APPLET'

update_and_reload: update reload

reload:
	$(shell cinnamon --replace > /dev/null 2>&1 &)
