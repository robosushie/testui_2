import * as React from "react";
import { render, fireEvent } from "../../../unittest/utils/reactTestingLibraryUtils";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import * as Messages from "../../../codegen/Messages";
import { JobRunCancelDialog } from "./JobRunCancelDialog";
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";

describe("JobRunCancelDialog", () => {
  const props = {
    jobRunId: "",
    closeHandler: jest.fn(),
    refresh: jest.fn(),
  };
  const displayName = "jobRunName";
  let mockLoom: any;
  let mockStore: any;

  beforeEach(() => {
    jest.resetAllMocks();
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      response: { data: { displayName: "jobRunName" } },
    });
    (useMutation as jest.Mock).mockReturnValue({ loading: false, response: [] });
  });

  describe("Button tests", () => {
    it("the Cancel Button should be disabled before filling out form", () => {
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunCancelDialog {...props} />
        </Provider>
      );
      const cancelButtonWrapper = getByText(
        Messages.jobRuns.actions.confirm()
      ) as HTMLButtonElement;
      expect(cancelButtonWrapper.getAttribute("aria-disabled")).toBeTruthy();
    });

    it("the Cancel Button should be disabled with incorrect field data filled in", () => {
      const { getByText, getByLabelText } = render(
        <Provider store={mockStore as any}>
          <JobRunCancelDialog {...props} />
        </Provider>
      );
      fireEvent.change(getByLabelText("jobRuns.cancelAgreement"), {
        target: { value: "wrong value" },
      });
      const cancelButtonWrapper = getByText(
        Messages.jobRuns.actions.confirm()
      ) as HTMLButtonElement;
      expect(cancelButtonWrapper.getAttribute("aria-disabled")).toBeTruthy();
    });

    it("the Cancel Button should be enabled after filling out form", () => {
      const spy = (useMutation as jest.Mock).mockReturnValue({
        reset: jest.fn(),
        invoke: jest.fn(),
      });
      const { getByText, getByLabelText } = render(
        <Provider store={mockStore as any}>
          <JobRunCancelDialog {...props} />
        </Provider>
      );
      fireEvent.change(getByLabelText("jobRuns.cancelAgreement"), {
        target: { value: displayName },
      });
      const cancelButtonWrapper = getByText(
        Messages.jobRuns.actions.confirm()
      ) as HTMLButtonElement;
      expect(cancelButtonWrapper.getAttribute("aria-disabled")).toBeFalsy();
      fireEvent.click(cancelButtonWrapper);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dialog Rendering ", () => {
    it("should be in loading state when fetching job run is in a loading state", () => {
      (useQuery as jest.Mock).mockReturnValue({ loading: true });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunCancelDialog {...props} />
        </Provider>
      );
      expect(getByText(Messages.actions.loading())).toBeTruthy();
    });

    it("shoule be in loading state when there's a pending invocation", () => {
      (useMutation as jest.Mock).mockReturnValue({ result: { loading: true } });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunCancelDialog {...props} />
        </Provider>
      );
      expect(getByText(Messages.actions.loading())).toBeTruthy();
    });

    it("should display error message when invocation fails", () => {
      const errorMessage = "error";
      (useMutation as jest.Mock).mockReturnValue({
        result: { error: { body: { message: errorMessage } } },
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunCancelDialog {...props} />
        </Provider>
      );
      expect(getByText(errorMessage)).toBeTruthy();
    });

    it("should display error message when fetching job run data fails", () => {
      const errorMessage = "error";
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: { body: { message: errorMessage } },
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunCancelDialog {...props} />
        </Provider>
      );
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });
});
