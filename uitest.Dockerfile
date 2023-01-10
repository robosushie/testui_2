FROM node:9

ARG TEST_HUB
ENV TEST_HUB=${TEST_HUB}
ARG PLUGIN_OVERRIDE
ENV PLUGIN_OVERRIDE=${PLUGIN_OVERRIDE}

COPY ./ /usr/src/app/
WORKDIR /usr/src/app/

RUN chmod +x /usr/src/app/uitest.run.sh
ENTRYPOINT [ "/usr/src/app/uitest.run.sh" ]