$(info )
$(info ****************** 更新数据 ****************** )
$(info )

DATA_PATH = data/organizations
EXPORTER_SCRIPT = ../exporter/export-house.sh

houses := $(shell find $(DATA_PATH) -name house.sh3d)

.PHONY: update

update: $(houses:%/house.sh3d=%/config.json)
	@python update-children.py $(DATA_PATH)
	@bash update-data.sh

$(houses:%/house.sh3d=%/config.json): %/config.json: %/house.sh3d
	@bash $(EXPORTER_SCRIPT) --resolution=0.02 --base=$(DATA_PATH} --output=$(shell dirname $@) $<
