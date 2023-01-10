import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import apiClients from "apiClients";
import { act } from "react-dom/test-utils";
import { fireEvent, render } from "@testing-library/react";
import * as formUtils from "../../utils/formUtils";
import { ToastNotification } from "oui-react";
import { mockJobRun } from "../../../unittest/mocks";
import { JobRunClonePanel } from "./JobRunClonePanel";
import { JobRun } from "odsc-client/dist/odsc-client";
import {
  createStore,
  Labs,
  Provider,
  Store,
  useConsoleState,
  useMutation,
  useQuery,
} from "oui-savant";

describe("JobRunClonePanel", () => {
  const props = {
    closeHandler: jest.fn(),
    refresh: jest.fn(),
    originalJobRunId: "1",
  };
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;
  let renderResult: any;
  let mockValidateField: jest.SpyInstance<any>;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockedJobRun: JobRun;

  beforeEach(() => {
    jest.clearAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({ activeCompartmennt: { id: "ID" } });
    jest.spyOn(ToastNotification, "create").mockReturnValue();
    mockUseMutation = useMutation as jest.Mock;
    mockValidateField = jest.spyOn(formUtils, "validateField");
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    mockedJobRun = mockJobRun({});
    (useQuery as jest.Mock).mockReturnValue({ loading: false, response: { data: mockedJobRun } });
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
              <JobRunClonePanel {...props} />
            </Provider>
          );
        });
        expect(ToastNotification.create).toHaveBeenCalled();
      });
    });
    describe("Success", () => {
      it("should display a ToastNotification on successful submission", async () => {
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <JobRunClonePanel {...props} />
            </Provider>
          );
        });
        const { getByText } = renderResult;
        const cloneButton = getByText("jobRuns.actions.cloneJobRun");
        cloneButton.click();
        expect(ToastNotification.create).toHaveBeenCalled();
      });
    });
  });

  describe("Form tests", () => {
    describe("validation", () => {
      it("should validate displayName on Submit", async () => {
        // render
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <JobRunClonePanel {...props} />
            </Provider>
          );
        });
        const { getByText, getByLabelText } = renderResult;

        // fill fields
        const displayNameValue = "displayName";
        mockTextField(getByLabelText("jobs.labels.name"), displayNameValue);

        const commandLineArgumentsValue = "test command line args";
        mockTextField(
          getByLabelText("jobs.labels.commandLineArguments"),
          commandLineArgumentsValue
        );

        const maximumRuntimeValue = 50;
        mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);

        // clear mocks and click submit
        mockValidateField.mockClear();
        const submitButton = getByText("jobRuns.actions.cloneJobRun");
        submitButton.click();

        // expects
        expect(mockValidateField).toHaveBeenCalledTimes(3);
        expect(mockValidateField).toHaveBeenCalledWith({
          value: displayNameValue,
          required: false,
          maxLen: 255,
        });
        expect(mockValidateField.mock.calls).toContainEqual([
          { maxLen: 4000, required: false, value: "test command line args" },
        ]);
        expect(mockValidateField.mock.calls).toContainEqual([
          { callback: expect.any(Function), required: false, value: "50" },
        ]);
      });
    });
  });

  describe("On submit", () => {
    let mockJobRunMutationReset: jest.Mock;
    let mockJobRunMutationInvoke: jest.Mock;

    beforeEach(() => {
      mockJobRunMutationReset = jest.fn();
      mockJobRunMutationInvoke = jest.fn();

      mockUseMutation.mockImplementation(
        mockUseMutationImplementationGenerator({
          createJobRunReturnValue: {
            reset: mockJobRunMutationReset,
            invoke: mockJobRunMutationInvoke,
          },
        })
      );
    });
    it("should prefill data from original jobrun", async () => {
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobRunClonePanel {...props} />
          </Provider>
        );
      });
      const { getByText } = renderResult;

      const submitButton = getByText("jobRuns.actions.cloneJobRun");
      submitButton.click();
      expect(mockJobRunMutationInvoke).toHaveBeenCalledWith({
        createJobRunDetails: expect.objectContaining({
          displayName: mockedJobRun.displayName,
          jobConfigurationOverrideDetails: mockedJobRun.jobConfigurationOverrideDetails,
          jobLogConfigurationOverrideDetails: mockedJobRun.jobLogConfigurationOverrideDetails,
          definedTags: mockedJobRun.definedTags,
        }),
      });
    });

    it("should submit the correct data if the form is changed", async () => {
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobRunClonePanel {...props} />
          </Provider>
        );
      });
      const { getByText, getByLabelText } = renderResult;

      const displayNameValue = "newDisplayName";
      mockTextField(getByLabelText("jobs.labels.name"), displayNameValue);
      const maximumRuntimeValue = 571;
      mockNumberField(getByLabelText("jobs.labels.maxRuntimeInMinutes"), maximumRuntimeValue);

      const submitButton = getByText("jobRuns.actions.cloneJobRun");
      submitButton.click();
      expect(mockJobRunMutationInvoke).toHaveBeenCalledWith({
        createJobRunDetails: expect.objectContaining({
          displayName: displayNameValue,
          jobConfigurationOverrideDetails: {
            maximumRuntimeInMinutes: maximumRuntimeValue.toString(),
            environmentVariables: {
              key1: "value1",
              key2: "value2",
            },
            commandLineArguments: "args",
            jobType: "DEFAULT",
          },
          jobLogConfigurationOverrideDetails: mockedJobRun.jobLogConfigurationOverrideDetails,
          definedTags: mockedJobRun.definedTags,
        }),
      });
    });
  });

  describe("Initial state", () => {
    it("clone button should be disabled when job run is loading", async () => {
      (useQuery as jest.Mock).mockReturnValue({ loading: true });
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <JobRunClonePanel {...props} />
          </Provider>
        );
      });
      const { getByText } = renderResult;
      const cloneButton = getByText("jobRuns.actions.cloneJobRun");
      expect(cloneButton.getAttribute("aria-disabled")).toBeTruthy();
    });
  });
});

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};

const mockNumberField = (inputField: HTMLElement, value: number) => {
  fireEvent.change(inputField, { target: { value } });
};
const mockUseMutationImplementationGenerator = ({
  createJobRunReturnValue,
}: {
  createJobRunReturnValue: any;
}) => {
  return (mutationArgs: any): any => {
    if (mutationArgs.method === apiClients.odscApi.createJobRun) {
      return createJobRunReturnValue;
    }
  };
};
