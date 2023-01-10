import * as React from "react";
import * as savant from "oui-savant";
import * as Messages from "@codegen/Messages";
import apiClients from "apiClients";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import { LoggingPanel } from "./LoggingPanel";
import { Compartment } from "identity-control-plane-api-client";

describe("JobLoggingPanel", () => {
  const compartment: Compartment = {
    id: "1",
    compartmentId: "cid",
    name: "compname",
    description: "desc",
    timeCreated: new Date(),
    lifecycleState: "ACTIVE",
  };
  const props = {
    activeCompartment: compartment,
    onClose: jest.fn(),
    onLoggingSubmit: jest.fn(),
    setLogGroupName: jest.fn(),
    setLogName: jest.fn(),
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
    it("should call the onLoggingSubmit method when select button is clicked", () => {
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <LoggingPanel {...props} />
        </savant.Provider>
      );
      const selectButton = getByText(Messages.actions.select());
      selectButton.click();
      expect(props.onLoggingSubmit).toHaveBeenCalled();
    });

    it("should pass the logGroupId but not logId when enableAutoLogCreation is true", () => {
      const logGroupId = "test-log-group-id";
      const logId = "test-log-id";
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <LoggingPanel
            {...props}
            defaultValues={{ logGroupId, logId, enableLogging: true, enableAutoLogCreation: true }}
          />
        </savant.Provider>
      );
      const selectButton = getByText(Messages.actions.select());
      selectButton.click();
      expect(props.onLoggingSubmit).toHaveBeenCalledWith({
        logGroupId,
        logId: null,
        enableLogging: true,
        enableAutoLogCreation: true,
      });
    });

    it("should pass the logGroupId and logId when enableAutoLogCreation is false", () => {
      const logGroupId = "test-log-group-id";
      const logId = "test-log-id";
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <LoggingPanel
            {...props}
            defaultValues={{ logGroupId, logId, enableLogging: true, enableAutoLogCreation: false }}
          />
        </savant.Provider>
      );
      const selectButton = getByText(Messages.actions.select());
      selectButton.click();
      expect(props.onLoggingSubmit).toHaveBeenCalledWith({
        logGroupId,
        logId,
        enableLogging: true,
        enableAutoLogCreation: false,
      });
    });
  });
});
