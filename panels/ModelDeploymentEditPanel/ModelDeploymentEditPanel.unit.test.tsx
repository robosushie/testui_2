import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useWhitelist: jest.fn(),
}));
import * as Messages from "@codegen/Messages";
import apiClients from "apiClients";
import { act } from "react-dom/test-utils";
import { render, fireEvent, waitFor } from "../../../unittest/utils/reactTestingLibraryUtils";
import * as formUtils from "../../utils/formUtils";
import { ToastNotification } from "oui-react";
import ModelDeploymentEditPanel from "./ModelDeploymentEditPanel";
import {
  FixedSizeScalingPolicy,
  ModelDeployment,
  ModelDeploymentDeploymentModeEnum,
  SingleModelDeploymentConfigurationDetails,
} from "odsc-client/dist/odsc-client";
import { mockModelDeployment } from "../../../unittest/mocks";
import {
  createStore,
  Labs,
  Provider,
  Store,
  useConsoleState,
  useMutation,
  useQuery,
  useWhitelist,
} from "oui-savant";
import {
  MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST,
  MODEL_DEPLOY_BYOC_WHITELIST,
  MODEL_DEPLOY_FLEX_SHAPE_SUPPORT_WHITELIST,
  MODEL_DEPLOY_STREAMING_WHITELIST,
} from "pluginConstants";
import { when } from "jest-when";

describe("ModelDeploymentEditPanel", () => {
  const props = {
    onClose: jest.fn(),
    refresh: jest.fn(),
    modelDeploymentId: "",
  };
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;
  let renderResult: any;
  let mockValidateField: jest.SpyInstance<any>;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockMutationInvoke: jest.Mock;
  let mockMutationReset: jest.Mock;
  let mockUseWhitelist: jest.SpyInstance;
  const testData = [{ name: "Data", id: "123", displayName: "displayName" }];

  const scalingPolicy: FixedSizeScalingPolicy = {
    policyType: "FIXED_SIZE",
    instanceCount: 1,
  };

  const modelDeploymentConfigurationDetails: SingleModelDeploymentConfigurationDetails = {
    deploymentType: "SINGLE_MODEL",
    modelConfigurationDetails: {
      scalingPolicy,
      modelId: "modelOcid",
      bandwidthMbps: 10,
      instanceConfiguration: {
        instanceShapeName: "",
      },
    },
  };

  const modelDeploymentData: ModelDeployment = {
    modelDeploymentConfigurationDetails,
    id: "",
    timeCreated: new Date(),
    projectId: "",
    compartmentId: "",
    createdBy: "",
    modelDeploymentUrl: "",
    displayName: "name",
    lifecycleState: "ACTIVE",
    deploymentMode: "STREAM_ONLY",
  };

  const displayNameValue = modelDeploymentData.displayName;
  const descriptionValue = "description";

  beforeEach(() => {
    jest.clearAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({ activeCompartmennt: { id: "ID" } });
    jest.spyOn(ToastNotification, "create").mockReturnValue();
    mockValidateField = jest.spyOn(formUtils, "validateField");
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    mockUseMutation = useMutation as jest.Mock;
    mockMutationInvoke = jest.fn();
    mockMutationReset = jest.fn();
    mockUseMutation.mockReturnValue({
      invoke: mockMutationInvoke,
      reset: mockMutationReset,
      result: {},
    });
    mockUseWhitelist = useWhitelist as jest.Mock;
    when(mockUseWhitelist).calledWith(MODEL_DEPLOY_STREAMING_WHITELIST).mockReturnValue([false]);
    when(mockUseWhitelist).calledWith(MODEL_DEPLOY_BYOC_WHITELIST).mockReturnValue([false]);
    when(mockUseWhitelist)
      .calledWith(MODEL_DEPLOY_FLEX_SHAPE_SUPPORT_WHITELIST)
      .mockReturnValue([true]);
    when(mockUseWhitelist)
      .calledWith(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST)
      .mockReturnValue([false]);
  });

  describe("Notifications", () => {
    describe("Errors", () => {
      it("should display a ToastNotification error if fetching data fails", async () => {
        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          error: { body: { message: "error" } },
        });

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });
        expect(ToastNotification.create).toHaveBeenCalled();
      });

      it("should display a ToastNotification if submitting data fails", async () => {
        (useMutation as jest.Mock).mockReturnValue({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { error: { body: { message: "error" } } },
        });
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });
        expect(ToastNotification.create).toHaveBeenCalled();
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
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });
        expect(renderResult.getByText("actions.loading")).toBeTruthy();
      });
    });
  });

  describe("Form Loaded", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      (useConsoleState as jest.Mock).mockReturnValue({ activeCompartmennt: { id: "ID" } });
      jest.spyOn(ToastNotification, "create").mockReturnValue();
      mockValidateField = jest.spyOn(formUtils, "validateField");
      mockLoom = Labs.MockLoom.createMockLoom();
      mockStore = createStore({
        apiClients,
        loomStartData: mockLoom.getLoomStartData(),
        pluginName: "test-plugin",
        reducers: {},
        middleware: [],
      });
    });

    describe("streaming config", () => {
      beforeEach(async () => {
        const deploymentMode: ModelDeploymentDeploymentModeEnum = "STREAM_ONLY";
        const modelDeploymentQueryResult = {
          response: {
            data: mockModelDeployment({ deploymentMode }),
          },
        };

        // Mock modelDeploymentQuery return
        (useQuery as jest.Mock).mockReturnValue(modelDeploymentQueryResult);

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });

        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          error: false,
          response: { data: {} },
        });
      });

      it("should disable the select button for model/logging, but not compute", async () => {
        await waitFor(() => {
          const { getAllByText } = renderResult;
          const [modelSelectButton, computeSelectButton, loggingSelectButton]: HTMLButtonElement[] =
            getAllByText(Messages.modelDeployments.actions.select());
          expect(modelSelectButton.getAttribute("aria-disabled")).toBe("true");
          expect(computeSelectButton.getAttribute("aria-disabled")).toBe("true");
          expect(loggingSelectButton.getAttribute("aria-disabled")).toBe(null);
        });
      });
    });

    describe("https config", () => {
      beforeEach(async () => {
        const deploymentMode: ModelDeploymentDeploymentModeEnum = "HTTPS_ONLY";
        const modelDeploymentQueryResult = {
          response: {
            data: mockModelDeployment({ deploymentMode }),
          },
        };

        // Mock modelDeploymentQuery return
        (useQuery as jest.Mock).mockReturnValue(modelDeploymentQueryResult);

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });

        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          error: false,
          response: { data: {} },
        });
      });

      describe("Validation", () => {
        it("should validate displayName and description on Submit Button click", () => {
          // render
          const { getByText, getByLabelText } = renderResult;

          // fill fields
          mockTextField(getByLabelText("modelDeployments.labels.name"), displayNameValue);
          mockTextField(getByLabelText("modelDeployments.labels.description"), descriptionValue);

          // clear mocks and click submit
          mockValidateField.mockClear();
          expect(mockValidateField).toHaveBeenCalledTimes(0);
          const submitButton = getByText("actions.submit");
          submitButton.click();

          // expects
          expect(mockValidateField).toHaveBeenCalledTimes(10);
          expect(mockValidateField).toHaveBeenCalledWith({
            value: displayNameValue,
            required: false,
            maxLen: 255,
          });
          expect(mockValidateField).toHaveBeenCalledWith({
            value: descriptionValue,
            required: false,
            maxLen: 400,
          });
        });
      });
    });
    describe("feature flag enabled", () => {
      beforeEach(async () => {
        when(mockUseWhitelist)
          .calledWith(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST)
          .mockReturnValue([true]);
        const deploymentMode: ModelDeploymentDeploymentModeEnum = "STREAM_ONLY";
        const modelDeploymentQueryResult = {
          response: {
            data: mockModelDeployment({ deploymentMode }),
          },
        };
        (useQuery as jest.Mock).mockReturnValue(modelDeploymentQueryResult);
      });
      it(" for breeze should show breeze component and instance number field", async () => {
        // render
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });
        renderResult.getByText("modelDeployments.computeTitle");
        renderResult.getByText("modelDeployments.labels.numberOfInstances");
      });
    });
    describe("feature flag disabled", () => {
      beforeEach(async () => {
        when(mockUseWhitelist)
          .calledWith(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST)
          .mockReturnValue([false]);
        const deploymentMode: ModelDeploymentDeploymentModeEnum = "STREAM_ONLY";
        const modelDeploymentQueryResult = {
          response: {
            data: mockModelDeployment({ deploymentMode }),
          },
        };
        (useQuery as jest.Mock).mockReturnValue(modelDeploymentQueryResult);
      });
      it(" for breeze should not show breeze component and instance number field", async () => {
        // render
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });
        renderResult.getByText("modelDeployments.computeTitle");
        expect(renderResult.queryByText("modelDeployments.labels.numberOfInstances")).toBeNull();
      });
    });

    describe("200 Empty MD Shapes Response Error", () => {
      beforeEach(async () => {
        const testResponseFailure = {
          status: 200,
          statusText: "OK",
          ok: true,
          headers: {
            forEach: () => {},
            get: () => {},
          },
        };

        const fakeApiResponseFailure: any = { data: testData, response: testResponseFailure };

        // Mock return
        (useQuery as jest.Mock).mockReturnValue(fakeApiResponseFailure);
        when(mockUseWhitelist)
          .calledWith(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST)
          .mockReturnValue([true]);

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });

        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          error: false,
          response: { data: {} },
        });
      });
      it("should display no shapes when shape query returns no data", async () => {
        renderResult.getByText("modelDeployments.computeTitle");
        const selectedShape = renderResult.getByText("instances.shapes.noShapesWarningTitle");
        expect(selectedShape).not.toBeNull();
        const changeShapeButton = renderResult.getByOuiTestId(
          "change-shape-button"
        ) as HTMLInputElement;
        expect(changeShapeButton.getAttribute("aria-disabled")).toBeTruthy();
      });
    });

    describe("404 Error", () => {
      beforeEach(async () => {
        const testResponseFailure = {
          status: 404,
          statusText: "NOT FOUND",
          ok: false,
          headers: {
            forEach: () => {},
            get: () => {},
          },
        };

        const fakeApiResponseFailure: any = {
          data: testData,
          response: testResponseFailure,
          error: {
            body: {
              message: "Not Found",
            },
          },
        };
        (useQuery as jest.Mock).mockReturnValue(fakeApiResponseFailure);
        when(mockUseWhitelist)
          .calledWith(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST)
          .mockReturnValue([true]);

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });
      });

      it("should show error text if notebook shapes call fails", async () => {
        renderResult.getByText("modelDeployments.computeTitle");
        expect(useQuery).toHaveBeenCalled();
        const notFoundText = renderResult.getAllByText("Not Found") as HTMLInputElement;
        expect(notFoundText).not.toBeNull();
        const changeShapeButton = renderResult.getByOuiTestId(
          "change-shape-button"
        ) as HTMLInputElement;
        expect(changeShapeButton.getAttribute("aria-disabled")).toBeTruthy();
      });
    });

    describe("500 Error", () => {
      beforeEach(async () => {
        const testResponseFailure = {
          status: 500,
          statusText: "Internal Server Error",
          ok: false,
          headers: {
            forEach: () => {},
            get: () => {},
          },
        };

        const fakeApiResponseFailure: any = { data: testData, response: testResponseFailure };
        (useQuery as jest.Mock).mockReturnValue(fakeApiResponseFailure);
        when(mockUseWhitelist)
          .calledWith(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST)
          .mockReturnValue([true]);

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelDeploymentEditPanel {...props} />
            </Provider>
          );
        });
      });

      it("should be loading when notebook shape query is failing", async () => {
        renderResult.getByText("modelDeployments.computeTitle");
        const changeShapeButton = renderResult.getByOuiTestId(
          "change-shape-button"
        ) as HTMLInputElement;
        expect(changeShapeButton.getAttribute("aria-disabled")).toBeTruthy();
      });
    });
  });
});

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};
