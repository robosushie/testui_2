import * as React from "react";
import { JobUploadArtifactPanel } from "./JobUploadArtifactPanel";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useWhitelist: jest.fn(),
  useConsoleState: jest.fn(),
}));
import * as formUtils from "../../utils/formUtils";
import * as loomPluginRuntime from "loom-plugin-runtime";
import apiClients from "../../apiClients";
import { render, RenderResult, act } from "@testing-library/react";
import { mockJobArtifactField } from "panels/JobCreatePanel/JobCreatePanel.unit.test";
import { createStore, Labs, Provider, useConsoleState, useQuery, useWhitelist } from "oui-savant";
import { ToastNotification } from "oui-react";

describe("JobUploadArtifactPanel", () => {
  const jobId = "1";
  const activeCompartment = { id: "compartment" };
  let mockCloseHandler: any;
  let mockRefresh: any;
  let mockStore: any;
  let props: any;
  let mockUseConsoleState: jest.SpyInstance<any>;
  let mockValidateField: jest.SpyInstance<any>;
  let jobArtifactValue: File;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCloseHandler = jest.fn();
    mockRefresh = jest.fn();
    props = { jobId, closeHandler: mockCloseHandler, refresh: mockRefresh };

    const mockLoom = Labs.MockLoom.createMockLoom();
    await mockLoom.mockPluginRuntime.start({});
    jest.spyOn(loomPluginRuntime, "getAuthClient").mockReturnValue({
      signRequest: jest
        .fn()
        .mockReturnValue({ method: "GET", headers: [], arrayBuffer: jest.fn() }),
    } as any);

    (useQuery as jest.Mock).mockImplementation(jest.fn());
    (useWhitelist as jest.Mock).mockReturnValue([true]);
    mockUseConsoleState = useConsoleState as jest.Mock;
    mockUseConsoleState.mockImplementation(() => ({ activeCompartment }));
    mockValidateField = jest.spyOn(formUtils, "validateField");
    jest.spyOn(ToastNotification, "create").mockReturnValue();
    apiClients.identityApi.listTagNamespaces = jest.fn();
    apiClients.identityApi.listTags = jest.fn();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("onSubmit", () => {
    let renderResult: RenderResult;
    describe("valid artifact", () => {
      jobArtifactValue = new File(["file contents"], "jobArtifact.py");
      beforeEach(async (done) => {
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore}>
              <JobUploadArtifactPanel {...props} />
            </Provider>
          );
        });
        const { getByLabelText, getByText } = renderResult;
        mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
        getByText("actions.upload").click();
        done();
      });

      it("should validate the jobArtifact", () => {
        expect(mockValidateField).toHaveBeenCalledWith({
          value: jobArtifactValue,
          required: true,
          callback: expect.any(Function),
        });
      });

      it("should show the loading spinner", () => {
        const { getByText } = renderResult;
        expect(getByText("actions.loading"));
      });
    });

    describe("invalid artifact", () => {
      xit("should show an error", async (done) => {
        jobArtifactValue = new File(["file contents"], "jobArtifact.badex", { type: "image/png" });
        await act(async () => {
          renderResult = await render(<JobUploadArtifactPanel {...props} />);
          const { getByLabelText, getByText } = renderResult;
          mockJobArtifactField(getByLabelText("jobs.actions.uploadArtifact"), jobArtifactValue);
          getByText("actions.upload").click();
          done();
        });
        expect(ToastNotification.create).toHaveBeenCalled();
      });
    });
  });
});
