install:
	mkdir -p $(HOME)/Library/Application\ Support/xbar/plugins
	chmod +x todoist.5m.ts
	ln -sf $(CURDIR)/todoist.5m.ts $(HOME)/Library/Application\ Support/xbar/plugins/todoist.5m.ts
