import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
  useWhitelist: jest.fn(),
  useConsoleState: jest.fn(),
}));
import * as formUtils from "../../utils/formUtils";
import * as loomPluginRuntime from "loom-plugin-runtime";
import apiClients from "../../apiClients";
import { ModelUploadArtifactDialog } from "./ModelUploadArtifactDialog";
import { render, RenderResult, act, fireEvent } from "@testing-library/react";
import * as savant from "oui-savant";

describe("ModelUploadArtifactDialog", () => {
  const projectId = "1";
  const activeCompartment = { id: "compartment" };
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockValidateField: jest.SpyInstance<any>;
  let mockStore: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCloseHandler = jest.fn();
    mockRefresh = jest.fn();
    props = { projectId, isError: false, closeHandler: mockCloseHandler, refresh: mockRefresh };

    const mockLoom = savant.Labs.MockLoom.createMockLoom();
    mockStore = savant.createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    await mockLoom.mockPluginRuntime.start({});
    jest.spyOn(loomPluginRuntime, "getAuthClient").mockReturnValue({
      signRequest: jest
        .fn()
        .mockReturnValue({ method: "GET", headers: [], arrayBuffer: jest.fn() }),
    } as any);

    jest.spyOn(savant, "useWhitelist").mockReturnValue([true]);
    (savant.useConsoleState as jest.Mock).mockImplementation(() => {
      return { activeCompartment };
    });
    mockValidateField = jest.spyOn(formUtils, "validateField");
    apiClients.identityApi.listTagNamespaces = jest.fn();
    apiClients.identityApi.listTags = jest.fn();
  });

  describe("onSubmit", () => {
    const modelArtifactValue = new File(["file contents"], "modelArtifact", {
      type: "image/png",
    });

    let renderResult: RenderResult;

    beforeEach(async (done) => {
      await act(async () => {
        renderResult = await render(
          <savant.Provider store={mockStore as any}>
            <ModelUploadArtifactDialog {...props} />
          </savant.Provider>
        );
        const { getByLabelText, getByText } = renderResult;
        mockModelArtifactField(getByLabelText("models.labels.modelArtifact"), modelArtifactValue);
        getByText("models.actions.uploadArtifact").click();
        done();
      });
    });

    it("should validate the modelArtifact", () => {
      expect(mockValidateField).toHaveBeenCalledWith({
        value: modelArtifactValue,
        required: true,
        callback: expect.any(Function),
      });
    });

    it("should show the loading spinner", () => {
      const { getByText } = renderResult;
      expect(getByText("actions.loading"));
    });
  });
});

const mockModelArtifactField = (modelArtifactInput: HTMLElement, modelArtifactValue: File) => {
  // https://github.com/kentcdodds/react-testing-library-examples/pull/1/files
  Object.defineProperty(modelArtifactInput, "files", {
    value: [modelArtifactValue],
  });
  fireEvent.change(modelArtifactInput);
  return modelArtifactValue;
};

// const mockTextField = (inputField: HTMLElement, value: string) => {
//   fireEvent.change(inputField, { target: { value } });
// };
