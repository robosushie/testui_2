import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useBulkMutation: jest.fn(),
  useMutation: jest.fn(),
}));
import apiClients from "../../apiClients";
import { fireEvent, render } from "@testing-library/react";
import { ModelDeploymentDeleteDialog } from "./ModelDeploymentDeleteDialog";
import { ToastNotification } from "oui-react";
import { createStore, Labs, Provider, useBulkMutation, useMutation, useQuery } from "oui-savant";

describe("ModelDeploymentDeleteDialog", () => {
  const modelDeploymentId = "1";
  const displayName = "md name";
  const DELETE_CONFIRMATION_TEXT = displayName;
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockUseQuery: jest.SpyInstance;
  let mockUseBulkMutation: jest.SpyInstance<any>;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockToastNotification: jest.SpyInstance<any>;
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
    props = { modelDeploymentId, closeHandler: mockCloseHandler, refresh: mockRefresh };
    mockUseQuery = useQuery as jest.Mock;
    mockUseBulkMutation = useBulkMutation as jest.Mock;
    mockUseMutation = useMutation as jest.Mock;
    mockToastNotification = jest.spyOn(ToastNotification, "create");
    mockInvoke = jest.fn();
    mockReset = jest.fn();
    mockUseMutation.mockReturnValue({
      invoke: mockInvoke,
      result: { loading: false },
      reset: mockReset,
    });
  });

  describe("loading model deployment info", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({ loading: true });
    });

    it("should request the model deployment info", () => {
      render(
        <Provider store={mockStore}>
          <ModelDeploymentDeleteDialog {...props} />
        </Provider>
      );
      expect(mockUseQuery).toHaveBeenCalledWith({
        method: apiClients.odscApi.getModelDeployment,
        options: {
          args: { modelDeploymentId },
        },
      });
    });

    it("should display the loading spinner", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelDeploymentDeleteDialog {...props} />
        </Provider>
      );
      expect(getByText("actions.loading"));
    });
  });

  describe("when the model deployment has finished loading successfully", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        response: {
          data: { modelDeploymentId, displayName },
        },
      });
    });

    it("should disable the submit button", async () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelDeploymentDeleteDialog {...props} />
        </Provider>
      );

      const submitButton = getByText("modelDeployments.actions.delete");
      expect(submitButton.getAttribute("aria-disabled")).toBeTruthy();
    });

    describe("clicking the delete button", () => {
      describe("with delete confirmation filled", () => {
        beforeEach(() => {
          mockInvoke.mockClear();
          mockReset.mockClear();
        });

        it("should not submit if delete confirmation wasn't filled correctly", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelDeploymentDeleteDialog {...props} />
            </Provider>
          );

          const confirmationInput = getByLabelText("modelDeployments.deleteAgreement");
          mockTextField(confirmationInput, "WRONG_CONFIRMATION");
          const submitButton = getByText("modelDeployments.actions.delete");
          expect(submitButton.getAttribute("aria-disabled")).toBeTruthy();
          submitButton.click();
          expect(mockInvoke).not.toHaveBeenCalled();
        });

        it("should call the mutation reset method if delete confirmation was provided", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelDeploymentDeleteDialog {...props} />
            </Provider>
          );
          const confirmationInput = getByLabelText("modelDeployments.deleteAgreement");
          mockTextField(confirmationInput, DELETE_CONFIRMATION_TEXT);
          getByText("modelDeployments.actions.delete").click();
          expect(mockReset).toHaveBeenCalled();
        });

        it("should call the mutation invoke method if delete confirmation was provided", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <ModelDeploymentDeleteDialog {...props} />
            </Provider>
          );
          const confirmationInput = getByLabelText("modelDeployments.deleteAgreement");
          mockTextField(confirmationInput, DELETE_CONFIRMATION_TEXT);
          getByText("modelDeployments.actions.delete").click();
          expect(mockInvoke).toHaveBeenCalled();
        });
      });
    });
  });

  describe("when the model deployment has errored", () => {
    it("should display the error message", () => {
      const errorMessage = "error-message";

      mockUseQuery.mockReturnValue({
        error: { body: { message: errorMessage } },
      });

      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelDeploymentDeleteDialog {...props} />
        </Provider>
      );

      expect(getByText(errorMessage));
    });
  });

  describe("when the model deployment has logs", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        response: {
          data: { modelDeploymentId, displayName, categoryLogDetails: { access: {}, predict: {} } },
        },
      });
    });

    it("should display a checkbox if there are log entities associated with the modal deployment", () => {
      const { getByLabelText } = render(
        <Provider store={mockStore}>
          <ModelDeploymentDeleteDialog {...props} />
        </Provider>
      );

      const checkbox = getByLabelText("modelDeployments.labels.deleteLogsCheckbox");
      expect(checkbox).toBeTruthy();
    });

    it("should show error text and toast notifications if deleting logs errored", () => {
      mockUseBulkMutation.mockReturnValue({
        invoke: jest.fn(),
        reset: jest.fn(),
        aggregatedResult: { error: true },
        results: [{ errors: [{ error: { body: { message: "error" } } }] }],
      });

      const { getByText, getByLabelText } = render(
        <Provider store={mockStore}>
          <ModelDeploymentDeleteDialog {...props} />
        </Provider>
      );

      const confirmationInput = getByLabelText("modelDeployments.deleteAgreement");
      mockTextField(confirmationInput, DELETE_CONFIRMATION_TEXT);
      // check the checkbox
      const checkbox = getByLabelText("modelDeployments.labels.deleteLogsCheckbox");
      expect(checkbox).toBeTruthy();
      checkbox.click();
      // click submit button
      const submitButton = getByText("modelDeployments.actions.delete");
      expect(submitButton.getAttribute("aria-disabled")).toBeFalsy();
      submitButton.click();
      // show errors
      expect(getByText("modelDeployments.errorMessages.errorDeletingLog")).toBeTruthy();
      expect(mockToastNotification).toBeTruthy();
    });
  });
});

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};
