TARGETS = target/wasm32-unknown-unknown/release/chaindrop.wasm ../target/chaindrop.wasm

default: all

all: $(TARGETS)

target/wasm32-unknown-unknown/release/chaindrop.wasm: src/lib.rs
	wasm-pack build --target web

../target/chaindrop.wasm: target/wasm32-unknown-unknown/release/chaindrop.wasm
	cp pkg/chaindrop_bg.wasm target/wasm32-unknown-unknown/release/chaindrop.wasm ../target
	cp pkg/chaindrop.js ../target/chaindrop.mjs

.PHONY: clean
clean:
	-rm -rf target pkg
