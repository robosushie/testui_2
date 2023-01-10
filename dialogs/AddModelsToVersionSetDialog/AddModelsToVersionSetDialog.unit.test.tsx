jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useListingContext: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
  useBulkQuery: jest.fn(),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import {
  createStore,
  Labs,
  Provider,
  Store,
  useBulkQuery,
  useConsoleState,
  useListingContext,
  useListingContextClientConsumer,
  useMutation,
  useQuery,
} from "oui-savant";

import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import * as Messages from "@codegen/Messages";
import * as React from "react";
import { AddModelsToVersionSetDialog } from "./AddModelsToVersionSetDialog";
import apiClients from "../../apiClients";
import { ToastNotification } from "oui-react";
import { act } from "react-dom/test-utils";
import { ModelSummary } from "odsc-client/dist/odsc-client";

const modelSummary: ModelSummary[] = [
  {
    compartmentId: "compartment",
    projectId: "mtocid",
    id: "ocid.id2",
    displayName: "UItesting",
    createdBy: "ocid.user.1",
    timeCreated: Date.now() as unknown as Date,
    lifecycleState: "ACTIVE",
    modelVersionSetName: "test model version set",
    modelVersionSetId: "mvs4",
    versionId: 1,
    versionLabel: "Test",
  },
  {
    compartmentId: "compartment",
    projectId: "project",
    id: "ocid.id3",
    displayName: "UI testing 1",
    createdBy: "ocid.user.1",
    timeCreated: Date.now() as unknown as Date,
    lifecycleState: "ACTIVE",
    modelVersionSetName: "test model version set",
    modelVersionSetId: "mvs3",
    versionId: 2,
    versionLabel: "Test",
  },
  {
    compartmentId: "compartment",
    projectId: "mtocid",
    id: "ocid.id4",
    displayName: "UI testing 1",
    createdBy: "ocid.user.1",
    timeCreated: Date.now() as unknown as Date,
    lifecycleState: "ACTIVE",
    modelVersionSetName: "test model version set",
    modelVersionSetId: "mvs2",
    versionId: 3,
    versionLabel: "Test2",
  },
  {
    compartmentId: "compartment",
    projectId: "mtocid",
    id: "ocid.id5",
    displayName: "UI testing 1",
    createdBy: "ocid.user.1",
    timeCreated: Date.now() as unknown as Date,
    lifecycleState: "ACTIVE",
    modelVersionSetName: "test model version set",
    modelVersionSetId: "mvs1",
    versionId: 4,
    versionLabel: "Test",
  },
];
describe("AddModelToVersionSetDialog", () => {
  const props = {
    activeProjectId: "activeProjectId",
    modelVersionSetId: "mid",
    refresh: jest.fn(),
    closeHandler: jest.fn(),
  };
  let renderResult: any;
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;

  beforeEach(() => {
    jest.clearAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({
      activeCompartment: { id: "ID" },
      compartments: [{ id: "ID", name: "compartmentId" }],
    });

    jest.spyOn(ToastNotification, "create").mockReturnValue();
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
      const mockInvoke = jest.fn();
      (useMutation as jest.Mock).mockReturnValue({ reset: jest.fn(), invoke: mockInvoke });
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: false,
        response: { data: modelSummary },
      });
      (useListingContext as jest.Mock).mockReturnValue({ paging: { pageSize: 1, pageNumber: 1 } });
      (useListingContextClientConsumer as jest.Mock).mockReturnValue({
        page: [],
        pagination: { currentPage: 1 },
      });
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      const { getByText, getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <AddModelsToVersionSetDialog {...props} />
        </Provider>
      );
      const formWrapper = getByOuiTestId("add-model-to-version-set-dialog");
      expect(formWrapper).toBeTruthy();
      const saveButton = getByText(Messages.models.actions.add());
      saveButton.click();
      expect(mockInvoke).toHaveBeenCalledTimes(0);
    });
  });
  it("should display the model list table and throw an error if nothing is selected onSubmit", () => {
    const mockInvoke = jest.fn();
    (useMutation as jest.Mock).mockReturnValue({ reset: jest.fn(), invoke: mockInvoke });
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      error: false,
      response: { data: modelSummary },
    });
    (useListingContext as jest.Mock).mockReturnValue({ paging: { pageSize: 1, pageNumber: 1 } });
    (useListingContextClientConsumer as jest.Mock).mockReturnValue({
      page: modelSummary,
      pagination: { currentPage: 1 },
    });
    (useBulkQuery as jest.Mock).mockReturnValue({
      aggregatedResults: { loading: false },
      results: [
        {
          response: {
            data: {
              id: "ocid.user.1",
              name: "testUser",
            },
          },
        },
      ],
    });

    const renderResult = render(
      <Provider store={mockStore as any}>
        <AddModelsToVersionSetDialog {...props} />
      </Provider>
    );
    const formWrapper = renderResult.getByOuiTestId("add-model-to-version-set-dialog");
    const table = renderResult.getByOuiTestId("listModelsTable");
    const inputCheckBoxes = table.getElementsByClassName("oui-checkbox");
    expect(inputCheckBoxes.length).toBe(5);
    expect(formWrapper).toBeTruthy();
    const saveButton = renderResult.getByText(Messages.models.actions.add());
    saveButton.click();
    expect(renderResult.getByOuiTestId("model-get-error")).toBeTruthy();
    expect(
      renderResult.getByText("models.errorMessages.addModelToMVSDetailsDialog.noModelSelected")
    ).toBeTruthy();
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
            <AddModelsToVersionSetDialog {...props} />
          </Provider>
        );
      });
      expect(renderResult.getByText("errors.generic")).toBeTruthy();
    });

    it("should display an error if submitting data fails", async () => {
      (useMutation as jest.Mock).mockReturnValue({
        reset: jest.fn(),
        invoke: jest.fn(),
        result: { error: { body: { message: "error" } } },
      });
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <AddModelsToVersionSetDialog {...props} />
          </Provider>
        );
      });
      expect(renderResult.getByText("errors.generic")).toBeTruthy();
    });
    it("should display an error if submitting no models", async () => {
      const mockInvoke = jest.fn();
      (useMutation as jest.Mock).mockReturnValue({ reset: jest.fn(), invoke: mockInvoke });
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: false,
        response: { data: modelSummary },
      });
      (useListingContext as jest.Mock).mockReturnValue({ paging: { pageSize: 1, pageNumber: 1 } });
      (useListingContextClientConsumer as jest.Mock).mockReturnValue({
        page: [],
        pagination: { currentPage: 1 },
      });
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      const { getByText, getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <AddModelsToVersionSetDialog {...props} />
        </Provider>
      );
      const formWrapper = getByOuiTestId("add-model-to-version-set-dialog");
      expect(formWrapper).toBeTruthy();
      const saveButton = getByText(Messages.models.actions.add());
      saveButton.click();
      expect(renderResult.getByOuiTestId("model-get-error")).toBeTruthy();
      expect(mockInvoke).toHaveBeenCalledTimes(0);
    });
  });
});
