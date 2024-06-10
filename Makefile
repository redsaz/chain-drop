default: target

all: target
target: target/index.html target/app.css target/app.mjs target/game.mjs target/scenes.mjs target/consts.mjs target/assets/pics target/dist/phaser.js
target/index.html: index.html
	cp -f index.html target/
target/app.css: app.css
	cp -f app.css target/
target/app.mjs: app.mts game.mts scenes.mts consts.mts tsconfig.json
	tsc
	find ./target -iname '*.mjs' -exec sed -Ei 's/from "([^"]*)"/from ".\/\1.mjs"/' '{}' ';'
    
target/assets/pics: assets/pics/background.jpg assets/pics/filled.png assets/pics/joined.png assets/pics/target.png
	cp -Rf assets target/

target/dist/phaser.js: dist/phaser.js dist/phaser.min.js
	cp -Rf dist target/

.PHONY: clean
clean:
	-rm -rf target
	-mkdir target
