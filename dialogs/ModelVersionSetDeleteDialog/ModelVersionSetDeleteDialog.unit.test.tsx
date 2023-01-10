import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";
import { ModelVersionSetDeleteDialog } from "./ModelVersionSetDeleteDialog";
import { render, fireEvent } from "@testing-library/react";
import * as formUtils from "../../utils/formUtils";
import { mockModelVersionSet } from "@unittest/mocks";

describe("ModelVersionSetDeleteDialog", () => {
  const modelVersionSetId = "1";
  const modelVersionSetDisplayName = "modelVersionSetName";
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
    props = { modelVersionSetId, closeHandler: mockCloseHandler, refresh: mockRefresh };
    mockUseQuery = useQuery as jest.Mock;
    mockUseMutation = useMutation as jest.Mock;
  });

  describe("loading model version set info", () => {
    let mockMutationInvoke: jest.Mock;
    let mockMutationReset: jest.Mock;
    beforeEach(() => {
      mockMutationInvoke = jest.fn();
      mockMutationReset = jest.fn();
      mockUseQuery.mockReturnValue({ loading: true });
      mockUseMutation.mockReturnValue({
        invoke: mockMutationInvoke,
        reset: mockMutationReset,
        result: {},
      });
    });

    it("should request the model version info", () => {
      render(
        <Provider store={mockStore}>
          <ModelVersionSetDeleteDialog {...props} />
        </Provider>
      );
      expect(mockUseQuery).toHaveBeenCalledWith({
        method: apiClients.odscApi.getModelVersionSet,
        options: {
          args: { modelVersionSetId: "1" },
          caching: { pollingInterval: 5000, type: "polling" },
        },
      });
    });

    it("should display the loading spinner", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelVersionSetDeleteDialog {...props} />
        </Provider>
      );
      expect(getByText("actions.loading"));
    });
  });

  describe("when the model version has finished loading successfully", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        response: {
          data: mockModelVersionSet({}),
        },
      });
    });

    describe("clicking the delete button", () => {
      let mockValidateField: jest.SpyInstance;
      let mockMutationInvoke: jest.Mock;
      let mockMutationReset: jest.Mock;

      beforeEach(() => {
        mockValidateField = jest.spyOn(formUtils, "validateField");
        mockMutationInvoke = jest.fn();
        mockMutationReset = jest.fn();
        mockUseMutation.mockReturnValue({
          invoke: mockMutationInvoke,
          reset: mockMutationReset,
          result: {},
        });
      });

      it("should validate the form data", () => {
        const { getByLabelText, getByText } = render(
          <Provider store={mockStore}>
            <ModelVersionSetDeleteDialog {...props} />
          </Provider>
        );

        fireEvent.change(getByLabelText("modelVersionSets.deleteAgreement"), {
          target: { value: modelVersionSetDisplayName },
        });

        getByText("actions.delete").click();

        expect(mockValidateField).toHaveBeenCalledWith({
          value: modelVersionSetDisplayName,
          required: true,
          callback: expect.any(Function),
        });
      });

      describe("without delete confirmation filled out", () => {
        it("should not call the mutation reset method", () => {
          const { getByText } = render(
            <Provider store={mockStore}>
              <ModelVersionSetDeleteDialog {...props} />
            </Provider>
          );
          getByText("actions.delete").click();
          expect(mockMutationReset).not.toHaveBeenCalled();
        });

        it("should not call the mutation invoke method", () => {
          const { getByText } = render(
            <Provider store={mockStore}>
              <ModelVersionSetDeleteDialog {...props} />
            </Provider>
          );
          getByText("actions.delete").click();
          expect(mockMutationInvoke).not.toHaveBeenCalled();
        });
      });

      describe("with delete confirmation filled", () => {
        it("should call the mutation reset method", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelVersionSetDeleteDialog {...props} />
            </Provider>
          );

          fireEvent.change(getByLabelText("modelVersionSets.deleteAgreement"), {
            target: { value: "test model version set" },
          });

          getByText("actions.delete").click();
          expect(mockMutationReset).toHaveBeenCalled();
        });

        it("should call the mutation invoke method", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelVersionSetDeleteDialog {...props} />
            </Provider>
          );

          fireEvent.change(getByLabelText("modelVersionSets.deleteAgreement"), {
            target: { value: "test model version set" },
          });

          getByText("actions.delete").click();
          expect(mockMutationInvoke).toBeCalledWith({
            modelVersionSetId: "1",
            isDeleteRelatedModels: false,
          });
          expect(mockMutationInvoke).toHaveBeenCalled();
        });
        it("should delete the related models", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelVersionSetDeleteDialog {...props} />
            </Provider>
          );

          fireEvent.change(getByLabelText("modelVersionSets.deleteAgreement"), {
            target: { value: "test model version set" },
          });
          getByLabelText("modelVersionSets.labels.isDeleteRelatedModels").click();
          getByText("actions.delete").click();

          expect(mockMutationInvoke).toBeCalledWith({
            modelVersionSetId: "1",
            isDeleteRelatedModels: true,
          });
          expect(mockMutationInvoke).toHaveBeenCalled();
        });
      });
    });
  });

  describe("when the model version set has errored", () => {
    it("should display the error message", () => {
      const errorMessage = "error-message";

      mockUseQuery.mockReturnValue({
        error: { body: { message: errorMessage } },
      });

      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelVersionSetDeleteDialog {...props} />
        </Provider>
      );

      expect(getByText(errorMessage));
    });
  });
});
