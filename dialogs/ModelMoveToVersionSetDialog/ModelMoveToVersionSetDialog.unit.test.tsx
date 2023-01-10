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
import { ModelMoveToVersionSetDialog } from "./ModelMoveToVersionSetDialog";
import apiClients from "../../apiClients";
import { ToastNotification } from "oui-react";
import { act } from "react-dom/test-utils";

describe("ModelMoveToVersionSetDialog", () => {
  const props = {
    activeProjectId: "activeProjectId",
    modelId: "mid",
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
      (useQuery as jest.Mock).mockReturnValueOnce({
        loading: false,
        error: false,
        response: { data: { id: "id" } },
      });
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: false,
        response: { data: [] },
      });
      (useListingContext as jest.Mock).mockImplementation(() => {
        return { paging: { pageSize: 1, pageNumber: 1 } };
      });
      (useListingContextClientConsumer as jest.Mock).mockReturnValue({
        page: [],
        pagination: { currentPage: 1 },
      });
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      const { getByText, getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <ModelMoveToVersionSetDialog {...props} />
        </Provider>
      );
      const formWrapper = getByOuiTestId("move-model-dialog");
      expect(formWrapper).toBeTruthy();
      const saveButton = getByText(Messages.models.actions.add());
      saveButton.click();
      expect(mockInvoke).toHaveBeenCalledTimes(0);
    });
  });
  describe("Loaders", () => {
    it("should display a loader while data submitting", async () => {
      (useMutation as jest.Mock).mockReturnValue({
        reset: jest.fn(),
        invoke: jest.fn(),
        result: { loading: true },
      });
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ModelMoveToVersionSetDialog {...props} />
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
            <ModelMoveToVersionSetDialog {...props} />
          </Provider>
        );
      });
      expect(renderResult.getByOuiTestId("model-get-error")).toBeTruthy();
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
            <ModelMoveToVersionSetDialog {...props} />
          </Provider>
        );
      });
      expect(renderResult.getByOuiTestId("model-edit-error")).toBeTruthy();
    });
  });
});
