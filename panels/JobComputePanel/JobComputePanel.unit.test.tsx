import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
}));
import * as formUtils from "../../utils/formUtils";
import * as Messages from "@codegen/Messages";
import apiClients from "../../apiClients";
import { render, act, fireEvent } from "@testing-library/react";
import { createStore, Labs, Provider } from "oui-savant";
import { JobComputePanel } from "./JobComputePanel";
import { JobShapeConfigDetails, JobShapeSummary } from "odsc-client/dist/odsc-client";
import { defaultFlexShapeDetails } from "notebooks/utils/NotebookConstants";
import { getDefaultComputeWhitelists } from "utils/shapeUtils";
import { getJobShapesMock } from "@unittest/useQueryMocks";

describe("JobComputePanel", () => {
  let mockLoom: any;
  let mockStore: any;
  let mockOnClose: any;
  let mockComputeHandler: jest.SpyInstance;
  let props: any;
  let mockValidateField: jest.SpyInstance<any>;
  let renderResult: any;
  const computeSubmitMock = jest.fn();

  const preselectedVmShapeProp: JobShapeSummary = {
    name: "VM.Standard2.1",
    coreCount: 1,
    memoryInGBs: 15,
    shapeSeries: "LEGACY",
  };

  const jobShapeDetailsMock: JobShapeConfigDetails = {
    ocpus: 64,
    memoryInGBs: 1024,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    mockOnClose = jest.fn();
    mockComputeHandler = jest.fn();
    props = {
      preselectedVmShape: preselectedVmShapeProp,
      defaultShapeConfigurationDetails: defaultFlexShapeDetails,
      shapes: [preselectedVmShapeProp],
      onComputeDataSubmit: mockComputeHandler,
      onClose: mockOnClose,
      shapeUseQuery: getJobShapesMock,
      whitelistOverride: getDefaultComputeWhitelists(true),
    };
    mockValidateField = jest.spyOn(formUtils, "validateField");
    jest
      .spyOn(formUtils, "isValidShape")
      .mockReturnValue({ isValid: true, errorMessage: undefined });
    apiClients.identityApi.listTagNamespaces = jest.fn();
    apiClients.identityApi.listTags = jest.fn();
  });

  it("should render the component correctly when props are valid without new shapes whitelist and not e3 flex", async () => {
    const mockJobShapesResp: JobShapeSummary[] = [
      {
        shapeSeries: "INTEL_SKYLAKE",
        name: "VM.Standard3.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
      {
        shapeSeries: "LEGACY",
        name: "unittestlegacyshape",
        coreCount: 2,
        memoryInGBs: 8,
      },
      {
        shapeSeries: "NVIDIA_GPU",
        name: "unittestnvidiagpushape",
        coreCount: 4,
        memoryInGBs: 64,
      },
      {
        shapeSeries: "AMD_ROME",
        name: "VM.Standard.E3.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
    ];

    const jobShapeDetailsMock: JobShapeConfigDetails = {
      ocpus: 64,
      memoryInGBs: 1024,
    };

    const props = {
      onClose: jest.fn(),
      onComputeDataSubmit: computeSubmitMock,
      preselectedVmShape: mockJobShapesResp[0],
      defaultShapeConfigurationDetails: jobShapeDetailsMock,
      shapes: mockJobShapesResp,
      shapeUseQuery: getJobShapesMock,
      whitelistOverride: getDefaultComputeWhitelists(true),
    };

    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <JobComputePanel {...props} />
        </Provider>
      );
    });

    const selectButtonWrapper = renderResult.getByText(Messages.actions.selectShape());
    expect(selectButtonWrapper.getAttribute("aria-disabled")).toBeFalsy();
    fireEvent.click(selectButtonWrapper);

    expect(computeSubmitMock).toHaveBeenCalled();
    expect(computeSubmitMock).toHaveBeenCalledWith(mockJobShapesResp[0], jobShapeDetailsMock); // Initial values
  });

  it("should render the component correctly when props are valid with new shapes whitelist e3 flex", async () => {
    const mockJobShapesResp: JobShapeSummary[] = [
      {
        shapeSeries: "AMD_ROME",
        name: "VM.Standard.E4.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
      {
        shapeSeries: "LEGACY",
        name: "unittestlegacyshape",
        coreCount: 2,
        memoryInGBs: 8,
      },
      {
        shapeSeries: "NVIDIA_GPU",
        name: "unittestnvidiagpushape",
        coreCount: 4,
        memoryInGBs: 64,
      },
      {
        shapeSeries: "INTEL_SKYLAKE",
        name: "VM.Standard3.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
    ];

    const props = {
      onClose: jest.fn(),
      onComputeDataSubmit: computeSubmitMock,
      preselectedVmShape: mockJobShapesResp[0],
      defaultShapeConfigurationDetails: jobShapeDetailsMock,
      shapes: mockJobShapesResp,
      shapeUseQuery: getJobShapesMock,
      whitelistOverride: getDefaultComputeWhitelists(true),
    };

    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <JobComputePanel {...props} />
        </Provider>
      );
    });

    const selectButtonWrapper = renderResult.getByText(Messages.actions.selectShape());
    expect(selectButtonWrapper.getAttribute("aria-disabled")).toBeFalsy();
    fireEvent.click(selectButtonWrapper);

    expect(computeSubmitMock).toHaveBeenCalled();
    expect(computeSubmitMock).toHaveBeenCalledWith(mockJobShapesResp[0], jobShapeDetailsMock); // Initial values
  });

  it("should change instance type on click", async () => {
    const mockJobShapesResp: JobShapeSummary[] = [
      {
        shapeSeries: "AMD_ROME",
        name: "VM.Standard.E4.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
      {
        shapeSeries: "LEGACY",
        name: "unittestlegacyshape",
        coreCount: 2,
        memoryInGBs: 8,
      },
      {
        shapeSeries: "NVIDIA_GPU",
        name: "unittestnvidiagpushape",
        coreCount: 4,
        memoryInGBs: 64,
      },
      {
        shapeSeries: "INTEL_SKYLAKE",
        name: "VM.Standard3.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
      {
        shapeSeries: "INTEL_SKYLAKE",
        name: "BM.GPU2.2",
        coreCount: 64,
        memoryInGBs: 1024,
      },
    ];

    const props = {
      onClose: jest.fn(),
      onComputeDataSubmit: computeSubmitMock,
      preselectedVmShape: mockJobShapesResp[0],
      defaultShapeConfigurationDetails: jobShapeDetailsMock,
      shapes: mockJobShapesResp,
      shapeUseQuery: getJobShapesMock,
      whitelistOverride: getDefaultComputeWhitelists(true),
    };

    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <JobComputePanel {...props} />
        </Provider>
      );
    });

    const { queryByLabelText } = renderResult;

    // Instance Picker Testing
    const vmRadio = queryByLabelText("instances.instanceTypes.virtualMachine") as HTMLInputElement;
    const bmRadio = queryByLabelText(
      "instances.instanceTypes.bareMetalMachine"
    ) as HTMLInputElement;
    expect(vmRadio.checked).toBeTruthy();
    expect(bmRadio.checked).toBeFalsy();
    await act(async () => {
      bmRadio.click();
    });
    expect(vmRadio.checked).toBeFalsy();
    expect(bmRadio.checked).toBeTruthy();
  });

  it("should change series option on click", async () => {
    const mockJobShapesResp: JobShapeSummary[] = [
      {
        shapeSeries: "AMD_ROME",
        name: "VM.Standard.E4.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
      {
        shapeSeries: "LEGACY",
        name: "unittestlegacyshape",
        coreCount: 2,
        memoryInGBs: 8,
      },
      {
        shapeSeries: "NVIDIA_GPU",
        name: "unittestnvidiagpushape",
        coreCount: 4,
        memoryInGBs: 64,
      },
      {
        shapeSeries: "INTEL_SKYLAKE",
        name: "VM.Standard3.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
    ];

    const props = {
      onClose: jest.fn(),
      onComputeDataSubmit: computeSubmitMock,
      preselectedVmShape: mockJobShapesResp[0],
      defaultShapeConfigurationDetails: jobShapeDetailsMock,
      shapes: mockJobShapesResp,
      shapeUseQuery: getJobShapesMock,
      whitelistOverride: getDefaultComputeWhitelists(true),
    };

    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <JobComputePanel {...props} />
        </Provider>
      );
    });

    const { queryByLabelText } = renderResult;
    // Series Option Testing
    const amdButton = queryByLabelText("instances.shapes.families.amdRome") as HTMLInputElement;
    const intelButton = queryByLabelText(
      "instances.shapes.families.intelSkylake"
    ) as HTMLInputElement;
    const moreOptionsButton = queryByLabelText(
      "instances.shapes.families.moreOptions"
    ) as HTMLInputElement;
    expect(amdButton.checked).toBeTruthy();
    expect(intelButton.checked).toBeFalsy();
    expect(moreOptionsButton.checked).toBeFalsy();
    await act(async () => {
      moreOptionsButton.click();
    });
    expect(amdButton.checked).toBeFalsy();
    expect(intelButton.checked).toBeFalsy();
    expect(moreOptionsButton.checked).toBeTruthy();
  });

  it("should remove instance type picker if no bare metal shape", async () => {
    const mockJobShapesResp: JobShapeSummary[] = [
      {
        shapeSeries: "AMD_ROME",
        name: "VM.Standard.E4.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
      {
        shapeSeries: "LEGACY",
        name: "unittestlegacyshape",
        coreCount: 2,
        memoryInGBs: 8,
      },
      {
        shapeSeries: "NVIDIA_GPU",
        name: "unittestnvidiagpushape",
        coreCount: 4,
        memoryInGBs: 64,
      },
      {
        shapeSeries: "INTEL_SKYLAKE",
        name: "VM.Standard3.Flex",
        coreCount: 64,
        memoryInGBs: 1024,
      },
    ];

    const props = {
      onClose: jest.fn(),
      onComputeDataSubmit: computeSubmitMock,
      preselectedVmShape: mockJobShapesResp[0],
      defaultShapeConfigurationDetails: jobShapeDetailsMock,
      shapes: mockJobShapesResp,
      shapeUseQuery: getJobShapesMock,
      whitelistOverride: getDefaultComputeWhitelists(true),
    };

    await act(async () => {
      renderResult = render(
        <Provider store={mockStore}>
          <JobComputePanel {...props} />
        </Provider>
      );
    });

    const { queryByLabelText } = renderResult;

    // Instance Picker Testing
    const vmRadio = queryByLabelText("instances.instanceTypes.virtualMachine") as HTMLInputElement;
    const bmRadio = queryByLabelText(
      "instances.instanceTypes.bareMetalMachine"
    ) as HTMLInputElement;
    expect(vmRadio).toBeNull();
    expect(bmRadio).toBeNull();
  });

  describe("validation", () => {
    it(" should validate all fields", async () => {
      // render
      let renderResult: any;

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobComputePanel {...props} />
          </Provider>
        );
      });

      const { getByText } = renderResult;

      // clear mocks and click submit
      mockValidateField.mockClear();

      const submitButton = getByText("actions.selectShape");
      submitButton.click();
      expect(submitButton.getAttribute("aria-disabled")).toBeFalsy();
    });

    it(" should disable button if preselectedShape undefined", async () => {
      // render
      let renderResult: any;

      props.preselectedVmShape = undefined;

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobComputePanel {...props} />
          </Provider>
        );
      });

      const { getByText } = renderResult;

      // clear mocks and click submit
      mockValidateField.mockClear();
      jest
        .spyOn(formUtils, "isValidShape")
        .mockReturnValue({ isValid: false, errorMessage: undefined });

      const submitButton = getByText("actions.selectShape");
      submitButton.click();
      expect(submitButton.getAttribute("aria-disabled")).toBeTruthy();
    });
  });

  describe("allowlists", () => {
    it(" should show breeze table if allowed for new shapes", async () => {
      // render
      let renderResult: any;

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobComputePanel {...props} />
          </Provider>
        );
      });
      const { queryByText } = renderResult;

      // The breeze table is <ShapeTable and the one we implemented was <ShapesTable
      expect(queryByText("<ShapesTable")).toBeNull;
      expect(queryByText("<ShapeTable")).not.toBeNull;
    });

    it(" should show ShapesTable if not allowed for new shapes", async () => {
      // render
      let renderResult: any;

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobComputePanel {...props} />
          </Provider>
        );
      });
      const { queryByText } = renderResult;

      expect(queryByText("<ShapesTable")).not.toBeNull;
      expect(queryByText("<ShapeTable")).toBeNull;
    });
  });

  describe("form", () => {
    it(" disables select shape button if shape unchecked", async () => {
      // render
      let renderResult: any;

      props = {
        preselectedVmShape: preselectedVmShapeProp,
        defaultShapeConfigurationDetails: defaultFlexShapeDetails,
        shapes: [preselectedVmShapeProp],
        onComputeDataSubmit: mockComputeHandler,
        onClose: mockOnClose,
        shapeUseQuery: getJobShapesMock,
        whitelistOverride: getDefaultComputeWhitelists(true),
      };

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobComputePanel {...props} />
          </Provider>
        );
      });
      const { queryByText, getByRole } = renderResult;

      const flexShapeCheckbox = getByRole("checkbox", {
        name: "Select row VM.Standard2.1",
      }) as HTMLInputElement;
      expect(flexShapeCheckbox.checked).toBe(true);

      await fireEvent.click(flexShapeCheckbox);

      const submitButton = queryByText("actions.selectShape");
      expect(submitButton.getAttribute("aria-disabled")).toBeTruthy();
    });

    it(" submits shape and shapeConfigurationDetails", async () => {
      // render
      let renderResult: any;

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobComputePanel {...props} />
          </Provider>
        );
      });
      const { queryByText } = renderResult;

      const submitButton = queryByText("actions.selectShape");
      submitButton.click();
      expect(mockComputeHandler).lastCalledWith(preselectedVmShapeProp, defaultFlexShapeDetails);
    });
  });
});
