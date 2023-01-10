import * as React from "react";
import { fireEvent, RenderResult, waitFor } from "@testing-library/react";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import * as formUtils from "../../utils/formUtils";
import { ModelArtifactPanel } from "./ModelArtifactPanel";
import * as savant from "oui-savant";
import apiClients from "../../apiClients";
import * as Messages from "@codegen/Messages";

describe("ModelArtifactPanel", () => {
  const props = {
    onClose: jest.fn(),
    preSelectedArtifact: null as File,
    onArtifactDataSubmit: jest.fn(),
  };
  const preSelectedProps = {
    onClose: props.onClose,
    preSelectedArtifact: new File(["123"], "model.zip", {
      type: "application/x-zip-compressed",
    }),
    onArtifactDataSubmit: props.onArtifactDataSubmit,
  };

  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;

  let mockValidateField: jest.SpyInstance<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateField = jest.spyOn(formUtils, "validateField");
    mockLoom = savant.Labs.MockLoom.createMockLoom();
    mockStore = savant.createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("onSubmit", () => {
    const modelArtifactValue = new File(["file contents"], "modelArtifact", {
      type: "image/png",
    });
    const modelArtifactValueMinSize = new File([""], "modelArtifact", {
      type: "image/png",
    });

    let renderResult: RenderResult;

    it("should validate the modelArtifact when nothing is uploaded", () => {
      renderResult = renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelArtifactPanel {...props} />
        </savant.Provider>
      );
      const { getByText } = renderResult;
      getByText(Messages.models.actions.downloadSampleArtifact()).click();
      getByText(Messages.models.actions.upload()).click();
      expect(getByText("models.actions.downloadSampleArtifact")).toBeTruthy();
      expect(mockValidateField).toHaveBeenCalledTimes(2);
      expect(getByText("validation.required")).toBeTruthy();
    });

    it("should validate the modelArtifact when artifact is uploaded", () => {
      renderResult = renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelArtifactPanel {...props} />
        </savant.Provider>
      );
      const { getByText, getByLabelText } = renderResult;

      expect(getByText("models.actions.downloadSampleArtifact")).toBeTruthy();
      mockModelArtifactUploadField(getByLabelText("models.labels.uploadLabel"), modelArtifactValue);
      expect(mockValidateField).toHaveBeenCalledTimes(3);
      expect(mockValidateField).toHaveBeenCalledWith({
        value: modelArtifactValue,
        required: true,
        callback: expect.any(Function),
        callbackMessage: "validation.minSize",
      });
      getByText(Messages.models.actions.upload()).click();
    });

    it("should validate min size of the modelArtifact when artifact is uploaded", () => {
      renderResult = renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelArtifactPanel {...props} />
        </savant.Provider>
      );
      const { getByText, getByLabelText } = renderResult;

      expect(getByText("models.actions.downloadSampleArtifact")).toBeTruthy();
      mockModelArtifactUploadField(
        getByLabelText("models.labels.uploadLabel"),
        modelArtifactValueMinSize
      );
      expect(mockValidateField).toHaveBeenCalledTimes(3);
      expect(mockValidateField).toHaveBeenCalledWith({
        value: modelArtifactValueMinSize,
        required: true,
        callback: expect.any(Function),
        callbackMessage: "validation.minSize",
      });
      getByText(Messages.models.actions.upload()).click();
      expect(getByText("validation.minSize")).toBeTruthy();
    });

    it("should process preSelectedFile", async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelArtifactPanel {...preSelectedProps} />
        </savant.Provider>
      );
      await waitFor(() => expect(mockValidateField).toHaveBeenCalledTimes(1));

      expect(mockValidateField).toHaveBeenCalledWith({
        value: preSelectedProps.preSelectedArtifact,
        required: true,
        callback: expect.any(Function),
        callbackMessage: "validation.minSize",
      });
    });

    it("should clear file contents after deselecting", async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelArtifactPanel {...preSelectedProps} />
        </savant.Provider>
      );
      const { getAllByText } = renderResult;
      expect(mockValidateField).toHaveBeenCalledTimes(1);
      mockValidateField.mockReset();
      const removeButtons = getAllByText("removeFileButton");
      // clear input schema
      removeButtons[0].click();
      expect(mockValidateField).toHaveBeenCalledTimes(1);
      expect(mockValidateField).toHaveBeenCalledWith({
        value: null,
        required: true,
        callback: expect.any(Function),
        callbackMessage: "validation.minSize",
      });
    });
  });

  const mockModelArtifactUploadField = (
    modelArtifactInput: HTMLElement,
    modelArtifactValue: File
  ) => {
    Object.defineProperty(modelArtifactInput, "files", {
      value: [modelArtifactValue],
    });
    fireEvent.change(modelArtifactInput);
    return modelArtifactValue;
  };
});
