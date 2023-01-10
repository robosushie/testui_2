import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
}));
import apiClients from "../../../apiClients";
import { JobShapeSummary, JobShapeSummaryShapeSeriesEnum } from "odsc-client/dist/odsc-client";
import { JobUtils } from "utils/JobUtils";
import { render, act, fireEvent } from "../../../../unittest/utils/reactTestingLibraryUtils";
import { ShapesTable } from "./ShapesTable";
import { mockJobShapes } from "../../../../unittest/mocks";
import { createStore, Labs, Provider, useConsoleState } from "oui-savant";

describe("ShapesTable", () => {
  const mockJobShapeSummary: JobShapeSummary = {
    name: "FlexShape.E3",
    coreCount: 64,
    memoryInGBs: 1024,
    shapeSeries: "AMD_ROME",
  };
  const mockJobShapesUnitTest: JobShapeSummary[] = mockJobShapes([mockJobShapeSummary]);
  const props = {
    selectedComputeShape: mockJobShapeSummary,
    shapeSeriesToShapesMap: JobUtils.createJobShapeSeriesToShapes(mockJobShapesUnitTest),
    onShapeSelectionUpdate: jest.fn(),
    onShapeConfigurationDetailsUpdate: jest.fn(),
    selectedShapeSeries: mockJobShapeSummary.shapeSeries as JobShapeSummaryShapeSeriesEnum,
  };
  let mockLoom: any = null;
  let mockStore: any = null;
  let renderResult: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({ activeCompartment: { id: "ID" } });

    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  it("should render the shapes table correctly when selected shape is not Flex", async () => {
    props.selectedShapeSeries = mockJobShapesUnitTest[0]
      .shapeSeries as JobShapeSummaryShapeSeriesEnum; // Intel
    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <ShapesTable {...props} />
        </Provider>
      );
    });
    console.log(
      renderResult.container.querySelectorAll("[aria-label='Select row unittestshape']").length
    );
    const { getByText, getByOuiTestId } = renderResult;
    expect(mockJobShapesUnitTest.length).toBe(2);
    const nameColumn = getByText("jobs.labels.shapeName");
    const ocpusColumn = getByText("jobs.labels.numberOCPUs");
    const memoryColumn = getByText("jobs.labels.memoryInGBs");
    const getShapesTable = getByOuiTestId("compute-shapes-table") as HTMLTableElement;

    expect(nameColumn).toBeDefined();
    expect(ocpusColumn).toBeDefined();
    expect(memoryColumn).toBeDefined();
    expect(getShapesTable).toBeDefined();
  });

  it("should call onShapeSelectionUpdate when changing the shape in the table", async () => {
    props.selectedShapeSeries = mockJobShapesUnitTest[0]
      .shapeSeries as JobShapeSummaryShapeSeriesEnum;
    props.selectedComputeShape = mockJobShapesUnitTest[0];
    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <ShapesTable {...props} />
        </Provider>
      );
    });
    const inputCheckBoxs = renderResult.container.querySelectorAll(
      "[aria-label='Select row unittestshape']"
    );
    expect(inputCheckBoxs.length).toBe(1);
    fireEvent.click(inputCheckBoxs[0]);
    expect(props.onShapeSelectionUpdate).toHaveBeenCalled();

    fireEvent.click(inputCheckBoxs[0]);
    expect(props.onShapeSelectionUpdate).toHaveBeenCalled(); // select
  });
});
