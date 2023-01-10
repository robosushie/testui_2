import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useWhitelist: jest.fn(),
}));
import { DownloadArtifactDialog } from "./DownloadArtifactDialog";
import { CustomDataScienceApi } from "../../models/customApiClients";
import { render, fireEvent } from "../../../unittest/utils/reactTestingLibraryUtils";
import { ResourceNames } from "constants/resourceNames";
import { createStore, Labs, Provider, useWhitelist } from "oui-savant";
import apiClients from "../../apiClients";

describe("ModelDownloadArtifactDialog", () => {
  const abortInprogressRequestsSpy = jest.spyOn(
    CustomDataScienceApi.prototype,
    "abortInprogressRequests"
  );
  const allowRequestsSpy = jest.spyOn(CustomDataScienceApi.prototype, "allowRequests");
  const getArtifactSpy = jest.spyOn(CustomDataScienceApi.prototype, "getArtifact");

  const props = {
    ocid: "",
    type: ResourceNames.models,
    closeHandler: jest.fn(),
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
    (useWhitelist as jest.Mock).mockImplementation(() => {
      return ["www.oracle.com"];
    });
  });

  it("should render the Modal for model artifact download", () => {
    const { getByOuiTestId } = render(
      <Provider store={mockStore as any}>
        <DownloadArtifactDialog {...props} />
      </Provider>
    );
    const dialogWrapper = getByOuiTestId(`download-artifact-dialog`);
    expect(dialogWrapper).toBeTruthy();
  });

  it("should render the Modal for job artifact download", () => {
    props.type = ResourceNames.jobs;
    const { getByOuiTestId } = render(
      <Provider store={mockStore as any}>
        <DownloadArtifactDialog {...props} />
      </Provider>
    );
    const dialogWrapper = getByOuiTestId(`download-artifact-dialog`);
    expect(dialogWrapper).toBeTruthy();
  });

  it("should allow requests when dialog opens", () => {
    render(
      <Provider store={mockStore as any}>
        <DownloadArtifactDialog {...props} />
      </Provider>
    );
    expect(allowRequestsSpy).toHaveBeenCalledTimes(1);
  });

  it("should call the getArtifact on open", () => {
    render(
      <Provider store={mockStore as any}>
        <DownloadArtifactDialog {...props} />
      </Provider>
    );
    expect(getArtifactSpy).toHaveBeenCalledTimes(1);
  });

  describe("Cancel Button", () => {
    it("should abort the in-progress requests on clicking the cancel download button", () => {
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <DownloadArtifactDialog {...props} />
        </Provider>
      );
      const cancelDownloadButton = getByText("models.actions.cancelDownloadArtifact");
      fireEvent.click(cancelDownloadButton);
      expect(abortInprogressRequestsSpy).toHaveBeenCalledTimes(1);
    });
  });
});
