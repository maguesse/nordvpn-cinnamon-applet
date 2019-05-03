.PHONY: help install uninstall reinstall reload update update_and_reload

SHELL = /bin/bash

APPLET_UUID = nordvpn@maguesse
APPLETS_DIR = $(HOME)/.local/share/cinnamon/applets
APPLET_DEST=$(APPLETS_DIR)/$(APPLET_UUID)


METADATA_DIR=.
SRC_DIR=files/$(APPLET_UUID)

help: ## This help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

install: ## Install applet locally
	mkdir -p $(APPLET_DEST) ;\
		cp $(METADATA_DIR)/icon.png $(APPLET_DEST) ;\
	cd $(SRC_DIR) ;\
	cp -R  . $(APPLET_DEST) ;\

uninstall: ## Uninstall applet
	-rm -rf $(APPLET_DEST)

reinstall: uninstall install reload ## Reinstall applet

update: install ## Install and reload the applet
	dbus-send --session --dest=org.Cinnamon.LookingGlass \
		--type=method_call /org/Cinnamon/LookingGlass \
		org.Cinnamon.LookingGlass.ReloadExtension string:'$(APPLET_UUID)' string:'APPLET'

update_and_reload: update reload ## Install, reload the applet and reload Cinnamon session

reload: ## Reload Cinnamon session
	$(shell cinnamon --replace > /dev/null 2>&1 &)
