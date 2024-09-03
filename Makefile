default: all

.PHONY: all
all: targets
.PHONY: rs
targets: rs target
rs:
	cd rs; $(MAKE)
target: target/index.html target/app.css target/app.mjs target/gameboard.mjs target/game.mjs target/scenes.mjs target/controls.mjs target/consts.mjs target/assets/pics target/dist/phaser.js
target/index.html: index.html
	cp -f index.html target/
target/app.css: app.css
	cp -f app.css target/
target/app.mjs: app.mts gameboard.mts game.mts scenes.mts controls.mts consts.mts tsconfig.json
	tsc
	find ./target -iname '*.mjs' -exec sed -Ei 's/from "([^"]*)"/from ".\/\1.mjs"/' '{}' ';'

target/apple-touch-icon.png: apple-touch-icon.png
target/browserconfig.xml: browserconfig.xml
target/favicon-16x16.png: favicon-16x16.png
target/favicon-32x32.png: favicon-32x32.png
target/favicon.ico: favicon.ico
target/mstile-150x150.png: mstile-150x150.png
target/safari-pinned-tab.svg: safari-pinned-tab.svg
target/site.webmanifest: site.webmanifest

target/assets/pics: assets/pics/background.jpg assets/pics/filled.png assets/pics/joined.png assets/pics/target.png
	cp -Rf assets target/

target/dist/phaser.js: dist/phaser.js dist/phaser.min.js
	cp -Rf dist target/

.PHONY: clean
clean:
	-rm -rf target
	-mkdir target
	-cd rs; $(MAKE) clean
