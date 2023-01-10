import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import apiClients from "../../apiClients";
import { ModelDeleteDialog } from "./ModelDeleteDialog";
import { render, fireEvent } from "@testing-library/react";
import * as formUtils from "../../utils/formUtils";
import { mockModel } from "../../../unittest/mocks";
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";

describe("ModelDeleteDialog", () => {
  const modelId = "1";
  const modelDisplayName = "modelName";
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockUseQuery: jest.SpyInstance;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockMutationInvoke: jest.Mock;
  let mockMutationReset: jest.Mock;

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
    mockMutationInvoke = jest.fn();
    mockMutationReset = jest.fn();
    mockUseMutation.mockReturnValue({
      invoke: mockMutationInvoke,
      reset: mockMutationReset,
      result: {},
    });
  });

  describe("loading model info", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({ loading: true });
    });

    it("should request the model info", () => {
      render(
        <Provider store={mockStore}>
          <ModelDeleteDialog {...props} />
        </Provider>
      );
      expect(mockUseQuery).toHaveBeenCalledWith({
        method: apiClients.odscApi.getModel,
        options: {
          args: { modelId },
        },
      });
    });

    it("should display the loading spinner", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelDeleteDialog {...props} />
        </Provider>
      );
      expect(getByText("actions.loading"));
    });
  });

  describe("when the model has finished loading successfully", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        response: {
          data: mockModel({}),
        },
      });
    });

    describe("clicking the delete button", () => {
      let mockValidateField: jest.SpyInstance;

      beforeEach(() => {
        mockValidateField = jest.spyOn(formUtils, "validateField");
      });

      it("should validate the form data", () => {
        const { getByLabelText, getByText } = render(
          <Provider store={mockStore}>
            <ModelDeleteDialog {...props} />
          </Provider>
        );

        fireEvent.change(getByLabelText("models.deleteAgreement"), {
          target: { value: modelDisplayName },
        });

        getByText("models.actions.delete").click();

        expect(mockValidateField).toHaveBeenCalledWith({
          value: modelDisplayName,
          required: true,
          callback: expect.any(Function),
        });
      });

      describe("without delete confirmation filled out", () => {
        beforeEach(() => {
          mockMutationInvoke.mockClear();
          mockMutationReset.mockClear();
        });

        it("should not call the mutation reset method", () => {
          const { getByText } = render(
            <Provider store={mockStore}>
              <ModelDeleteDialog {...props} />
            </Provider>
          );
          getByText("models.actions.delete").click();
          expect(mockMutationReset).not.toHaveBeenCalled();
        });

        it("should not call the mutation invoke method", () => {
          const { getByText } = render(
            <Provider store={mockStore}>
              <ModelDeleteDialog {...props} />
            </Provider>
          );
          getByText("models.actions.delete").click();
          expect(mockMutationInvoke).not.toHaveBeenCalled();
        });
      });

      describe("with delete confirmation filled", () => {
        beforeEach(() => {
          mockMutationInvoke.mockClear();
          mockMutationReset.mockClear();
        });

        it("should call the mutation reset method", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelDeleteDialog {...props} />
            </Provider>
          );

          fireEvent.change(getByLabelText("models.deleteAgreement"), {
            target: { value: "test model" },
          });

          getByText("models.actions.delete").click();
          expect(mockMutationReset).toHaveBeenCalled();
        });

        it("should call the mutation invoke method", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelDeleteDialog {...props} />
            </Provider>
          );

          fireEvent.change(getByLabelText("models.deleteAgreement"), {
            target: { value: "test model" },
          });

          getByText("models.actions.delete").click();
          expect(mockMutationInvoke).toHaveBeenCalled();
        });
      });
    });
  });

  describe("when the model has errored", () => {
    it("should display the error message", () => {
      const errorMessage = "error-message";

      mockUseQuery.mockReturnValue({
        error: { body: { message: errorMessage } },
      });

      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelDeleteDialog {...props} />
        </Provider>
      );

      expect(getByText(errorMessage));
    });
  });
});
