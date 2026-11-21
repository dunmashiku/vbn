# Benefits Navigator: local development shortcuts.
# Run `make` (or `make help`) to see the targets.

ENV_FILE     := services/chat/.env
ENV_EXAMPLE  := services/chat/.env.example
WEB_URL      := http://localhost:5173
CHAT_URL     := http://127.0.0.1:8787

.DEFAULT_GOAL := help
.PHONY: help setup install env check-key dev typecheck test eval-rag build preview health stop clean reset

help: ## Show this help
	@echo "Benefits Navigator - local commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-10s %s\n", $$1, $$2}'
	@echo ""
	@echo "First time: make setup, add your key to $(ENV_FILE), then make dev"

setup: install env ## Install dependencies and create services/chat/.env

install: ## Install dependencies with pnpm
	@command -v node >/dev/null || { echo "Node.js 22+ is required: https://nodejs.org"; exit 1; }
	@command -v pnpm >/dev/null || { echo "pnpm is required. Install it with: npm install -g pnpm"; exit 1; }
	pnpm install

env: ## Create services/chat/.env from the example (keeps an existing one)
	@if [ -f $(ENV_FILE) ]; then \
		echo "$(ENV_FILE) already exists, leaving it as is."; \
	else \
		cp $(ENV_EXAMPLE) $(ENV_FILE) && echo "Created $(ENV_FILE). Add your ANTHROPIC_API_KEY to it."; \
	fi

check-key: ## Check that ANTHROPIC_API_KEY is set (never prints the key)
	@if [ -f $(ENV_FILE) ] && grep -Eq '^ANTHROPIC_API_KEY=.+' $(ENV_FILE); then \
		echo "ANTHROPIC_API_KEY is set in $(ENV_FILE)."; \
	else \
		echo "ANTHROPIC_API_KEY is missing. Run 'make env', then add the key to $(ENV_FILE)."; \
		echo "The app still runs without it; only the chat will say the key is missing."; \
	fi

dev: ## Start the web app and chat service (http://localhost:5173)
	@[ -d node_modules ] || $(MAKE) install
	@[ -f $(ENV_FILE) ] || $(MAKE) env
	@$(MAKE) --no-print-directory check-key
	@echo "Opening on $(WEB_URL)  (Ctrl+C to stop)"
	pnpm dev

typecheck: ## Type check all packages
	pnpm typecheck

test: ## Run all Vitest suites
	pnpm test

eval-rag: ## Check retrieval quality on 10 sample questions
	pnpm eval:rag

build: ## Production build of the web app
	pnpm --filter @vbn/web build

preview: build ## Build, then serve the production web build (start `make dev` separately for chat)
	pnpm --filter @vbn/web preview --port 4173

health: ## Check the chat service is running and has an API key
	@curl -fs $(CHAT_URL)/api/health && echo "" || echo "Chat service isn't running. Start it with: make dev"

stop: ## Stop anything still listening on the dev ports (5173, 8787)
	@for p in 5173 8787; do \
		pids=$$(lsof -ti tcp:$$p 2>/dev/null); \
		if [ -n "$$pids" ]; then kill $$pids && echo "Stopped process on port $$p"; else echo "Nothing on port $$p"; fi; \
	done

clean: ## Remove build output
	rm -rf apps/web/dist

reset: clean ## Remove build output and all node_modules (then run make setup)
	rm -rf node_modules apps/*/node_modules services/*/node_modules packages/*/node_modules
