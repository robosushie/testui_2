jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useListingContext: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
  useBulkQuery: jest.fn(),
  useQuery: jest.fn(),
}));
import {
  Provider,
  Labs,
  createStore,
  useListingContextClientConsumer,
  useConsoleState,
  Store,
  useQuery,
  useBulkQuery,
  useListingContext,
} from "oui-savant";
import apiClients from "../../apiClients";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import * as React from "react";
import * as Messages from "@codegen/Messages";
import ListModelVersionSetByCompartment from "./ListModelVersionSetByCompartment";
import { act } from "react-dom/test-utils";
import { ModelVersionSet } from "odsc-client/dist/odsc-client";

const modelVersionSet: ModelVersionSet = {
  id: "ocid1.datasciencemodelversionset.oc1.iad.1",
  compartmentId: "ocid1.compartment.oc1..1",
  projectId: "ocid1.datascienceproject.oc1.iad.1",
  name: "testName",
  description: null,
  lifecycleState: "ACTIVE",
  timeCreated: new Date("2020-12-15T02:05:00.939Z"),
  timeUpdated: new Date("2021-12-15T02:05:00.939Z"),
  createdBy: "ocid1.user.oc1..1",
  freeformTags: {},
  definedTags: {},
};

describe("ListModelVersionSetByCompartment", () => {
  const props = {
    selectedCompartmentId: "cid",
    selectedProjectId: "pid",
    onSelectedModelVersionSetChanged: jest.fn(),
  };
  let renderResult: any;
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;

  beforeEach(() => {
    jest.clearAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({
      activeCompartment: { id: "ID" },
      compartments: [{ id: "ocid1.compartment.oc1..1", name: "compartmentId" }],
    });
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("onSubmit", () => {
    it("should render the dialog", () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: false,
        response: { data: [modelVersionSet] },
      });
      (useListingContext as jest.Mock).mockReturnValue({ paging: { pageSize: 1, pageNumber: 1 } });
      (useListingContextClientConsumer as jest.Mock).mockReturnValue({
        page: 1,
        pagination: 1,
        sortOrder: "",
        setSortOrder: "",
      });
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });
      const { getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <ListModelVersionSetByCompartment {...props} />
        </Provider>
      );
      const table = getByOuiTestId("listTableByCompartment");
      expect(table).toBeTruthy();
    });
  });
  describe("Loaders", () => {
    it("should display a loader while fetching data", async () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: true,
      });
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ListModelVersionSetByCompartment {...props} />
          </Provider>
        );
      });
      expect(renderResult.getByText("actions.loading")).toBeTruthy();
    });
  });
  describe("Errors", () => {
    it("should display an error if fetching data fails", async () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: { body: { message: "error" } },
      });

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ListModelVersionSetByCompartment {...props} />
          </Provider>
        );
      });
      expect(renderResult.getByText(Messages.errors.generic())).toBeTruthy();
    });
  });
});
