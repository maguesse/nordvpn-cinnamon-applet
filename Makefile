#
# Copyright (C) 2019 Mathieu AGUESSE <mathieu.aguesse@free.fr>
# MIT License
#
# APPLET_NAME : Applet's name
# APPLET_DOMAIN : Applet's domain 
# APPLET_AUTHOR : Original applet's author
APPLET_NAME=nordvpn
APPLET_DOMAIN=maguesse
APPLET_AUTHOR=Mathieu AGUESSE <mathieu.aguesse@free.fr>


## Do not update below this line
.PHONY: help install uninstall reinstall reload update update_and_reload

SHELL = /bin/bash

YEAR=$(shell date +%Y)
ISO_DATE=$(shell date +%Y-%m-%d" "%H:%M%z)

APPLET_UUID=$(APPLET_NAME)@$(APPLET_DOMAIN)
APPLETS_DIR=$(HOME)/.local/share/cinnamon/applets
APPLET_DEST=$(APPLETS_DIR)/$(APPLET_UUID)
METADATA_DIR=.
PO_DIR=$(SRC_DIR)/po
SRC_DIR=files/$(APPLET_UUID)
JS_FILES=$(shell find $(SRC_DIR) -type f -name '*.js')
JSON_FILES=$(shell find $(SRC_DIR) -type f -name '*.json')
SRC=$(JS_FILES)
SRC+=$(JSON_FILES)

help: ## This help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

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

# I10N
# Generate .po template file
$(PO_DIR)/$(APPLET_NAME).pot: $(SRC)
	@mkdir -p $(PO_DIR)
	@echo Generate po file
	@xgettext --default-domain=$(APPLET_NAME) \
		--language=JavaScript \
		--output-dir=$(PO_DIR) \
		--copyright-holder="$(APPLET_AUTHOR)" \
		--package-name=$(APPLET_NAME) \
		--package-version=0.1 \
		--msgid-bugs-address=mathieu.aguesse@free.fr \
		--from-code=UTF-8 \
		$(JS_FILES)
	@sed -i \
		-e 's:FIRST AUTHOR.*$$:$(APPLET_AUTHOR), $(YEAR).:' \
		-e 's:#\(.*\)YEAR:#\1$(YEAR):' \
		$(PO_DIR)/$(APPLET_NAME).po
	@mv $(PO_DIR)/$(APPLET_NAME).po $(PO_DIR)/$(APPLET_NAME).pot
	@cinnamon-json-makepot $(PO_DIR)/$(APPLET_NAME).pot

.PHONY: l10n
l10n: $(PO_DIR)/$(APPLET_NAME).pot ## Generate POT file
