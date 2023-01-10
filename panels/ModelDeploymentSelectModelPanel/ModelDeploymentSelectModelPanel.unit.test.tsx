import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useListingContext: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
  useQuery: jest.fn(),
  useBulkQuery: jest.fn(),
}));
import { act } from "react-dom/test-utils";
import apiClients from "apiClients";
import { render, fireEvent } from "../../../unittest/utils/reactTestingLibraryUtils";
import { Model } from "odsc-client/dist/odsc-client";
import * as reduxHook from "redux-react-hook";
import { mockModel } from "../../../unittest/mocks";
import * as Messages from "@codegen/Messages";
import {
  createStore,
  Filters,
  Labs,
  Provider,
  Store,
  useBulkQuery,
  useConsoleState,
  useListingContext,
  useListingContextClientConsumer,
  useQuery,
} from "oui-savant";
import ModelDeploymentSelectModelPanel from "./ModelDeploymentSelectModelPanel";

describe("Model Deployment Select Model Panel", () => {
  beforeAll(() => {
    jest.spyOn(reduxHook, "useDispatch").mockReturnValue({});
    (useConsoleState as jest.Mock).mockReturnValue({ activeCompartment: "compartment" });
    jest.spyOn(Filters.LifecycleStateFilter, "useState").mockReturnValue("");
    (useListingContext as jest.Mock).mockReturnValue({ paging: { pageSize: 1, pageNumber: 1 } });
    (useListingContextClientConsumer as jest.Mock).mockReturnValue({
      page: 1,
      pagination: 1,
      sortOrder: "",
      setSortOrder: "",
    });
  });

  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;
  let renderResult: any;
  const onClose = jest.fn();
  const onModelDataSubmit = jest.fn();

  const model: Model = {
    id: "ocid1.datasciencemodel.oc1.iad.1",
    compartmentId: "ocid1.compartment.oc1..1",
    projectId: "ocid1.datascienceproject.oc1.iad.1",
    displayName: "testName",
    description: null,
    lifecycleState: "ACTIVE",
    timeCreated: new Date("2020-12-15T02:05:00.939Z"),
    createdBy: "ocid1.user.oc1..1",
    freeformTags: {},
    definedTags: {},
    modelVersionSetId: "",
    modelVersionSetName: "",
    versionLabel: "",
    versionId: 1,
  };

  mockLoom = Labs.MockLoom.createMockLoom();
  mockStore = createStore({
    apiClients,
    loomStartData: mockLoom.getLoomStartData(),
    pluginName: "test-plugin",
    reducers: {},
    middleware: [],
  });

  describe("Search by OCID", () => {
    const renderAndClickOcid = async () => {
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ModelDeploymentSelectModelPanel
              preselectedModel={mockModel({})}
              onClose={onClose}
              onModelDataSubmit={onModelDataSubmit}
            />
          </Provider>
        );
      });
      const radioButton2 = renderResult.getByText(
        Messages.modelDeployments.selectPanes.modelSelect.labels.SelectUsingOCID()
      );
      fireEvent.click(radioButton2);
    };

    it("should disable the Search and Submit buttons when there is no modelId in SearchInput", async () => {
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({ loading: true });

      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      await renderAndClickOcid();
      const searchButton = renderResult.getByOuiTestId("searchButton");
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      const submitButton = renderResult.getByOuiTestId("submitButton");
      expect(submitButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
    });

    it("should enable the Search Button when OCID entered", async () => {
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({ loading: true });

      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      await renderAndClickOcid();

      const searchField = renderResult.getByOuiTestId("searchModelOCID");
      const searchButton = renderResult.getByOuiTestId("searchButton");
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.change(searchField, {
        target: {
          value: "ocid1.datasciencemodel.oc1.iad.1",
        },
      });
      expect(searchButton.attributes.getNamedItem("aria-disabled")).toBeNull();
    });

    it("should disable Submit Button if entered model doesn't exist", async () => {
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({ loading: false, error: { status: 404 } });
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      await renderAndClickOcid();

      const searchButton = renderResult.getByOuiTestId("searchButton");
      const submitButton = renderResult.getByOuiTestId("submitButton");
      const searchField = renderResult.getByOuiTestId("searchModelOCID");

      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      expect(submitButton.attributes.getNamedItem("aria-disabled").value).toBe("true");

      fireEvent.change(searchField, {
        target: {
          value: "ocid1.datasciencemodel.oc1.iad.1",
        },
      });

      expect(searchButton.attributes.getNamedItem("aria-disabled")).toBeNull();
      expect(submitButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.click(searchButton);
      expect(renderResult.getByText("modelDeployments.errorMessages.notFound")).toBeTruthy();
      expect(submitButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
    });

    it("Should disable the Search Button if OCID wasn't found", async () => {
      await renderAndClickOcid();

      const searchField = renderResult.getByOuiTestId("searchModelOCID");
      const searchButton = renderResult.getByOuiTestId("searchButton");
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.change(searchField, {
        target: {
          value: "ocid1.oc1.iad.1",
        },
      });
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
    });

    it("should render table if OCID exists", async () => {
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false },
        results: [
          {
            response: {
              data: {
                id: "ocid1.user.oc1..1",
                name: "testUser",
              },
            },
          },
        ],
      });
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({
        loading: false,
        response: {
          data: [model],
        },
      });
      (useListingContextClientConsumer as jest.Mock).mockReturnValue({
        page: [model],
        pagination: { currentPage: 1 },
      });

      await renderAndClickOcid();

      const searchField = renderResult.getByOuiTestId("searchModelOCID");
      const searchButton = renderResult.getByOuiTestId("searchButton");
      const submitButton = renderResult.getByOuiTestId("submitButton");
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      expect(submitButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.change(searchField, {
        target: {
          value: "ocid1.datasciencemodel.oc1.iad.1",
        },
      });
      expect(searchButton.attributes.getNamedItem("aria-disabled")).toBeNull();
      expect(submitButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.click(searchButton);
      expect(renderResult.getByText("testName")).toBeTruthy();
    });
  });

  describe("Search by Compartment if data loads", () => {
    beforeEach(async () => {
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({
        loading: false,
        errors: false,
        response: {
          data: [model],
        },
      });
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ModelDeploymentSelectModelPanel
              preselectedModel={mockModel({})}
              onClose={onClose}
              onModelDataSubmit={onModelDataSubmit}
            />
          </Provider>
        );
      });
    });

    it("should render compartmentSelect, projectSelect and models table", () => {
      const compartmentSelect = renderResult.getByOuiTestId("compartmentSelect");
      expect(compartmentSelect).toBeTruthy();
      const projectSelect = renderResult.getByOuiTestId("project-select");
      expect(projectSelect).toBeTruthy();
      const tableHeader = renderResult.getByText("models.labels.name");
      expect(tableHeader).toBeTruthy();
    });
  });

  describe("Search by Compartment if data loading error", () => {
    beforeEach(async () => {
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({
        loading: false,
        error: {},
      });
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ModelDeploymentSelectModelPanel
              preselectedModel={mockModel({})}
              onClose={onClose}
              onModelDataSubmit={onModelDataSubmit}
            />
          </Provider>
        );
      });
    });

    it("should render compartmentSelect, projectSelect and error message", () => {
      const compartmentSelect = renderResult.getByOuiTestId("compartmentSelect");
      expect(compartmentSelect).toBeTruthy();
      const projectSelect = renderResult.getByOuiTestId("project-select");
      expect(projectSelect).toBeTruthy();
      const errors = renderResult.getByText("errors.generic");
      expect(errors).toBeTruthy();
    });
  });
});
