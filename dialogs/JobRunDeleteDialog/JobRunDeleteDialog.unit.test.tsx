import * as React from "react";
import { render, fireEvent } from "../../../unittest/utils/reactTestingLibraryUtils";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import * as Messages from "../../../codegen/Messages";
import { JobRunDeleteDialog } from "./JobRunDeleteDialog";
import { createStore, Labs, Provider, useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";

describe("JobRunDeleteDialog", () => {
  const props = {
    jobRunId: "",
    closeHandler: jest.fn(),
    refresh: jest.fn(),
  };
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
      response: { data: "Response Data" },
    });
    (useMutation as jest.Mock).mockReturnValue({ loading: false, response: [] });
  });

  describe("Button tests", () => {
    it("the Delete Button should be enabled", () => {
      const spy = (useMutation as jest.Mock).mockReturnValue({
        reset: jest.fn(),
        invoke: jest.fn(),
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunDeleteDialog {...props} />
        </Provider>
      );
      const deleteButtonWrapper = getByText(Messages.jobRuns.actions.delete()) as HTMLButtonElement;
      expect(deleteButtonWrapper.getAttribute("aria-disabled")).toBeFalsy();
      fireEvent.click(deleteButtonWrapper);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dialog Rendering ", () => {
    it("should be in loading state when fetching job run is in a loading state", () => {
      (useQuery as jest.Mock).mockReturnValue({ loading: true });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunDeleteDialog {...props} />
        </Provider>
      );
      expect(getByText(Messages.actions.loading())).toBeTruthy();
    });

    it("shoule be in loading state when there's a pending invocation", () => {
      (useMutation as jest.Mock).mockReturnValue({ result: { loading: true } });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <JobRunDeleteDialog {...props} />
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
          <JobRunDeleteDialog {...props} />
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
          <JobRunDeleteDialog {...props} />
        </Provider>
      );
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });
});
