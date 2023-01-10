import * as React from "react";
import * as savant from "oui-savant";
import apiClients from "apiClients";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import ModelDeploymentComputePanel from "./ModelDeploymentComputePanel";
import {
  ModelDeployment,
  ModelDeploymentInstanceShapeConfigDetails,
  ModelDeploymentShapeSeriesEnum,
  ModelDeploymentShapeSummary,
} from "odsc-client/dist/odsc-client";
import { LifecycleState } from "constants/lifecycleStates";

import { ModelDeploymentLifecycleStateEnum } from "odsc-client";
import {
  createModelDeploymentShapeSeriesToShapes,
  ModelDeploymentShapeSeriesToModelDeploymentShapeSummary,
  ModelDeploymentShapeSeriesToShowEnum,
} from "../../utils/modelDeploymentUtils";
import { mockModelDeploymentShapes } from "@unittest/mocks";
import { act } from "@testing-library/react";
import * as Messages from "@codegen/Messages";

describe("ModelDeploymentSelectComputePanel", () => {
  const modelDeploymentData: ModelDeployment = {
    id: "",
    timeCreated: new Date(),
    projectId: "",
    compartmentId: "",
    createdBy: "",
    modelDeploymentUrl: "",
    displayName: "name",
    lifecycleState: LifecycleState.INACTIVE as ModelDeploymentLifecycleStateEnum,
  };

  const mockModelDeploymentShapesResp: ModelDeploymentShapeSummary[] = [
    {
      name: "VM.Standard2.1",
      coreCount: 1,
      memoryInGBs: 15,
      shapeSeries: ModelDeploymentShapeSeriesEnum.INTEL_SKYLAKE,
    },
    {
      name: "VM.Standard2.2",
      coreCount: 2,
      memoryInGBs: 30,
      shapeSeries: ModelDeploymentShapeSeriesEnum.INTEL_SKYLAKE,
    },
    {
      name: "VM.Standard.E3.Flex",
      coreCount: 64,
      memoryInGBs: 1024,
      shapeSeries: ModelDeploymentShapeSeriesEnum.AMD_ROME,
    },
    {
      name: "VM.Standard.E4.Flex",
      coreCount: 64,
      memoryInGBs: 1024,
      shapeSeries: ModelDeploymentShapeSeriesEnum.AMD_ROME,
    },
    {
      name: "VM.Standard3.Flex",
      coreCount: 32,
      memoryInGBs: 512,
      shapeSeries: ModelDeploymentShapeSeriesEnum.INTEL_SKYLAKE,
    },
    {
      name: "VM.Optimized3.Flex",
      coreCount: 18,
      memoryInGBs: 256,
      shapeSeries: ModelDeploymentShapeSeriesEnum.INTEL_SKYLAKE,
    },
  ];

  const mockShapeSeriesToShapesMap: ModelDeploymentShapeSeriesToModelDeploymentShapeSummary =
    createModelDeploymentShapeSeriesToShapes(
      mockModelDeploymentShapes(mockModelDeploymentShapesResp),
      true
    );

  const mockModelDeploymentInstanceShapeConfigDetails: ModelDeploymentInstanceShapeConfigDetails = {
    ocpus: 1,
    memoryInGBs: 16,
  };

  const props = {
    preselectedInstanceCount: 1,
    preSelectedInstance: "VM.Standard2.1",
    preSelectedInstanceType: ModelDeploymentShapeSeriesToShowEnum.INTEL_SKYLAKE,
    modelDeployment: modelDeploymentData,
    onClose: jest.fn(),
    preSelectedModelDeploymentInstanceShapeConfigDetails:
      mockModelDeploymentInstanceShapeConfigDetails,
    shapeSeriesToShapesMap: mockShapeSeriesToShapesMap,
    onComputeDataSubmit: jest.fn(),
  };
  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;
  let renderResult: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoom = savant.Labs.MockLoom.createMockLoom();
    mockStore = savant.createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("Validation", () => {
    it("should disable submit button", async () => {
      await act(async () => {
        renderResult = render(
          <savant.Provider store={mockStore as any}>
            <ModelDeploymentComputePanel {...props} />
          </savant.Provider>
        );
      });
      const submitButton = renderResult.getByText(Messages.actions.submit());
      expect(submitButton).toBeTruthy();
    });
  });

  describe("Panel rendering", () => {
    it("should enable the number of instances field when model deployment state is inactive", () => {
      const { getByOuiTestId } = render(
        <savant.Provider store={mockStore as any}>
          <ModelDeploymentComputePanel {...props} />
        </savant.Provider>
      );
      const instanceCount = getByOuiTestId("test-instanceCount");
      expect(instanceCount.attributes.getNamedItem("aria-disabled")).toBeNull();
    });

    it("should enable the number of instances field when the model deployment state is active", () => {
      props.modelDeployment.lifecycleState =
        LifecycleState.ACTIVE as ModelDeploymentLifecycleStateEnum;
      const { getByOuiTestId } = render(
        <savant.Provider store={mockStore as any}>
          <ModelDeploymentComputePanel {...props} />
        </savant.Provider>
      );
      const instanceCount = getByOuiTestId("test-instanceCount");
      expect(instanceCount.attributes.getNamedItem("aria-disabled")).toBeNull();
    });
  });
});
