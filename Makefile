DC := docker compose -f docker-compose.prod.yml
DB_AUTH := -u "$$MONGO_INITDB_ROOT_USERNAME" -p "$$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin

.PHONY: help build up down restart ps logs logs-api logs-web sh-api sh-db deploy backup restore

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-10s %s\n", $$1, $$2}'

build: ## Rebuild images and start the stack
	$(DC) build && $(DC) up -d --remove-orphans

up: ## Start the stack
	$(DC) up -d

down: ## Stop the stack
	$(DC) down

restart: ## Restart containers
	$(DC) restart

ps: ## Container status
	$(DC) ps

logs: ## Follow logs
	$(DC) logs -f

logs-api: ## Follow backend logs
	$(DC) logs -f api

logs-web: ## Follow nginx logs
	$(DC) logs -f web

sh-api: ## Shell in the backend container
	$(DC) exec api sh

sh-db: ## Mongo shell
	$(DC) exec db sh -c 'mongo $(DB_AUTH) tweak'

deploy: ## git pull, rebuild and status
	git pull --ff-only
	$(MAKE) build
	$(DC) ps

backup: ## Dump the database to backups/
	@mkdir -p backups
	$(DC) exec -T db sh -c 'mongodump --quiet --archive --gzip $(DB_AUTH) --db tweak' > backups/tweak_$$(date +%Y%m%d_%H%M%S).archive.gz
	@ls -lh backups | tail -1

restore: ## Replace the database with a dump: make restore FILE=backups/xxx.archive.gz
	@test -n "$(FILE)" || (echo "usage: make restore FILE=backups/xxx.archive.gz" && exit 1)
	$(DC) exec -T db sh -c 'mongorestore --quiet --archive --gzip --drop $(DB_AUTH) --nsInclude "tweak.*"' < $(FILE)
