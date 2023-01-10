import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useMutation: jest.fn(),
}));
import apiClients from "apiClients";
import { act } from "react-dom/test-utils";
import { fireEvent, render } from "@testing-library/react";
import { JobRunCreatePanel } from "./JobRunCreatePanel";
import * as formUtils from "../../utils/formUtils";
import { ToastNotification } from "oui-react";
import { mockJob } from "../../../unittest/mocks";
import { createStore, Labs, Provider, Store, useConsoleState, useMutation } from "oui-savant";

describe("JobRunCreatePanel", () => {
  const props = {
    onClose: jest.fn(),
    isError: false,
    projectId: "",
    job: mockJob({}),
  };
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;
  let renderResult: any;
  let mockValidateField: jest.SpyInstance<any>;

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
              <JobRunCreatePanel {...props} />
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
              <JobRunCreatePanel {...props} />
            </Provider>
          );
        });
        const { getByText } = renderResult;
        const submitButton = getByText("actions.start");
        submitButton.click();
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
              <JobRunCreatePanel {...props} />
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
        const submitButton = getByText("actions.start");
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
});

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};

const mockNumberField = (inputField: HTMLElement, value: number) => {
  fireEvent.change(inputField, { target: { value } });
};
