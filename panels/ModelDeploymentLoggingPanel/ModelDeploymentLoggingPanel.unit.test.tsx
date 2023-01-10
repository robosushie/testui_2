import * as React from "react";
import * as savant from "oui-savant";
import * as Messages from "@codegen/Messages";
import apiClients from "apiClients";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import { ModelDeploymentLoggingPanel } from "./ModelDeploymentLoggingPanel";

describe("ModelDeploymentLoggingPanel", () => {
  const props = {
    compartmentId: "compartmentId",
    onClose: jest.fn(),
    onLoggingSubmit: jest.fn(),
  };
  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoom = savant.Labs.MockLoom.createMockLoom();
    mockStore = savant.createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("onLoggingSubmit", () => {
    it("should call the onLoggingSubmit method when submit button is clicked", () => {
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <ModelDeploymentLoggingPanel {...props} />
        </savant.Provider>
      );
      const submitButton = getByText(Messages.actions.submit());
      submitButton.click();
      expect(props.onLoggingSubmit).toHaveBeenCalled();
    });

    it("should not pass the logGroupId when a logId is not provided", () => {
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <ModelDeploymentLoggingPanel
            {...props}
            defaultValues={{ access: { logGroupId: "a log group id", logId: undefined } }}
          />
        </savant.Provider>
      );
      const submitButton = getByText(Messages.actions.submit());
      submitButton.click();
      expect(props.onLoggingSubmit).toHaveBeenCalledWith({ access: null, predict: null });
    });

    it("should pass the logGroupId and the logId when both are provided", () => {
      const logGroupId = "test-log-group-id";
      const logId = "test-log-id";
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <ModelDeploymentLoggingPanel
            {...props}
            defaultValues={{ access: { logGroupId, logId } }}
          />
        </savant.Provider>
      );
      const submitButton = getByText(Messages.actions.submit());
      submitButton.click();
      expect(props.onLoggingSubmit).toHaveBeenCalledWith({
        access: { logGroupId, logId },
        predict: null,
      });
    });
  });
});
