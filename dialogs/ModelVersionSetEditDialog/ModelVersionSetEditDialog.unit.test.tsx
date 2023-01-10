import * as React from "react";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";
import * as Messages from "@codegen/Messages";
import { ModelVersionSetEditDialog } from "./ModelVersionSetEditDialog";
import apiClients from "../../apiClients";

describe("ModelVersionSetEditDialog", () => {
  const props = {
    modelVersionSetId: "",
    closeHandler: jest.fn(),
    refresh: jest.fn(),
  };
  let mockLoom: any;
  let mockStore: any;

  beforeEach(() => {
    jest.resetAllMocks();
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      response: { data: { displayName: "TestName" } },
    });
    (useMutation as jest.Mock).mockReturnValue({ result: { loading: false }, response: [] });
  });

  describe("Form test", () => {
    it("should render the dialog", () => {
      const mockInvoke = jest.fn();
      (useMutation as jest.Mock).mockReturnValue({ reset: jest.fn(), invoke: mockInvoke });
      const { getByText, getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetEditDialog {...props} />
        </Provider>
      );
      const formWrapper = getByOuiTestId("edit-model-version-set-dialog");
      expect(formWrapper).toBeTruthy();
      const saveButton = getByText(Messages.actions.saveChanges());
      saveButton.click();
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dialog rendering", () => {
    const errorMessage = "error";

    it("should be in loading state when loading the model version set data", () => {
      (useQuery as jest.Mock).mockReturnValue({ loading: true, response: [] });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetEditDialog {...props} />
        </Provider>
      );
      expect(getByText(Messages.actions.loading())).toBeTruthy();
    });

    it("should be in loading state when loading the result of the last invocation", () => {
      (useMutation as jest.Mock).mockReturnValue({ result: { loading: true } });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetEditDialog {...props} />
        </Provider>
      );
      expect(getByText(Messages.actions.loading())).toBeTruthy();
    });

    it("should display an error message when the last invocation is failing", () => {
      (useMutation as jest.Mock).mockReturnValue({
        result: { error: { body: { message: errorMessage } } },
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetEditDialog {...props} />
        </Provider>
      );
      expect(getByText(errorMessage)).toBeTruthy();
    });

    it("should display an error message when it fails to fetch model version set data", () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: { body: { message: errorMessage } },
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetEditDialog {...props} />
        </Provider>
      );
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });
});
