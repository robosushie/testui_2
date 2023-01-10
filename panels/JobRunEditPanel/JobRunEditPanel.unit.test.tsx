import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));
import { render, fireEvent } from "../../../unittest/utils/reactTestingLibraryUtils";
import * as Messages from "../../../codegen/Messages";
import apiClients from "../../apiClients";
import { JobRunEditPanel } from "./JobRunEditPanel";
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";

describe("JobRunEditDialog", () => {
  const props = {
    jobRunId: "",
    closeHandler: jest.fn(),
    refresh: jest.fn(),
  };
  let mockLoom: any;
  let mockStore: any;

  beforeEach(() => {
    jest.resetAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      response: { data: { displayName: "TestName" } },
    });
    (useMutation as jest.Mock).mockReturnValue({ result: { loading: false }, response: [] });
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("Form test", () => {
    it("should render the dialog", () => {
      const spy = (useMutation as jest.Mock).mockReturnValue({
        reset: jest.fn(),
        invoke: jest.fn(),
      });
      const { getByText, getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <JobRunEditPanel {...props} />
        </Provider>
      );
      const formWrapper = getByOuiTestId("job-run-edit-panel");
      expect(formWrapper).toBeTruthy();
      fireEvent.submit(getByText(Messages.actions.saveChanges()));
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("should display error message if the displayname field is blank", () => {
      const { getByText, getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <JobRunEditPanel {...props} />
        </Provider>
      );
      const textInputWrapper = getByOuiTestId(
        "job-run-edit-panel-displayname-input"
      ) as HTMLInputElement;
      fireEvent.change(textInputWrapper, { target: { value: "" } });
      expect(textInputWrapper.value).toBe("");
      const errorMessage = getByText(Messages.validation.required());
      expect(errorMessage).toBeDefined();
    });
  });

  describe("Dialog rendering", () => {
    const errorMessage = "error";

    it("should be in loading state when loading the result of the last invocation", () => {
      (useMutation as jest.Mock).mockReturnValue({ result: { loading: true } });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunEditPanel {...props} />
        </Provider>
      );
      expect(getByText(Messages.actions.loading())).toBeTruthy();
    });

    it("should display an error message when the last invocation is failing", () => {
      (useMutation as jest.Mock).mockReturnValue({
        result: { error: { body: { message: errorMessage } } },
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunEditPanel {...props} />
        </Provider>
      );
      expect(getByText(errorMessage)).toBeTruthy();
    });

    it("should display an error message when fails to fetch job run data", () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: { body: { message: errorMessage } },
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunEditPanel {...props} />
        </Provider>
      );
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });
});
