import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import apiClients from "../../apiClients";
import { JobDeleteDialog } from "./JobDeleteDialog";
import { render, fireEvent } from "@testing-library/react";
import { createStore, Labs, Provider, TimeInterval, useMutation, useQuery } from "oui-savant";

describe("JobDeleteDialog", () => {
  const jobId = "1";
  const displayName = "jobName";
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockUseQuery: jest.SpyInstance;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockMutationInvoke: jest.Mock;
  let mockMutationReset: jest.Mock;

  beforeEach(() => {
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
    props = { jobId, closeHandler: mockCloseHandler, refresh: mockRefresh };
    mockUseQuery = useQuery as jest.Mock;
    mockUseMutation = useMutation as jest.Mock;
    mockMutationInvoke = jest.fn();
    mockMutationReset = jest.fn();
    mockUseMutation.mockReturnValue({
      invoke: mockMutationInvoke,
      reset: mockMutationReset,
      result: {},
    });
  });

  describe("loading job info", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({ loading: true });
    });

    it("should request the job info", () => {
      render(
        <Provider store={mockStore}>
          <JobDeleteDialog {...props} />
        </Provider>
      );
      expect(mockUseQuery).toHaveBeenCalledWith({
        method: apiClients.odscApi.getJob,
        options: {
          args: { jobId },
          caching: {
            type: "polling",
            pollingInterval: TimeInterval.sm,
          },
        },
      });
    });

    it("should display the loading spinner", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <JobDeleteDialog {...props} />
        </Provider>
      );
      expect(getByText("actions.loading"));
    });
  });

  describe("when the job has finished loading successfully", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        response: {
          data: { jobId, displayName },
        },
      });
    });

    describe("clicking the delete button", () => {
      it("should be disabled when text box is empty", () => {
        const { getByText } = render(
          <Provider store={mockStore}>
            <JobDeleteDialog {...props} />
          </Provider>
        );
        const deleteButton = getByText("jobs.actions.delete");
        expect(deleteButton.getAttribute("aria-disabled")).toBeTruthy();
      });

      it("should be disabled when text box is filled incorrectly", () => {
        const { getByText, getByLabelText } = render(
          <Provider store={mockStore}>
            <JobDeleteDialog {...props} />
          </Provider>
        );
        fireEvent.change(getByLabelText("jobs.deleteAgreement"), {
          target: { value: "wrong value" },
        });
        const deleteButton = getByText("jobs.actions.delete");
        expect(deleteButton.getAttribute("aria-disabled")).toBeTruthy();
      });

      describe("without delete confirmation filled out", () => {
        beforeEach(() => {
          mockMutationInvoke.mockClear();
          mockMutationReset.mockClear();
        });

        it("should not call the mutation reset method", () => {
          const { getByText } = render(
            <Provider store={mockStore}>
              <JobDeleteDialog {...props} />
            </Provider>
          );
          getByText("jobs.actions.delete").click();
          expect(mockMutationReset).not.toHaveBeenCalled();
        });

        it("should not call the mutation invoke method", () => {
          const { getByText } = render(
            <Provider store={mockStore}>
              <JobDeleteDialog {...props} />
            </Provider>
          );
          getByText("jobs.actions.delete").click();
          expect(mockMutationInvoke).not.toHaveBeenCalled();
        });
      });

      describe("with delete confirmation filled", () => {
        beforeEach(() => {
          mockMutationInvoke.mockClear();
          mockMutationReset.mockClear();
        });

        it("should call the mutation reset method", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <JobDeleteDialog {...props} />
            </Provider>
          );

          fireEvent.change(getByLabelText("jobs.deleteAgreement"), {
            target: { value: displayName },
          });

          getByText("jobs.actions.delete").click();
          expect(mockMutationReset).toHaveBeenCalled();
        });

        it("should call the mutation invoke method", () => {
          const { getByText, getByLabelText } = render(
            <Provider store={mockStore}>
              <JobDeleteDialog {...props} />
            </Provider>
          );

          fireEvent.change(getByLabelText("jobs.deleteAgreement"), {
            target: { value: displayName },
          });

          getByText("jobs.actions.delete").click();
          expect(mockMutationInvoke).toHaveBeenCalled();
        });
      });
    });
  });

  describe("when the job has errored", () => {
    it("should display the error message", () => {
      const errorMessage = "error-message";

      mockUseQuery.mockReturnValue({
        error: { body: { message: errorMessage } },
      });

      const { getByText } = render(
        <Provider store={mockStore}>
          <JobDeleteDialog {...props} />
        </Provider>
      );

      expect(getByText(errorMessage));
    });
  });
});
