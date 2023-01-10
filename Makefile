# ---------------- Variable Constants -----------------

SHELL := bash
SHA := $(shell git rev-parse --short=9 HEAD)
SEMVER := $(shell npm run version -s || cat package.json | jq -r .version)
export VERSION := $(SEMVER)-$(SHA)
export APP := odsc-ui
OCIR_REPO := iad.ocir.io/paasdevdatasc
OCIR_IMAGE := $(OCIR_REPO)/$(APP):$(VERSION)
MASTER_COMMIT_SHA := $(shell curl -H "PRIVATE-TOKEN: $(GITLAB_PERSONAL_ACCESS_TOKEN)" "https://orahub.oraclecorp.com/api/v4/projects/11984/repository/commits/master" | jq -r '.short_id')

# Set these if not already set
HTTP_PROXY ?= http://www-proxy-hqdc.us.oracle.com:80
NO_PROXY ?= oraclecorp.com,grungy.us

# ------------------ Action Targets -------------------

image:
	docker build --build-arg="http_proxy=$(HTTP_PROXY)" --build-arg="no_proxy=$(NO_PROXY)" -t $(APP) .
	docker tag $(APP) $(OCIR_REPO)/$(APP):latest
	docker tag $(APP) $(OCIR_IMAGE)

clean-image:
	docker rmi -f $(APP)
	docker rmi -f $(OCIR_REPO)/$(APP):latest
	docker rmi -f $(OCIR_IMAGE)

release-image:
	docker push $(OCIR_IMAGE)
	docker push $(OCIR_REPO)/$(APP):latest

up:
	docker run -p 8484:8484 $(APP)

chart:
	@env VERSION=$(VERSION) envsubst < "chart/$(APP)/values.yaml.tpl" > "chart/$(APP)/values.yaml"
	@env VERSION=$(VERSION) envsubst < "chart/$(APP)/Chart.yaml.tpl" > "chart/$(APP)/Chart.yaml"
	@helm package chart/$(APP)

release-chart:
	@curl -sSLv -H "X-JFrog-Art-Api: $(ARTIFACTORY_API_KEY)" \
	-T $(APP)-$(VERSION).tgz \
	"https://artifacthub-ui-tip.oraclecorp.com/dsc-helm-local/dsc/$(APP)/$(APP)-$(SEMVER)-$(VERSION).tgz"

release-notification:
	@curl -sSL -H "Private-Token: $(CI_PERSONAL_ACCESS_TOKEN)" \
	-X POST \
	--form "ref=master" \
	--form "token=$(TRIGGER_TOKEN)" \
	--form "variables[COMPONENT]=$(APP)" \
	--form "variables[VERSION]=$(SEMVER)-$(VERSION)" \
	"https://orahub.oraclecorp.com/api/v4/projects/$(PLATFORM_HELM_PROJECT_ID)/trigger/pipeline"

url-wiki-publish:
	@curl --request PUT \
	--data "format=markdown&title=$(ENVIRONMENT) console url&content=[$(ENVIRONMENT) url]($(URL))" \
	--header "Private-Token: $(CI_PERSONAL_ACCESS_TOKEN)" "https://orahub.oraclecorp.com/api/v4/projects/11984/wikis/$(ENVIRONMENT)-console-url"

uitest-config-local:
	tmp=$(mktemp)
	jq '.driverInfo.pluginOverride = "configoverride=%7B%22plugins%22%3A%7B%22data-science%22%3A%7B%22name%22%3A%22data-science%22%2C%22path%22%3A%22%2Fdata-science%22%2C%22url%22%3A%22https%3A%2F%2Flocalhost%3A8484%2Findex.tpl.html%22%2C%22type%22%3A%22Sandbox%22%7D%7D%2C%22navigationTrees%22%3A%7B%7D%2C%22features%22%3A%7B%7D%7D"' \
	uitest/config.uitest.json > "$tmp" && mv "$tmp" uitest/config.uitest.json

uitest-config-integration:
	tmp=$(mktemp)
	jq '.driverInfo.pluginOverride = "configoverride=%7B%22plugins%22%3A%7B%22data-science%22%3A%7B%22name%22%3A%22data-science%22%2C%22path%22%3A%22%2Fdata-science%22%2C%22url%22%3A%22https%3A%2F%2Fobjectstorage.us-ashburn-1.oraclecloud.com%2Fn%2Fpaasdevdatasc%2Fb%2Fodsc-ui%2Fo%2F0.0.0-$(MASTER_COMMIT_SHA)%2Fintegration%2Findex.tpl.html%22%2C%22type%22%3A%22Sandbox%22%7D%7D%2C%22navigationTrees%22%3A%7B%7D%2C%22features%22%3A%7B%7D%7D"' \
	uitest/config.uitest.json > "$tmp" && mv "$tmp" uitest/config.uitest.json

## Perform static analysis using Fortify
fortify:
	@export BUILD_ID=$(VERSION); export APPLICATION_NAME=$(APP); export _JAVA_OPTIONS="-Xmx1024M"; /root/fortify_task/scan.sh
	@sh /root/fortify_task/post-scan-results.sh

.PHONY: chart image clean-image release-image run release-chart release-notification uitest-local uitest-integration
