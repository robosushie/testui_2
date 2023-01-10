import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import { render, RenderResult } from "@testing-library/react";
import { ModelActivateDialog } from "./ModelActivateDialog";
import apiClients from "../../apiClients";
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";

describe("ModelActivateDialog", () => {
  const modelId = "1";
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockUseQuery: jest.SpyInstance;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockInvoke: jest.Mock;
  let mockReset: jest.Mock;

  beforeEach(() => {
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    mockCloseHandler = jest.fn();
    mockRefresh = jest.fn();
    props = { modelId, closeHandler: mockCloseHandler, refresh: mockRefresh };
    mockUseQuery = useQuery as jest.Mock;
    mockUseMutation = useMutation as jest.Mock;
    mockInvoke = jest.fn();
    mockReset = jest.fn();
    mockUseMutation.mockReturnValue({
      invoke: mockInvoke,
      result: { loading: false },
      reset: mockReset,
    });
  });

  describe("loading model info", () => {
    describe("when loading model", () => {
      it("should display the loading spinner", () => {
        mockUseQuery.mockReturnValue({ loading: true });
        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelActivateDialog {...props} />
          </Provider>
        );
        expect(getByText("actions.loading")).toBeTruthy();
      });
    });

    describe("when the model has finished loading", () => {
      const displayName = "test-model";
      let renderResult: RenderResult;

      beforeEach(() => {
        mockUseQuery.mockReturnValue({
          loading: false,
          error: false,
          response: { data: { displayName } },
        });
        renderResult = render(
          <Provider store={mockStore}>
            <ModelActivateDialog {...props} />
          </Provider>
        );
      });

      it("should display the model name", () => {
        expect(renderResult.getByText("models.activateConfirmation"));
      });

      it("should display the activate disclaimer", () => {
        expect(renderResult.getByText("models.activateDisclaimer"));
      });
    });

    describe("when the model has errored", () => {
      it("should display the returned errorMessage", () => {
        const errorMessage = "error-message";

        mockUseQuery.mockReturnValue({
          loading: false,
          error: {
            body: {
              message: errorMessage,
            },
          },
        });
        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelActivateDialog {...props} />
          </Provider>
        );
        expect(getByText(errorMessage));
      });
    });
  });

  describe("activating model", () => {
    describe("when activate is loading", () => {
      it("should display the loading spinner", () => {
        mockUseQuery.mockReturnValue({ loading: false });
        mockUseMutation.mockReturnValue({
          invoke: jest.fn(),
          result: { loading: true },
          reset: jest.fn(),
        });

        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelActivateDialog {...props} />
          </Provider>
        );
        expect(getByText("actions.loading")).toBeTruthy();
      });
    });

    describe("when the activate button is clicked", () => {
      beforeEach(() => {
        mockInvoke = jest.fn();
        mockReset = jest.fn();
        mockUseQuery.mockReturnValue({ loading: false });
        mockUseMutation.mockReturnValue({
          invoke: mockInvoke,
          result: { loading: false },
          reset: mockReset,
        });
        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelActivateDialog {...props} />
          </Provider>
        );
        const activateButton = getByText("actions.activate");
        activateButton.click();
      });

      it("should call the reset method", () => {
        expect(mockReset).toHaveBeenCalledTimes(1);
      });

      it("should call the invoke method with the correct modelId", () => {
        expect(mockInvoke).toHaveBeenCalledWith({ modelId });
      });
    });
  });
});
