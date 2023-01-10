/**
 * In the future, oui-savant will ship with some useful mocks for mocking the connector state, etc.
 * This will provide plugin devs with mocks to use in the meantime.
 */

import { createStore, Labs } from "oui-savant";
import * as loomPluginRuntime from "loom-plugin-runtime";
import apiClients from "../src/apiClients";

// Mock Loom Plugin runtime, this allows us to create the connector store against mock apis
const mutateContext = jest.fn();
const getContext = jest.fn();
const onContextChange = jest.fn();
(loomPluginRuntime as any).getContextClient = jest.fn(() => {
  return {
    mutateContext,
    getContext,
    onContextChange,
  };
});

const getCapability = jest.fn();
const onCapabilityChange = jest.fn();
(loomPluginRuntime as any).getCapabilityClient = jest.fn(() => {
  return {
    getCapability,
    onCapabilityChange,
  };
});

const getNavigationTree = jest.fn();
const getSelfNavigationTree = jest.fn(() =>
  Promise.resolve().then(() => ({ text: "Main", children: [] }))
);
const onNavigationTreeChange = jest.fn();
const onSelfNavigationTreeChange = jest.fn();
(loomPluginRuntime as any).getNavigationTreeClient = jest.fn(() => {
  return {
    getNavigationTree,
    getSelfNavigationTree,
    onNavigationTreeChange,
    onSelfNavigationTreeChange,
  };
});

const getCompartments = jest.fn();
const onCompartmentsChange = jest.fn();
(loomPluginRuntime as any).getCompartmentClient = jest.fn(() => {
  return {
    getCompartments,
    onCompartmentsChange,
  };
});

export const mockLoomContext: loomPluginRuntime.ConsoleContext = {
  locale: "en",
  regionId: "SEA",
  compartmentId: "ocid",
  homeRegionId: "SEA",
  userProfile: {
    id: "uxdev",
    displayName: "UX Dev",
    tenantId: "ocid.tenancy",
    tenantName: "uxdev",
    sourceTenantId: "ocid.tenancy",
    sourceTenantName: "uxdev",
    isRegularSignIn: true,
    principalSubType: undefined,
  },
  activeRegionFriendlyName: "Seattle",
  realmName: "Region1",
  isStaging: false,
  isDisconnected: false,
};

export const mockCompartment: loomPluginRuntime.Compartment = {
  id: "123",
  compartmentId: "123",
  name: "Mock Compartment",
  description: "Old desc",
  timeCreated: new Date(Date.UTC(2015, 0)),
  lifecycleState: "ACTIVE",
};

export const mockIdentityToken = {
  aud: "iaas_console",
  exp: 1521152254.572,
  iat: 1521148654.572,
  iss: "authService.oracle.com",
  jti: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "mock",
  nonce: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  scope: "openid",
  st_hash: "aaaaaaaaaaaaaaaaa-aa",
  sub: "ocidv1:user:oc1:phx:1234567891011:bbbbbbbb11111111111111111111111111",
  tenant: "ocidv1:tenancy:oc1:phx:1234567891011:bbbbbbbb11111111111111111111111111",
  tenant_name: "mock",
};

export const testPort = {
  postMessage: (): null => null,
} as any as MessagePort;

export const mockLoom = Labs.MockLoom.createMockLoom();

export const mockConnectorStore = createStore({
  apiClients,
  loomStartData: mockLoom.getLoomStartData(),
  pluginName: "test-plugin",
  reducers: {},
  middleware: [],
});
