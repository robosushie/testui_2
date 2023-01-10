SPARTA_DOCKER_URL=odo-docker-local.artifactory.oci.oraclecorp.com
SAMPLE_PLUGIN_ARTIFACT=sample-plugin-service
SAMPLE_PLUGIN_ARTIFACT_LATEST_VERSION=latest
CONTAINER_NAME=sample-plugin-service
UITEST_ARTIFACT=uitest
UITEST_ARTIFACT_VERSION=latest
CONTAINER_IDS=$(shell docker ps -q -a -f "name=$(CONTAINER_NAME)")
PASSWORD?=
PORT=8484

run-sample-plugin-service:
	docker run --name $(CONTAINER_NAME) -d -p $(PORT):$(PORT) --expose $(PORT) -v $(shell pwd)/../:/usr/src/app -w /usr/src/app node:9 /bin/bash -c "yarn && yarn start --host 0.0.0.0 --port $(PORT)"
	sh ./checkPlugin.sh

kill-sample-plugin-service:
ifneq ($(strip $(CONTAINER_IDS)),)
	docker rm -f $(CONTAINER_IDS)
endif

run-uitest:
	docker run -t --rm --net=host -v $(shell pwd)/../:/usr/src/app -w /usr/src/app \
	$(SPARTA_DOCKER_URL)/$(UITEST_ARTIFACT):$(UITEST_ARTIFACT_VERSION) bash -c "yarn install && PASSWORD=$(PASSWORD) yarn uitest"
