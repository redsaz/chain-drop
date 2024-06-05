default: target

all: target
target: target/index.html target/app.css target/app.js target/assets/pics target/dist/phaser.js
target/index.html: index.html
	cp -f index.html target/
target/app.css: app.css
	cp -f app.css target/
target/app.js: app.ts
	tsc
    
target/assets/pics: assets/pics/background.jpg assets/pics/filled.png assets/pics/joined.png assets/pics/target.png
	cp -Rf assets target/

target/dist/phaser.js: dist/phaser.js dist/phaser.min.js
	cp -Rf dist target/

.PHONY: clean
clean:
	-rm -rf target
	-mkdir target
