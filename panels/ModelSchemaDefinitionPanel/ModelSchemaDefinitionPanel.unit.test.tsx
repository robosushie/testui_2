import * as React from "react";
import { RenderResult, waitFor } from "@testing-library/react";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import * as formUtils from "../../utils/formUtils";
import { ModelSchemaDefinitionPanel } from "./ModelSchemaDefinitionPanel";
import * as Messages from "@codegen/Messages";
import * as savant from "oui-savant";
import apiClients from "../../apiClients";
import userEvent from "@testing-library/user-event";
import { SchemaFiles } from "../../constants/modelSchema";

describe("ModelSchemaPanel", () => {
  const outputSchemaContent = '{"name":"odsc", "id":"2"}';
  const modelOutputSchemaValue = new File([outputSchemaContent], "modelOutputSchema.json", {
    type: "JSON",
  });
  const inputSchemaContent = '{"name":"oracle", "id": "1"}';
  const modelInputSchemaValue = new File([inputSchemaContent], "modelInputSchema.json", {
    type: "JSON",
  });
  const props = {
    onClose: jest.fn(),
    preSelectedSchema: null as SchemaFiles,
    onModelSchemaSubmit: jest.fn(() => {}),
  };
  const schemaProps = {
    onClose: props.onClose,
    preSelectedSchema: {
      modelSchemaInputText: inputSchemaContent,
      modelSchemaOutputText: outputSchemaContent,
      selectedInputSchemaFile: modelInputSchemaValue,
      selectedOutputSchemaFile: modelOutputSchemaValue,
    },
    onModelSchemaSubmit: props.onModelSchemaSubmit,
  };

  let mockValidateField: jest.SpyInstance<any>;
  let mockOnSubmit: jest.SpyInstance<any>;
  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit = jest.spyOn(props, "onModelSchemaSubmit");
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
    let renderResult: RenderResult;

    it("should disable the upload button when nothing is selected", () => {
      renderResult = render(<ModelSchemaDefinitionPanel {...props} />);
      const { getByText } = renderResult;
      const selectButton = getByText(Messages.actions.select()) as HTMLInputElement;
      expect(selectButton.hasAttribute("disabled"));
    });

    it("should validate the model Schema when inputSchema File is uploaded", async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelSchemaDefinitionPanel {...props} />
        </savant.Provider>
      );

      const { getByText, findByLabelText } = renderResult;

      mockModelSchemaUploadField(
        (await findByLabelText(
          "models.selectPanes.modelSchemaSelect.labels.inputSchemaUploadLabel"
        )) as HTMLInputElement,
        modelInputSchemaValue
      );
      const selectButton = getByText(Messages.actions.select());
      await waitFor(() => expect(selectButton.hasAttribute("disabled")).toBeFalsy());
      await waitFor(() => expect(mockValidateField).toHaveBeenCalledTimes(4));
      expect(mockValidateField).toHaveBeenNthCalledWith(5, {
        value: inputSchemaContent,
        callback: expect.any(Function),
        callbackMessage: undefined,
      });
      selectButton.click();
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith({
        modelSchemaInputText: inputSchemaContent,
        modelSchemaOutputText: null,
        selectedInputSchemaFile: modelInputSchemaValue,
        selectedOutputSchemaFile: null,
      });
    });

    it("should validate the model Schema when outputSchema File is uploaded", async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelSchemaDefinitionPanel {...props} />
        </savant.Provider>
      );
      const { getByText, findByLabelText } = renderResult;

      mockModelSchemaUploadField(
        (await findByLabelText(
          "models.selectPanes.modelSchemaSelect.labels.outputSchemaUploadLabel"
        )) as HTMLInputElement,
        modelOutputSchemaValue
      );
      const selectButton = getByText(Messages.actions.select());
      await waitFor(() => {
        expect(selectButton.hasAttribute("disabled")).toBeFalsy();
      });

      await waitFor(() => expect(mockValidateField).toHaveBeenCalledTimes(6));

      expect(mockValidateField).toHaveBeenLastCalledWith({
        value: outputSchemaContent,
        callback: expect.any(Function),
        callbackMessage: undefined,
      });

      selectButton.click();
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith({
        modelSchemaInputText: null,
        modelSchemaOutputText: outputSchemaContent,
        selectedInputSchemaFile: null,
        selectedOutputSchemaFile: modelOutputSchemaValue,
      });
    });

    it("should process preSelectedSchema", async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelSchemaDefinitionPanel {...schemaProps} />
        </savant.Provider>
      );
      const { getByText } = renderResult;

      const selectButton = getByText(Messages.actions.select());
      await waitFor(() => {
        expect(selectButton.hasAttribute("disabled")).toBeFalsy();
      });

      await waitFor(() => expect(mockValidateField).toHaveBeenCalledTimes(2));

      expect(mockValidateField).toHaveBeenCalledWith({
        value: outputSchemaContent,
        callback: expect.any(Function),
        callbackMessage: undefined,
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: inputSchemaContent,
        callback: expect.any(Function),
        callbackMessage: undefined,
      });

      selectButton.click();
      await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(1));
      expect(mockOnSubmit).toHaveBeenCalledWith({
        modelSchemaInputText: inputSchemaContent,
        modelSchemaOutputText: outputSchemaContent,
        selectedInputSchemaFile: modelInputSchemaValue,
        selectedOutputSchemaFile: modelOutputSchemaValue,
      });
    });

    it("should clear file contents after deselecting", async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <ModelSchemaDefinitionPanel {...schemaProps} />
        </savant.Provider>
      );
      const { getAllByText } = renderResult;
      expect(mockValidateField).toHaveBeenCalledTimes(2);
      mockValidateField.mockReset();
      const removeButtons = getAllByText("removeFileButton");
      // clear input schema
      removeButtons[0].click();
      expect(mockValidateField).toHaveBeenCalledTimes(2);
      expect(mockValidateField).toHaveBeenNthCalledWith(1, {
        value: "{}",
        callback: expect.any(Function),
        callbackMessage: undefined,
      });
      expect(mockValidateField).toHaveBeenLastCalledWith({
        value: outputSchemaContent,
        callback: expect.any(Function),
        callbackMessage: undefined,
      });
      mockValidateField.mockReset();
      // clear output schema
      removeButtons[1].click();
      expect(mockValidateField).toHaveBeenCalledTimes(2);
      expect(mockValidateField).toHaveBeenNthCalledWith(1, {
        value: "{}",
        callback: expect.any(Function),
        callbackMessage: undefined,
      });
      expect(mockValidateField).toHaveBeenLastCalledWith({
        value: "{}",
        callback: expect.any(Function),
        callbackMessage: undefined,
      });
    });
  });

  const mockModelSchemaUploadField = (
    modelSchemaInput: HTMLInputElement,
    modelSchemaValue: File
  ) => {
    userEvent.upload(modelSchemaInput, modelSchemaValue);
    expect(modelSchemaInput.files[0]).toStrictEqual(modelSchemaValue);
  };
});
