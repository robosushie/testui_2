import { DataScienceApi } from "odsc-client";
import { IdentityApi } from "identity-control-plane-api-client";
import { ComputeApi, VirtualNetworkApi } from "coreservices-api-client";
import {
  BaseApiConfig,
  CombinedState,
  createApiClients,
  createClientConfigMap,
  Store,
} from "oui-savant";
import { LoggingManagementApi } from "@clients/async-public-api";
import { DS_NON_PROD_ENDPOINT, FS_ENDPOINT } from "pluginConstants";
import { ResourceSearchApi } from "rqs-api-client";
import { StreamAdminApi } from "streaming-api-client";
import { ArtifactsApi } from "../gen/clients/artifacts-api-client";
import { ObjectStorageApi } from "object-storage-api-client";
import { FeatureStoreApi } from "fs-client";

const VERSION_IDENTTY = "20160918";
const VERSION_CORE = "20160918";
const VERSION_ASYNC_PUBLIC_LOGGING = "20200531";
export const VERSION_ODSC = "20190101";
const SEARCH_API_CONFIG_KEY = "query";
const VERSION_SEARCH = "20180409";
const VERSION_STREAMING = "20180418";
export const VERSION_ARTIFACTS = "20160918";

export const getApiOverrideEndpoint = (store: Store<CombinedState>) => {
  const {
    globalState: { capabilities },
  } = store.getState();

  if (capabilities && capabilities[DS_NON_PROD_ENDPOINT]) {
    return capabilities[DS_NON_PROD_ENDPOINT].toString();
  }
  return undefined;
};

export const getFSApiOverrideEndpoint = (store: Store<CombinedState>) => {
  const {
    globalState: { capabilities },
  } = store.getState();

  if (capabilities && capabilities[FS_ENDPOINT]) {
    return capabilities[FS_ENDPOINT].toString();
  }
  return undefined;
};

// export const getFSJWT = (store: Store<CombinedState>) => {
//   const {
//     globalState: { capabilities },
//   } = store.getState();
//
//   if (capabilities && capabilities[JWT]) {
//     return capabilities[JWT].toString();
//   }
//   return undefined;
// };

// Maps api client names to their class and config group in the duplo-api-clients config
// There are two different ways to specify client configuration: LegacyApiConfig & EndpointTemplateApiConfig
// The options depend on how the client was generated and what was in the spec.
// To learn more about ApiClients: https://objectstorage.us-phoenix-1.oraclecloud.com/n/uxdev/b/oui-savant-showcase/o/latest/index.html#/connector/api-clients
const apiMap = createClientConfigMap({
  // In order to use the TemplateApiConfig the following requirements must be met:
  // 1. Spec must include both x-obmcs-endpoint-template and basePath
  // 2. Client must have been generated with the savant-client-generator. duplo-api-clients will not suport this.
  // The DataScienceApi can take advantage of the simplified configuration because it meets these reqs.
  odscApi: {
    class: DataScienceApi,
    overrideEndpoint: (store) => getApiOverrideEndpoint(store),
  },
  // For the VirtualNetworkApi, we use the LegacyApiConfig.
  virtualNetworkApi: {
    class: VirtualNetworkApi,
    // Note: this was added to mitigate the "ERR_CERT_AUTHORITY_INVALID" error
    // when retrieving instances using configKey: "core".
    // Should be changed iaas to core when no ERR_CERT_AUTHORITY_INVALID error.
    configKey: "iaas",
    version: VERSION_CORE,
    overrideEndpoint: process.env.NETWORKING_HOST || undefined,
  },
  asyncLoggingApi: {
    class: LoggingManagementApi,
    configKey: "logging",
    version: VERSION_ASYNC_PUBLIC_LOGGING,
    serviceEndpointFormat: "https://logging.{region}.oci.{secondLevelDomain}/{version}",
  },
  resourceSearchApi: {
    class: ResourceSearchApi,
    configKey: SEARCH_API_CONFIG_KEY,
    version: VERSION_SEARCH,
    overrideEndpoint: process.env.RESOURCE_SEARCH_HOST || undefined,
  },
  streamApi: {
    class: StreamAdminApi,
    configKey: "streaming",
    version: VERSION_STREAMING,
    serviceEndpointFormat: "https://streaming.{region}.oci.{secondLevelDomain}/{version}",
  },
  artifactsApi: {
    class: ArtifactsApi,
    configKey: "artifacts",
    version: VERSION_ARTIFACTS,
  },
  objectStorageApi: {
    class: ObjectStorageApi,
    configKey: "objectstorage",
    version: "",
  },
  computeApi: {
    class: ComputeApi,
    configKey: "iaas",
    version: "20160918",
  },
  fsApi: {
    class: FeatureStoreApi,
    overrideEndpoint: (store) => getFSApiOverrideEndpoint(store),
  },
});

// Maps home region only api client names to their class and config group
// Important: `identityApi` is required for tagging functionality to work within your plugin
const homeRegionApiMap = createClientConfigMap({
  identityApi: {
    class: IdentityApi,
    configKey: "identity",
    version: VERSION_IDENTTY,
    overrideEndpoint: process.env.IDENTITY_HOST || undefined,
  },
});

// const containerApiMap = createClientConfigMap({
//   fsApiContainer: {
//     class: FeatureStoreApi,
//     overrideEndpoint: (store)=> getFSApiOverrideEndpoint(store)
//   },
// })
const baseApiConfig: BaseApiConfig = {
  requestInterceptors: [
    (request: Request) => {
      return new Promise<Request>((resolve, _) => {
        if (request.url.search("/20230101/") > -1) {
          const url = new URL(request.url);
          request.headers.append(
            "path",
            request.method.toLowerCase() + " " + url.pathname + url.search
          );
        }
        resolve(request);
      });
    },
  ],
};
// learn about ApiClients: https://objectstorage.us-phoenix-1.oraclecloud.com/n/uxdev/b/oui-savant-showcase/o/latest/index.html#/connector/api-clients

export default createApiClients({
  baseApiConfig,
  regionalMap: apiMap,
  homeRegionMap: homeRegionApiMap,
});
