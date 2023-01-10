import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useListingContext: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
  useBulkQuery: jest.fn(),
  useQuery: jest.fn(),
  useWhitelist: jest.fn(),
}));

import { ModelDeploymentInstanceShapeConfigDetails } from "odsc-client/dist/odsc-client";
import apiClients from "apiClients";
import { render, act, fireEvent } from "@unittest/utils/reactTestingLibraryUtils";
import { FlexShapeSlider } from "./FlexShapeSlider";
import { Form } from "oui-react";
import {
  DEFAULT_MEMORY_PER_OCPU_MD,
  FLEX_SLIDER_MEMORY_FIELD_NAME,
  FLEX_SLIDER_OCPUS_FIELD_NAME,
} from "../../../utils/flexShapeUtil";
import { createStore, Provider, useConsoleState, Labs } from "oui-savant";

describe("FlexShapeSlider", () => {
  const mockModelDeploymentInstanceShapeConfigDetails: ModelDeploymentInstanceShapeConfigDetails = {
    ocpus: 1,
    memoryInGBs: 16,
  };

  const mockShapeDetails: ModelDeploymentInstanceShapeConfigDetails = {
    ocpus: 16,
    memoryInGBs: 64,
  };

  const props = {
    computeShape: "VM.Standard.E4.Flex",
    shapeConfigurationDetails: mockModelDeploymentInstanceShapeConfigDetails,
    shapeDetails: mockShapeDetails,
    onChange: jest.fn(),
  };

  let mockLoom: any = null;
  let mockStore: any = null;
  let renderResult: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({ activeCompartment: "compartment" });

    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  it("should render the ocpu and memory sliders with number inputs", async () => {
    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <FlexShapeSlider {...props} />
        </Provider>
      );
    });
    const { getByOuiTestId } = renderResult;
    const ocpuNumberInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_OCPUS_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;
    const memoryInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_MEMORY_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;

    expect(renderResult.container.getElementsByClassName("rc-slider").length).toBe(2); // 2 sliders
    expect(ocpuNumberInput).toBeTruthy();
    expect(memoryInput).toBeTruthy();
  });

  it("should change ocpu to new value and automatically set memory to new value to 16 fold", async () => {
    jest.useFakeTimers();
    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <Form>
            <FlexShapeSlider {...props} />
          </Form>
        </Provider>
      );
    });

    const { getByOuiTestId } = renderResult;
    const ocpuNumberInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_OCPUS_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;
    const memoryInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_MEMORY_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;

    // initial values
    expect(ocpuNumberInput.value).toBe(
      mockModelDeploymentInstanceShapeConfigDetails.ocpus.toString()
    );
    expect(memoryInput.value).toBe(
      mockModelDeploymentInstanceShapeConfigDetails.memoryInGBs.toString()
    );

    // trigger the change in ocpu
    fireEvent.change(ocpuNumberInput, { target: { value: 3 } });

    setTimeout(() => {
      expect(props.onChange).toHaveBeenCalledWith(
        3,
        DEFAULT_MEMORY_PER_OCPU_MD * 3,
        props.computeShape
      );
      expect(ocpuNumberInput.value).toBe("3");
      expect(memoryInput.value).toBe((DEFAULT_MEMORY_PER_OCPU_MD * 3).toString());
    }, 1500);
    jest.runTimersToTime(1500);
  });

  it("should be able to change memory to new value without any adjustment to cpu and after that cpu change shouldn't adjust memory as well", async () => {
    jest.useFakeTimers();
    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <Form>
            <FlexShapeSlider {...props} />
          </Form>
        </Provider>
      );
    });

    const { getByOuiTestId } = renderResult;
    const ocpuNumberInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_OCPUS_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;
    const memoryInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_MEMORY_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;

    // initial values
    expect(ocpuNumberInput.value).toBe(
      mockModelDeploymentInstanceShapeConfigDetails.ocpus.toString()
    );
    expect(memoryInput.value).toBe(
      mockModelDeploymentInstanceShapeConfigDetails.memoryInGBs.toString()
    );

    // trigger the change in memory
    fireEvent.change(memoryInput, { target: { value: 32 } });

    setTimeout(() => {
      expect(props.onChange).toHaveBeenCalledWith(
        props.shapeConfigurationDetails.ocpus,
        32,
        props.computeShape
      );
      expect(ocpuNumberInput.value).toBe(props.shapeConfigurationDetails.ocpus.toString());
      expect(memoryInput.value).toBe("32");
    }, 1500);
    jest.runTimersToTime(1500);

    // trigger the change in ocpu
    fireEvent.change(ocpuNumberInput, { target: { value: 16 } });

    setTimeout(() => {
      expect(props.onChange).toHaveBeenCalledWith(16, 32, props.computeShape);
      expect(ocpuNumberInput.value).toBe("16");
      expect(memoryInput.value).toBe("32");
      expect(memoryInput.value).not.toBe((16 * DEFAULT_MEMORY_PER_OCPU_MD).toString());
    }, 1500);
    jest.runTimersToTime(1500);
  });

  it("should have memory allowed range between min_memory (ocpu) to 64 fold of ocpu and not call onchange", async () => {
    jest.useFakeTimers();
    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <Form>
            <FlexShapeSlider {...props} />
          </Form>
        </Provider>
      );
    });

    const { getByOuiTestId } = renderResult;
    const ocpuNumberInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_OCPUS_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;
    const memoryInput = getByOuiTestId(
      "flex-input-" + FLEX_SLIDER_MEMORY_FIELD_NAME + "-test-id"
    ) as HTMLInputElement;

    // initial values
    expect(ocpuNumberInput.value).toBe(
      mockModelDeploymentInstanceShapeConfigDetails.ocpus.toString()
    );
    expect(memoryInput.value).toBe(
      mockModelDeploymentInstanceShapeConfigDetails.memoryInGBs.toString()
    );

    // trigger the change in memory to 65 but it should still be 64
    fireEvent.change(memoryInput, { target: { value: 65 } });

    setTimeout(() => {
      expect(memoryInput.value).toBe("65");
      expect(props.onChange).not.toHaveBeenCalled();
    }, 1500);
    jest.runTimersToTime(1500);
  });
});
