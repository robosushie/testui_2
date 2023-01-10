import * as React from "react";
import * as savant from "oui-savant";
import apiClients from "apiClients";
import { render } from "../../../../unittest/utils/reactTestingLibraryUtils";
import ListShapes from "./ListShapes";
import {
  ModelDeploymentInstanceShapeConfigDetails,
  ModelDeploymentShapeSeriesEnum,
  ModelDeploymentShapeSummary,
} from "odsc-client/dist/odsc-client";
import {
  createModelDeploymentShapeSeriesToShapes,
  ModelDeploymentShapeSeriesToShowEnum,
} from "../../../utils/modelDeploymentUtils";
import { mockModelDeploymentShapes } from "@unittest/mocks";

describe("ListShapes", () => {
  const mockModelDeploymentShapeSummary: ModelDeploymentShapeSummary[] = [
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

  const mockModelDeploymentInstanceShapeConfigDetails: ModelDeploymentInstanceShapeConfigDetails = {
    ocpus: 1,
    memoryInGBs: 16,
  };

  const mockModelDeploymentShapesUnitTest: ModelDeploymentShapeSummary[] =
    mockModelDeploymentShapes(mockModelDeploymentShapeSummary);

  const props = {
    selectedComputeShape: "VM.Standard.2.1",
    flexShapeConfigDetails: mockModelDeploymentInstanceShapeConfigDetails,
    shapeSeriesToShapesMap: createModelDeploymentShapeSeriesToShapes(
      mockModelDeploymentShapesUnitTest,
      true
    ),
    onShapeSelectionUpdate: jest.fn(),
    onShapeConfigurationDetailsUpdate: jest.fn(),
    selectedShapeSeries: ModelDeploymentShapeSeriesToShowEnum.PREV_GEN,
  };
  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;
  // let renderResult: any;

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

  it("should render the shape table when Standard shape is selected", async () => {
    const { getByOuiTestId } = render(
      <savant.Provider store={mockStore as any}>
        <ListShapes {...props} />
      </savant.Provider>
    );
    // expects
    expect(getByOuiTestId("list-vm-shapes")).toBeTruthy();
  });

  it("should render the shape table when flex shape is selected", async () => {
    const flexProps = props;
    flexProps.selectedComputeShape = "VM.Standard.E3.Flex";
    flexProps.selectedShapeSeries = ModelDeploymentShapeSeriesToShowEnum.AMD_ROME;
    const { getByOuiTestId } = render(
      <savant.Provider store={mockStore as any}>
        <ListShapes {...flexProps} />
      </savant.Provider>
    );
    // expects
    expect(getByOuiTestId("list-flex-vm-shapes")).toBeTruthy();
  });
});
