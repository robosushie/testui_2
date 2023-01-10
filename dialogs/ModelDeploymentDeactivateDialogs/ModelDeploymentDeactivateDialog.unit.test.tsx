import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import apiClients from "../../apiClients";
import { ModelDeploymentDeactivateDialog } from "./ModelDeploymentDeactivateDialog";
import { render, RenderResult } from "@testing-library/react";
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";

describe("ModelDeploymentDeactivateDialog", () => {
  const modelDeploymentId = "1";
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
    props = { modelDeploymentId, closeHandler: mockCloseHandler, refresh: mockRefresh };
    mockUseQuery = useQuery as jest.Mock;
    mockUseMutation = useMutation as jest.Mock;
  });

  describe("loading model deployment info", () => {
    describe("when loading model deployment", () => {
      it("should display the loading spinner", () => {
        mockUseQuery.mockReturnValue({ loading: true });
        mockUseMutation.mockReturnValue({
          invoke: jest.fn(),
          result: { loading: false },
          reset: jest.fn(),
        });
        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelDeploymentDeactivateDialog {...props} />
          </Provider>
        );
        expect(getByText("actions.loading"));
      });
    });

    describe("when the model deployment has finished loading", () => {
      const displayName = "test-model-deployment";
      let renderResult: RenderResult;

      beforeEach(() => {
        mockUseQuery.mockReturnValue({
          loading: false,
          error: false,
          response: { data: { displayName } },
        });
        mockUseMutation.mockReturnValue({
          invoke: jest.fn(),
          result: { loading: false },
          reset: jest.fn(),
        });
        renderResult = render(
          <Provider store={mockStore}>
            <ModelDeploymentDeactivateDialog {...props} />
          </Provider>
        );
      });

      it("should display the model deployment name", () => {
        expect(renderResult.getByText("modelDeployments.deactivateConfirmation"));
      });

      it("should display the deactivate disclaimer", () => {
        expect(renderResult.getByText("modelDeployments.deactivateDisclaimer"));
      });
    });

    describe("when the model deployment has errored", () => {
      it("should display the returned errorMessage", () => {
        const errorMessage = "error-message";
        mockUseMutation.mockReturnValue({
          invoke: jest.fn(),
          result: { error: { body: { message: "error" } } },
          reset: jest.fn(),
        });

        mockUseQuery.mockReturnValue({
          loading: false,
          error: { body: { message: errorMessage } },
        });
        const { getByText } = render(
          <Provider store={mockStore}>
            <ModelDeploymentDeactivateDialog {...props} />
          </Provider>
        );
        expect(getByText(errorMessage));
      });
    });

    describe("deactivating the model deployment", () => {
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
              <ModelDeploymentDeactivateDialog {...props} />
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
              <ModelDeploymentDeactivateDialog {...props} />
            </Provider>
          );
          const deactivateButton = getByText("actions.deactivate");
          deactivateButton.click();
        });

        it("should call the reset method", () => {
          expect(mockReset).toHaveBeenCalledTimes(1);
        });

        it("should call the invoke method with the correct modelDeploymentId", () => {
          expect(mockInvoke).toHaveBeenCalledWith({ modelDeploymentId });
        });
      });
    });
  });
});
