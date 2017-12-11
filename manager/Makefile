$(info )
$(info ****************** 更新数据 ****************** )
$(info )

PYTHON = C:/Python27/python
BUILD_DATA_SCRIPT = $(pwd)/build-data.py
EXPORTER_PATH = ../exporter
EXPORTER_SCRIPT = export-house.sh

houses := $(find data/organizations -name house.sh3d)

.PHONY: update

update: $(houses:%/house.sh3d=%/config.json) $(houses:%/house.sh3d=%/layers.json)
	@bash update-data.sh

$(houses:%/house.sh3d=%/config.json): %/config.json: %/layers.json %/features.json
	@(cd $(dirname $@) ; $(PYTHON) $(BUILD_DATA_SCRIPT) --layers=layers.json --features=features.json $@)

$(houses:%/house.sh3d=%/layers.json): %/layers.json: %/house.sh3d
	@(cd $(EXPORTER_PATH) ; bash $(EXPORTER_SCRIPT) --resolution=0.02 --output=$(dirname $@) $<)
