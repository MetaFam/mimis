# ToDo: Pull from manifest
ICON_SIZES = 16 48 128
icons = $(foreach size, $(ICON_SIZES), icon/$(size)/png)

all: crx

icon/%/png: logo/svg
	mkdir -p "$(@D)"
	# When given dir/png as an output location, batik creates dir/png/svg.png
	rasterize -m image/png -w "$*" -h "$*" -d "$(@D)/tmp.png" "$<"
	mv "$(@D)/tmp.png" "$@"

# manifest.json: manifest/json
#	# ToDo: Make this work
#	json -e "$.version += '@' + git.version" "$<" > "$@"

crx: $(icons) manifest.json $(shell find -name jquery -or -name js -or -name html)
	mkcrx . key/signing/pem
