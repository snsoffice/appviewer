$(info )
$(info ****************** 更新数据 ****************** )
$(info )

DATA_PATH = data/organizations

EXPORTER_PATH = ../exporter
EXPORTER_SCRIPT = export-house.sh

houses := $(find $(DATA_PATH) -name house.sh3d)

.PHONY: update

update: $(houses:%/house.sh3d=%/config.json)
	python update-children $(DATA_PATH)
	@bash update-data.sh

$(houses:%/house.sh3d=%/config.json): %/config.json: %/house.sh3d
	@(cd $(EXPORTER_PATH) ; bash $(EXPORTER_SCRIPT) --resolution=0.02 --output=$(dirname $@) $<)
