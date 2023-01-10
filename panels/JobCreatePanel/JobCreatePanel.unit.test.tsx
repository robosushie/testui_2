import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useConsoleState: jest.fn(),
  useWhitelist: jest.fn(),
}));
import * as formUtils from "../../utils/formUtils";
import apiClients from "../../apiClients";
import { render, fireEvent, RenderResult, act } from "@testing-library/react";
import { JobCreatePanel } from "./JobCreatePanel";
import { ToastNotification } from "oui-react";
import {
  createStore,
  Labs,
  Provider,
  useConsoleState,
  useMutation,
  useQuery,
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
import { getFastLaunchConfigsMock, getJobShapesMock } from "../../../unittest/useQueryMocks";
import { mockJobShapes, mockFastLaunchJobConfig } from "../../../unittest/mocks";
import { NetworkingTypeEnum } from "constants/networkingTypeEnum";

describe("JobCreatePanel", () => {
  const projectId = "1";
  const activeCompartment = { id: "compartment" };
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let props: any;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockUseConsoleState: jest.SpyInstance<any>;
  let mockValidateField: jest.SpyInstance<any>;
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
      getValue: (radioGroupNumber: number) => {
        const selected = radioInputs.filter((i) => i.checked);
        if (selected.length > 2) {
          console.error("more than two values selected");
        }

        return selected[radioGroupNumber].value;
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
    props = { projectId, isError: false, onClose: mockCloseHandler };

    mockUseMutation = useMutation as jest.Mock;
    (useQuery as jest.Mock).mockImplementation(jest.fn());
    jest.spyOn(ToastNotification, "create").mockReturnValue();
    mockUseConsoleState = useConsoleState as jest.Mock;
    mockUseConsoleState.mockImplementation(() => ({ activeCompartment }));
    mockValidateField = jest.spyOn(formUtils, "validateField");
    jest
      .spyOn(formUtils, "isValidShape")
      .mockReturnValue({ isValid: true, errorMessage: undefined });
    apiClients.identityApi.listTagNamespaces = jest.fn();
    apiClients.identityApi.listTags = jest.fn();
    mockUseMutation.mockImplementation(
      mockUseMutationImplementationGenerator({
        createJobReturnValue: {
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
  });

  describe("Notifications", () => {
    describe("Errors", () => {
      it("should display a ToastNotification if submitting data fails", async () => {
        (useMutation as jest.Mock).mockReturnValue({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { error: { body: { message: "error" } } },
        });
        await act(async () => {
          render(
            <Provider store={mockStore as any}>
              <JobCreatePanel {...props} />
            </Provider>
          );
        });
        expect(ToastNotification.create).toHaveBeenCalled();
      });
    });
  });

  describe("form submitted", () => {
    const testData = [{ name: "Data", id: "123", displayName: "displayName" }];
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
    apiClients.virtualNetworkApi.listVcns = jest.fn(() => Promise.resolve(fakeApiResponse));
    apiClients.virtualNetworkApi.listSubnets = jest.fn(() => Promise.resolve(fakeApiResponse));
    apiClients.identityApi.listTagNamespaces = jest.fn(() => Promise.resolve(fakeApiResponse));

    describe("validation", () => {
      it("should validate all fields", async () => {
        // render
        let renderResult: any;

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <JobCreatePanel {...props} />
            </Provider>
          );
        });

        const { getByText, getByLabelText } = renderResult;

        // fill fields
        const displayValue = "display";
        mockTextField(getByLabelText("jobs.labels.name"), displayValue);

        const descriptionValue = "description";
        mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);

        const jobArtifactValue = new File(["file contents"], "jobArtifact.py", {
          type: "text/plain",
        });
        mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);

        const commandLineArgumentsValue = "test command line args";
        mockTextField(
          getByLabelText("jobs.labels.commandLineArguments"),
          commandLineArgumentsValue
        );

        const maximumRuntimeValue = 50;
        mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);

        const blockStorageValue = 100;
        mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

        // clear mocks and click submit
        mockValidateField.mockClear();

        const submitButton = getByText("actions.create");
        submitButton.click();

        // expects
        expect(mockValidateField).toHaveBeenCalledTimes(10);
        expect(mockValidateField.mock.calls).toContainEqual([
          { maxLen: 255, required: false, value: "display" },
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          { maxLen: 400, required: false, value: "description" },
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          expect.objectContaining({
            value: jobArtifactValue,
            required: true,
          }),
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          { maxLen: 4000, required: false, value: "test command line args" },
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          { callback: expect.any(Function), required: false, value: "50" },
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          { value: "100", required: true, callback: expect.any(Function) },
        ]);
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
            createJobReturnValue: {
              reset: mockJobMutationReset,
              invoke: mockJobMutationInvoke,
            },
          })
        );
      });

      describe("Successful validation", () => {
        it("should reset the jobMutation", async () => {
          // render
          let renderResult: RenderResult;

          await act(async () => {
            renderResult = render(
              <Provider store={mockStore}>
                <JobCreatePanel {...props} />
              </Provider>
            );
          });

          const { getByText, getByLabelText } = renderResult;

          // fill required field
          const jobArtifactValue = new File(["file contents"], "jobArtifact.py", {
            type: "text/plain",
          });
          mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          getByText("actions.create").click();
          expect(mockJobMutationReset).toHaveBeenCalled();
        });

        it("should invoke the jobMutation with the proper details", async () => {
          getJobShapesMock.mockResponse(mockJobShapes([]));
          getFastLaunchConfigsMock.mockResponse(mockFastLaunchJobConfig([]));
          // render
          const { getValue, getByText, getByLabelText } = await renderWithHandlers(
            <Provider store={mockStore}>
              <JobCreatePanel {...props} />
            </Provider>
          );

          // fill non-required fields
          const displayValue = "display";
          mockTextField(getByLabelText("jobs.labels.name"), displayValue);
          const descriptionValue = "description";
          mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);
          const maximumRuntimeValue = 50;
          mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);
          const commandLineArgumentsValue = "command line args";
          mockTextField(
            getByLabelText("jobs.labels.commandLineArguments"),
            commandLineArgumentsValue
          );
          const envVarKeyValue = "ENV VAR";
          mockTextField(getByLabelText("jobs.labels.environmentVariableKey"), envVarKeyValue);
          const envVarValValue = "data";
          mockTextField(getByLabelText("jobs.labels.environmentVariableValue"), envVarValValue);

          // fill required fields
          const jobArtifactValue = new File(["file contents"], "jobArtifact.py", {
            type: "text/plain",
          });
          mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          expect(getValue(0)).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);
          expect(getValue(1)).toEqual(NetworkingTypeEnum.DEFAULT_NETWORKING);

          getByText("actions.create").click();
          expect(mockJobMutationInvoke).toHaveBeenCalledWith({
            createJobDetails: expect.objectContaining({
              projectId,
              compartmentId: activeCompartment.id,
              displayName: displayValue,
              description: descriptionValue,
              jobConfigurationDetails: {
                jobType: "DEFAULT",
                maximumRuntimeInMinutes: "50",
                environmentVariables: {
                  "ENV VAR": "data",
                },
                commandLineArguments: commandLineArgumentsValue,
              },
              jobInfrastructureConfigurationDetails: {
                shapeName: "unittestshape",
                blockStorageSizeInGBs: "100",
                jobInfrastructureType: "ME_STANDALONE",
              },
            }),
          });
        });

        it("should invoke the jobMutation with the proper details for flex shape", async () => {
          getJobShapesMock.mockResponse([
            {
              shapeSeries: "INTEL_SKYLAKE",
              name: "VM.Standard.E3.Flex",
              coreCount: 1,
              memoryInGBs: 64,
            },
          ]);
          getFastLaunchConfigsMock.mockResponse(mockFastLaunchJobConfig([]));
          // render
          const { getValue, getByText, getByLabelText } = await renderWithHandlers(
            <Provider store={mockStore}>
              <JobCreatePanel {...props} />
            </Provider>
          );

          // fill non-required fields
          const displayValue = "display";
          mockTextField(getByLabelText("jobs.labels.name"), displayValue);
          const descriptionValue = "description";
          mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);
          const maximumRuntimeValue = 50;
          mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);
          const commandLineArgumentsValue = "command line args";
          mockTextField(
            getByLabelText("jobs.labels.commandLineArguments"),
            commandLineArgumentsValue
          );
          const envVarKeyValue = "ENV VAR";
          mockTextField(getByLabelText("jobs.labels.environmentVariableKey"), envVarKeyValue);
          const envVarValValue = "data";
          mockTextField(getByLabelText("jobs.labels.environmentVariableValue"), envVarValValue);

          // fill required fields
          const jobArtifactValue = new File(["file contents"], "jobArtifact.py", {
            type: "text/plain",
          });
          mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          expect(getValue(0)).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);
          expect(getValue(1)).toEqual(NetworkingTypeEnum.DEFAULT_NETWORKING);

          getByText("actions.create").click();
          expect(mockJobMutationInvoke).toHaveBeenCalledWith({
            createJobDetails: expect.objectContaining({
              projectId,
              compartmentId: activeCompartment.id,
              displayName: displayValue,
              description: descriptionValue,
              jobConfigurationDetails: {
                jobType: "DEFAULT",
                maximumRuntimeInMinutes: "50",
                environmentVariables: {
                  "ENV VAR": "data",
                },
                commandLineArguments: commandLineArgumentsValue,
              },
              jobInfrastructureConfigurationDetails: {
                shapeName: "VM.Standard.E3.Flex",
                blockStorageSizeInGBs: "100",
                jobInfrastructureType: "ME_STANDALONE",
                jobShapeConfigDetails: {
                  ocpus: 1,
                  memoryInGBs: 16,
                },
              },
            }),
          });
        });

        it("should invoke the jobMutation with the custom configuration selected", async () => {
          // render
          getJobShapesMock.mockResponse(mockJobShapes([]));
          getFastLaunchConfigsMock.mockResponse(mockFastLaunchJobConfig([]));

          const { getValue, setValue, getByText, getByLabelText } = await renderWithHandlers(
            <Provider store={mockStore}>
              <JobCreatePanel {...props} />
            </Provider>
          );

          // fill non-required fields
          const displayValue = "display";
          mockTextField(getByLabelText("jobs.labels.name"), displayValue);
          const descriptionValue = "description";
          mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);
          const maximumRuntimeValue = 50;
          mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);
          const commandLineArgumentsValue = "command line args";
          mockTextField(
            getByLabelText("jobs.labels.commandLineArguments"),
            commandLineArgumentsValue
          );
          const envVarKeyValue = "ENV VAR";
          mockTextField(getByLabelText("jobs.labels.environmentVariableKey"), envVarKeyValue);
          const envVarValValue = "data";
          mockTextField(getByLabelText("jobs.labels.environmentVariableValue"), envVarValValue);

          // fill required fields
          const jobArtifactValue = new File(["file contents"], "jobArtifact.py", {
            type: "text/plain",
          });
          mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          expect(getValue(0)).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);
          setValue(ComputeShapeConfigEnum.CUSTOM_CONFIGURATION);
          expect(getValue(0)).toEqual(ComputeShapeConfigEnum.CUSTOM_CONFIGURATION);
          expect(getValue(1)).toEqual(NetworkingTypeEnum.DEFAULT_NETWORKING);

          getByText("actions.create").click();
          expect(mockJobMutationInvoke).toHaveBeenCalledWith({
            createJobDetails: expect.objectContaining({
              projectId,
              compartmentId: activeCompartment.id,
              displayName: displayValue,
              description: descriptionValue,
              jobConfigurationDetails: {
                jobType: "DEFAULT",
                maximumRuntimeInMinutes: "50",
                environmentVariables: {
                  "ENV VAR": "data",
                },
                commandLineArguments: commandLineArgumentsValue,
              },
              jobInfrastructureConfigurationDetails: {
                shapeName: "unittestshape",
                blockStorageSizeInGBs: "100",
                jobInfrastructureType: "ME_STANDALONE",
              },
            }),
          });
        });

        // TODO: mock listSubnets
        it("should invoke the jobMutation with the proper details with custom networking egress", async () => {
          getJobShapesMock.mockResponse(mockJobShapes([]));
          getFastLaunchConfigsMock.mockResponse(mockFastLaunchJobConfig([]));
          // render
          const { getValue, setValue, getByText, getByLabelText } = await renderWithHandlers(
            <Provider store={mockStore}>
              <JobCreatePanel {...props} />
            </Provider>
          );

          // fill non-required fields
          const displayValue = "display";
          mockTextField(getByLabelText("jobs.labels.name"), displayValue);
          const descriptionValue = "description";
          mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);
          const maximumRuntimeValue = 50;
          mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);
          const commandLineArgumentsValue = "command line args";
          mockTextField(
            getByLabelText("jobs.labels.commandLineArguments"),
            commandLineArgumentsValue
          );
          const envVarKeyValue = "ENV VAR";
          mockTextField(getByLabelText("jobs.labels.environmentVariableKey"), envVarKeyValue);
          const envVarValValue = "data";
          mockTextField(getByLabelText("jobs.labels.environmentVariableValue"), envVarValValue);

          // fill required fields
          const jobArtifactValue = new File(["file contents"], "jobArtifact.py", {
            type: "text/plain",
          });
          mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          expect(getValue(0)).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);
          expect(getValue(1)).toEqual(NetworkingTypeEnum.DEFAULT_NETWORKING);
          setValue(NetworkingTypeEnum.CUSTOM_NETWORKING);
          expect(getValue(1)).toEqual(NetworkingTypeEnum.CUSTOM_NETWORKING);

          getByText("actions.create").click();
          expect(mockJobMutationInvoke).toHaveBeenCalledWith({
            createJobDetails: expect.objectContaining({
              projectId,
              compartmentId: activeCompartment.id,
              displayName: displayValue,
              description: descriptionValue,
              jobConfigurationDetails: {
                jobType: "DEFAULT",
                maximumRuntimeInMinutes: "50",
                environmentVariables: {
                  "ENV VAR": "data",
                },
                commandLineArguments: commandLineArgumentsValue,
              },
              jobInfrastructureConfigurationDetails: {
                shapeName: "unittestshape",
                blockStorageSizeInGBs: "100",
                jobInfrastructureType: "STANDALONE",
                subnetId: undefined,
              },
            }),
          });
        });

        // TODO: Set to custom networking egress
        it("should invoke the jobMutation with the custom configuration selected and custom networking egress", async () => {
          // render
          getJobShapesMock.mockResponse(mockJobShapes([]));
          getFastLaunchConfigsMock.mockResponse(mockFastLaunchJobConfig([]));

          const { getValue, setValue, getByText, getByLabelText } = await renderWithHandlers(
            <Provider store={mockStore}>
              <JobCreatePanel {...props} />
            </Provider>
          );

          // fill non-required fields
          const displayValue = "display";
          mockTextField(getByLabelText("jobs.labels.name"), displayValue);
          const descriptionValue = "description";
          mockTextField(getByLabelText("jobs.labels.description"), descriptionValue);
          const maximumRuntimeValue = 50;
          mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);
          const commandLineArgumentsValue = "command line args";
          mockTextField(
            getByLabelText("jobs.labels.commandLineArguments"),
            commandLineArgumentsValue
          );
          const envVarKeyValue = "ENV VAR";
          mockTextField(getByLabelText("jobs.labels.environmentVariableKey"), envVarKeyValue);
          const envVarValValue = "data";
          mockTextField(getByLabelText("jobs.labels.environmentVariableValue"), envVarValValue);

          // fill required fields
          const jobArtifactValue = new File(["file contents"], "jobArtifact.py", {
            type: "text/plain",
          });
          mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
          const blockStorageValue = 100;
          mockNumberField(getByLabelText("jobs.labels.additionalStorage"), blockStorageValue);

          expect(getValue(0)).toEqual(ComputeShapeConfigEnum.FAST_LAUNCH);
          setValue(ComputeShapeConfigEnum.CUSTOM_CONFIGURATION);
          expect(getValue(0)).toEqual(ComputeShapeConfigEnum.CUSTOM_CONFIGURATION);
          expect(getValue(1)).toEqual(NetworkingTypeEnum.DEFAULT_NETWORKING);
          setValue(NetworkingTypeEnum.CUSTOM_NETWORKING);
          expect(getValue(1)).toEqual(NetworkingTypeEnum.CUSTOM_NETWORKING);

          getByText("actions.create").click();
          expect(mockJobMutationInvoke).toHaveBeenCalledWith({
            createJobDetails: expect.objectContaining({
              projectId,
              compartmentId: activeCompartment.id,
              displayName: displayValue,
              description: descriptionValue,
              jobConfigurationDetails: {
                jobType: "DEFAULT",
                maximumRuntimeInMinutes: "50",
                environmentVariables: {
                  "ENV VAR": "data",
                },
                commandLineArguments: commandLineArgumentsValue,
              },
              jobInfrastructureConfigurationDetails: {
                shapeName: "unittestshape",
                blockStorageSizeInGBs: "100",
                jobInfrastructureType: "STANDALONE",
                subnetId: undefined,
              },
            }),
          });
        });
      });

      describe("Unsuccessful validation", () => {
        let renderResult: RenderResult;
        beforeEach(async () => {
          await act(async () => {
            renderResult = render(
              <Provider store={mockStore}>
                <JobCreatePanel {...props} />
              </Provider>
            );
          });
        });

        it("should not reset the jobMutation", () => {
          // render
          const { getByText } = renderResult;
          getByText("actions.create").click();
          expect(mockJobMutationReset).not.toHaveBeenCalled();
        });

        it("should not invoke the jobMutation", () => {
          // render
          const { getByText } = renderResult;
          getByText("actions.create").click();
          expect(mockJobMutationInvoke).not.toHaveBeenCalled();
        });
      });
    });
  });
});

const mockUseMutationImplementationGenerator = ({
  createJobReturnValue,
}: {
  createJobReturnValue: any;
}) => {
  return (mutationArgs: any): any => {
    if (mutationArgs.method === apiClients.odscApi.createJob) {
      return createJobReturnValue;
    }
  };
};

export const mockJobArtifactField = (jobArtifactInput: HTMLElement, jobArtifactValue: File) => {
  // https://github.com/kentcdodds/react-testing-library-examples/pull/1/files
  Object.defineProperty(jobArtifactInput, "files", {
    value: [jobArtifactValue],
  });
  fireEvent.change(jobArtifactInput);
  return jobArtifactValue;
};

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};

const mockNumberField = (inputField: HTMLElement, value: number) => {
  fireEvent.change(inputField, { target: { value } });
};
