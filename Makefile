.PHONY: test dev engine bench perft

test:
	npm test

dev:
	npm run dev

engine:
	npm run engine

bench:
	npm run bench

perft:
	node src/cli.js perft 4

cli-eval:
	node src/cli.js eval
