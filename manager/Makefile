$(info )
$(info ****************** 更新数据 ****************** )
$(info )

PYTHON = C:/Python27/python

.PHONY: update

update:
	@bash update-data.sh

config.json: layers.json features.json
	@$(PYTHON) build-data.py --layers=layers.json --features=features.json $@

layers.json: house.sh3d
	@$(HOUSE_EXPORTER) --output=layers $<

