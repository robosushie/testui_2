import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import apiClients from "../../apiClients";
import { ModelDeactivateDialog } from "./ModelDeactivateDialog";
import { render, RenderResult } from "@testing-library/react";
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";

describe("ModelDeactivateDialog", () => {
  const modelId = "1";
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockUseQuery: jest.SpyInstance;
  let mockUseMutation: jest.SpyInstance<any>;

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
    mockUseMutation.mockReturnValue({
      invoke: jest.fn(),
      result: { loading: false },
      reset: jest.fn(),
    });
  });

  describe("loading model info", () => {
    describe("when loading model", () => {
      it("should display the loading spinner", () => {
        mockUseQuery.mockReturnValue({ loading: true });
        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelDeactivateDialog {...props} />
          </Provider>
        );
        expect(getByText("actions.loading"));
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
            <ModelDeactivateDialog {...props} />
          </Provider>
        );
      });

      it("should display the model name", () => {
        expect(renderResult.getByText("models.deactivateConfirmation"));
      });

      it("should display the deactivate disclaimer", () => {
        expect(renderResult.getByText("models.deactivateDisclaimer"));
      });
    });

    describe("when the model has errored", () => {
      it("should display the returned errorMessage", () => {
        const errorMessage = "error-message";

        mockUseQuery.mockReturnValue({
          loading: false,
          error: { body: { message: errorMessage } },
        });
        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelDeactivateDialog {...props} />
          </Provider>
        );
        expect(getByText(errorMessage));
      });
    });

    describe("deactivating the model", () => {
      describe("when deactivate is loading", () => {
        it("should display the loading spinner", () => {
          mockUseQuery.mockReturnValue({ loading: false });
          mockUseMutation.mockReturnValue({
            invoke: jest.fn(),
            result: { loading: true },
            reset: jest.fn(),
          });

          const { getByText } = render(
            <Provider store={mockStore}>
              <ModelDeactivateDialog {...props} />
            </Provider>
          );
          expect(getByText("actions.loading")).toBeTruthy();
        });
      });

      describe("when the deactivate button is clicked", () => {
        let mockInvoke: jest.Mock;
        let mockReset: jest.Mock;

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
              <ModelDeactivateDialog {...props} />
            </Provider>
          );
          const deactivateButton = getByText("actions.deactivate");
          deactivateButton.click();
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
});
