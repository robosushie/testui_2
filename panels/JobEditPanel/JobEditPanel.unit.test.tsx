import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useMutation: jest.fn(),
  useWhitelist: jest.fn(),
}));
import * as formUtils from "../../utils/formUtils";
import apiClients from "../../apiClients";
import {
  render,
  fireEvent,
  act,
  RenderResult,
} from "../../../unittest/utils/reactTestingLibraryUtils";
import { JobEditPanel } from "./JobEditPanel";
import {
  mockJob,
  mockSubnet,
  mockVcn,
  mockJobShapes,
  mockFastLaunchJobConfig,
  mockManagedEgressJob,
} from "../../../unittest/mocks";
import { Job } from "odsc-client/dist/odsc-client";
import {
  createStore,
  Labs,
  Provider,
  useConsoleState,
  useMutation,
  useWhitelist,
} from "oui-savant";
import { ComputeShapeConfigEnum } from "constants/computeShapeConfig";
import { when } from "jest-when";
import {
  JOBS_FAST_LAUNCH_ENABLED_WHITELIST,
  DS_NON_PROD_ENDPOINT,
  JOBS_MANAGED_EGRESS_ENABLED_WHITELIST,
  JOBS_FLEX_A1_ENABLED_WHITELIST,
} from "pluginConstants";
import {
  getFastLaunchConfigsMock,
  getJobMock,
  getJobShapesMock,
  getSubnetMock,
  getVcnMock,
} from "../../../unittest/useQueryMocks";

describe("JobEditPanel", () => {
  const activeCompartment = { id: "compartment" };
  const compartments = [{ id: "cocid" }];
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockUseConsoleState: jest.SpyInstance<any>;
  let mockValidateField: jest.SpyInstance<any>;
  let testJob: Job;
  let mockUseWhitelist: jest.SpyInstance;

  /**
   * This function to help with radio buttons set get values.
   * @param el
   * @returns
   */
  const renderWithHandlers = async (el: React.ReactElement<any, any>) => {
    let internalRenderResult: any;
    await act(async () => {
      internalRenderResult = render(el);
    });
    const { queryByDisplayValue } = internalRenderResult;
    const radioInputs = Array.from(document.getElementsByTagName("input"));
    return {
      ...internalRenderResult,
      setValue: (value: string) =>
        act(() => {
          const targetInput = queryByDisplayValue(value);
          if (!targetInput) {
            console.error("invalid value specified");
          } else {
            fireEvent.click(targetInput);
          }
        }),
      getValue: () => {
        const selected = radioInputs.filter((i) => i.checked);
        if (selected.length > 1) {
          console.error("more than one value selected");
        }

        return selected[0].value;
      },
      blur: () =>
        act(() => {
          fireEvent.blur(radioInputs[0]);
        }),
    };
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
    mockCloseHandler = jest.fn();
    mockRefresh = jest.fn();
    testJob = mockJob({});
    props = { job: testJob.id, isError: false, onClose: mockCloseHandler, refresh: mockRefresh };

    mockUseMutation = useMutation as jest.Mock;
    // jest.spyOn(savant, "useQuery").mockImplementation(jest.fn());
    mockUseConsoleState = useConsoleState as jest.Mock;
    mockUseConsoleState.mockImplementation(() => ({ activeCompartment, compartments }));
    mockValidateField = jest.spyOn(formUtils, "validateField");
    apiClients.identityApi.listTagNamespaces = jest.fn();
    apiClients.identityApi.listTags = jest.fn();
    jest
      .spyOn(formUtils, "isValidCompute")
      .mockReturnValue({ isValid: true, errorMessage: undefined });
    mockUseMutation.mockImplementation(
      mockUseMutationImplementationGenerator({
        updateJobReturnValue: {
          reset: jest.fn(),
          invoke: jest.fn(),
        },
      })
    );
    mockUseWhitelist = useWhitelist as jest.Mock;
    when(mockUseWhitelist).calledWith(JOBS_FAST_LAUNCH_ENABLED_WHITELIST).mockReturnValue([true]);
    when(mockUseWhitelist)
      .calledWith(JOBS_MANAGED_EGRESS_ENABLED_WHITELIST)
      .mockReturnValue([true]);
    when(mockUseWhitelist).calledWith(DS_NON_PROD_ENDPOINT).mockReturnValue([true]);
    when(mockUseWhitelist).calledWith(JOBS_FLEX_A1_ENABLED_WHITELIST).mockReturnValue([false]);

    getJobShapesMock.mockResponse(mockJobShapes([]));
    getFastLaunchConfigsMock.mockResponse(mockFastLaunchJobConfig([]));
    getSubnetMock.mockResponse(mockSubnet({}));
    getVcnMock.mockResponse(mockVcn({}));
  });

  describe("panel opened", () => {
    describe("fast launch", () => {
      it("should be selected if shape is in fast launch configs", async () => {
        getJobMock.mockResponse(mockJob({}));
        let renderResult: any;

        await act(async () => {
          renderResult = await renderWithHandlers(
            <Provider store={mockStore as any}>
              <JobEditPanel {...props} />
            </Provider>
          );
        });

        const { getValue } = renderResult;
        expect(getValue()).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);
      });
      it("should be not be selected if shape is not in fast launch configs", async () => {
        getJobMock.mockResponse(
          mockJob({
            jobInfrastructureConfigurationDetails: {
              jobInfrastructureType: "STANDALONE",
              shapeName: "VM.Standard2.2",
              blockStorageSizeInGBs: 450,
              subnetId: "socid",
            },
          })
        );
        let renderResult: any;

        await act(async () => {
          renderResult = await renderWithHandlers(
            <Provider store={mockStore as any}>
              <JobEditPanel {...props} />
            </Provider>
          );
        });

        const { getValue } = renderResult;
        expect(getValue()).toEqual(ComputeShapeConfigEnum.CUSTOM_CONFIGURATION);
      });
    });
  });

  describe("form submitted", () => {
    const testData = [
      { name: "Data", id: "123", displayName: "displayName", compartmentId: "compartment" },
    ];
    const testResponse = {
      status: 200,
      statusText: "OK",
      ok: true,
      headers: {
        forEach: () => {},
        get: () => {},
      },
    };
    const fakeApiResponse: any = { data: testData, response: testResponse };
    apiClients.identityApi.listTagNamespaces = jest.fn(() => Promise.resolve(fakeApiResponse));
    getJobMock.mockResponse(mockJob({}));

    describe("validation", () => {
      it("should validate all fields", async () => {
        // render
        let renderResult: any;

        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <JobEditPanel {...props} />
            </Provider>
          );
        });

        const { getByText, getByLabelText } = renderResult;

        // fill fields
        const displayValue = "display";
        mockTextField(getByLabelText("jobs.labels.name"), displayValue);

        const descriptionValue = "description";
        mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);

        const blockStorageValue = 100;
        mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

        // clear mocks and click submit
        mockValidateField.mockClear();

        const submitButton = getByText("actions.saveChanges");
        submitButton.click();

        // expects
        expect(mockValidateField).toHaveBeenCalledTimes(6);
        expect(mockValidateField.mock.calls).toContainEqual([
          { maxLen: 255, required: false, value: "display" },
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          { maxLen: 400, required: false, value: "description" },
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          { value: "100", required: true, callback: expect.any(Function) },
        ]);
      });

      it("should show not show vcn/subnet if default networking job", async () => {
        getJobMock.mockResponse(mockManagedEgressJob({}));
        // render
        let renderResult: any;

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore}>
              <JobEditPanel {...props} />
            </Provider>
          );
        });

        const vcnSelectField = renderResult.queryByOuiTestId("vcn-select");
        const subnetSelectField = renderResult.queryByOuiTestId("subnet-select");

        expect(vcnSelectField).toBeNull();
        expect(subnetSelectField).toBeNull();
      });

      it("should show vcn/subnet if custom networking job", async () => {
        getJobMock.mockResponse(mockJob({}));
        // render
        let renderResult: any;

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore}>
              <JobEditPanel {...props} />
            </Provider>
          );
        });

        const vcnSelectField = renderResult.queryByOuiTestId("vcn-select");
        const subnetSelectField = renderResult.queryByOuiTestId("subnet-select");

        expect(vcnSelectField).not.toBeNull();
        expect(subnetSelectField).not.toBeNull();
      });
    });

    describe("onSubmit", () => {
      let mockJobMutationReset: jest.Mock;
      let mockJobMutationInvoke: jest.Mock;

      beforeEach(() => {
        mockJobMutationReset = jest.fn();
        mockJobMutationInvoke = jest.fn();

        mockUseMutation.mockImplementation(
          mockUseMutationImplementationGenerator({
            updateJobReturnValue: {
              reset: mockJobMutationReset,
              invoke: mockJobMutationInvoke,
            },
          })
        );
        getJobMock.mockResponse(mockJob({}));
      });

      describe("Successful validation", () => {
        it("should reset the jobMutation", async () => {
          // render
          let renderResult: RenderResult;

          await act(async () => {
            renderResult = await render(
              <Provider store={mockStore}>
                <JobEditPanel {...props} />
              </Provider>
            );
          });

          const { getByText, getByLabelText } = renderResult;

          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);
          getByText("actions.saveChanges").click();
          expect(mockJobMutationReset).toHaveBeenCalled();
        });

        it("should invoke the jobMutation with the proper details", async () => {
          // render
          const renderResult = await renderWithHandlers(
            <Provider store={mockStore}>
              <JobEditPanel {...props} />
            </Provider>
          );
          const { getValue, getByText, getByLabelText } = renderResult;
          // fill non-required fields
          const displayValue = "display";
          mockTextField(getByLabelText("jobs.labels.name"), displayValue);
          const descriptionValue = "description";
          mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          expect(getValue()).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);

          mockValidateField.mockClear();
          getByText("actions.saveChanges").click();

          expect(mockValidateField).toHaveBeenCalledTimes(6);
          expect(mockJobMutationInvoke).toHaveBeenCalled();
          expect(mockJobMutationInvoke).toHaveBeenCalledWith({
            updateJobDetails: {
              jobid: undefined,
              displayName: displayValue,
              description: descriptionValue,
              definedTags: {},
              freeformTags: {
                fftag1: "fftag1",
                fftag2: "fftag2",
              },
              jobInfrastructureConfigurationDetails: {
                blockStorageSizeInGBs: "100",
                jobInfrastructureType: "STANDALONE",
                shapeName: "VM.Standard2.1",
                subnetId: "subnetocid",
              },
            },
          });
        });

        it("should invoke the jobMutation with the proper details with fast launch selected", async () => {
          // render
          const renderResult = await renderWithHandlers(
            <Provider store={mockStore}>
              <JobEditPanel {...props} />
            </Provider>
          );
          const { getValue, setValue, getByText, getByLabelText } = renderResult;
          // fill non-required fields
          const displayValue = "display";
          mockTextField(getByLabelText("jobs.labels.name"), displayValue);
          const descriptionValue = "description";
          mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          expect(getValue()).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);
          setValue(ComputeShapeConfigEnum.CUSTOM_CONFIGURATION);
          expect(getValue()).toEqual(ComputeShapeConfigEnum.CUSTOM_CONFIGURATION);

          mockValidateField.mockClear();
          getByText("actions.saveChanges").click();

          expect(mockValidateField).toHaveBeenCalledTimes(6);
          expect(mockJobMutationInvoke).toHaveBeenCalled();
          expect(mockJobMutationInvoke).toHaveBeenCalledWith({
            updateJobDetails: {
              jobid: undefined,
              displayName: displayValue,
              description: descriptionValue,
              definedTags: {},
              freeformTags: {
                fftag1: "fftag1",
                fftag2: "fftag2",
              },
              jobInfrastructureConfigurationDetails: {
                blockStorageSizeInGBs: "100",
                jobInfrastructureType: "STANDALONE",
                shapeName: "VM.Standard2.1",
                subnetId: "subnetocid",
              },
            },
          });
        });
      });

      describe("Unsuccessful validation", () => {
        let renderResult: RenderResult;
        beforeEach(async () => {
          await act(async () => {
            renderResult = await render(
              <Provider store={mockStore}>
                <JobEditPanel {...props} />
              </Provider>
            );
          });
          const { getByLabelText } = renderResult;
          // enter an invalid value
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), 48);
        });

        it("should not reset the jobMutation", () => {
          // render
          const { getByText } = renderResult;
          getByText("actions.saveChanges").click();
          expect(mockJobMutationReset).not.toHaveBeenCalled();
        });

        it("should not invoke the jobMutation", () => {
          // render
          const { getByText } = renderResult;
          getByText("actions.saveChanges").click();
          expect(mockJobMutationInvoke).not.toHaveBeenCalled();
        });
      });
    });
  });
});

const mockUseMutationImplementationGenerator = ({
  updateJobReturnValue,
}: {
  updateJobReturnValue: any;
}) => {
  return (mutationArgs: any): any => {
    if (mutationArgs.method === apiClients.odscApi.updateJob) {
      return updateJobReturnValue;
    }
  };
};

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};

const mockNumberField = (inputField: HTMLElement, value: number) => {
  fireEvent.change(inputField, { target: { value } });
};
