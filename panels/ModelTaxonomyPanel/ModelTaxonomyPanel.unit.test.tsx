import * as React from "react";
import * as savant from "oui-savant";
import * as Messages from "@codegen/Messages";
import apiClients from "apiClients";
import { fireEvent, render } from "../../../unittest/utils/reactTestingLibraryUtils";
import {
  CustomAttribute,
  ModelDefinedMetadata,
  ModelTaxonomy,
  ModelTaxonomyPanel,
} from "./ModelTaxonomyPanel";
import { act } from "react-dom/test-utils";
import * as formUtils from "../../utils/formUtils";

describe("ModelTaxonomyPanel", () => {
  const customMetadata: CustomAttribute[] = [
    {
      key: "BaseModel",
      value: "ocid1.model",
      category: "Training Profile",
      description: "base model used",
      id: "1",
    },
    {
      key: "ModelExpiry",
      value: "Never",
      description: "time of expiry",
      id: "2",
    },
  ];
  const definedMetadata: ModelDefinedMetadata = {
    useCaseType: "regression",
    frameworkVersion: "1.0",
    frameworkName: "sci-kit",
    algorithm: "a",
    hyperparameters: "{}",
    artifactTestResults: "{}",
  };
  const mockModelMetadata: ModelTaxonomy = {
    modelDefinedMetadata: definedMetadata,
    customAttributes: customMetadata,
  };
  const props = {
    preSelectedModelTaxonomy: mockModelMetadata,
    onClose: jest.fn(),
    onModelTaxonomySubmit: jest.fn(),
  };
  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;
  let renderResult: any;
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

  describe("onModelTaxonomySubmit", () => {
    it("should call the onModelTaxonomySubmit method when submit button is clicked", () => {
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <ModelTaxonomyPanel {...props} />
        </savant.Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelTaxonomySubmit).toHaveBeenCalled();
    });

    it("should pass empty list when no attributes are provided", () => {
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <ModelTaxonomyPanel
            {...props}
            preSelectedModelTaxonomy={{ modelDefinedMetadata: {}, customAttributes: [] }}
          />
        </savant.Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelTaxonomySubmit).toHaveBeenCalledWith({
        modelDefinedMetadata: {
          algorithm: undefined,
          artifactTestResults: undefined,
          frameworkName: "",
          frameworkVersion: undefined,
          hyperparameters: undefined,
          useCaseType: "",
        },
        customAttributes: [],
      });
    });

    it("should pass correct list of attributes when provided", () => {
      const { getByText } = render(
        <savant.Provider store={mockStore as any}>
          <ModelTaxonomyPanel {...props} />
        </savant.Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      mockModelMetadata.customAttributes[1].category = null;
      expect(props.onModelTaxonomySubmit).toHaveBeenCalledWith(mockModelMetadata);
    });
  });
  describe("Validation", () => {
    it("should validate metadata on Submit Button click", async () => {
      // render
      await act(async () => {
        renderResult = render(
          <savant.Provider store={mockStore as any}>
            <ModelTaxonomyPanel {...props} />
          </savant.Provider>
        );
      });
      const { getByText, getByLabelText } = renderResult;

      // fill fields
      mockTextField(
        getByLabelText("models.selectPanes.modelTaxonomySelect.labels.frameworkVersion"),
        definedMetadata.frameworkVersion
      );
      mockTextField(
        getByLabelText("models.selectPanes.modelTaxonomySelect.labels.algorithm"),
        definedMetadata.algorithm
      );
      mockTextField(
        getByLabelText("models.selectPanes.modelTaxonomySelect.labels.hyperParameters"),
        definedMetadata.hyperparameters
      );
      mockTextField(
        getByLabelText("models.selectPanes.modelTaxonomySelect.labels.artifactTestResults"),
        definedMetadata.artifactTestResults
      );

      // clear mocks and click submit
      mockValidateField.mockClear();
      const submitButton = getByText("actions.select");
      submitButton.click();

      // expects
      expect(mockValidateField).toHaveBeenCalledTimes(10);
      expect(mockValidateField).toHaveBeenCalledWith({
        value: definedMetadata.frameworkVersion,
        minLen: 0,
        maxLen: 255,
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: definedMetadata.algorithm,
        minLen: 0,
        maxLen: 255,
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: definedMetadata.hyperparameters,
        callback: expect.any(Function),
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: definedMetadata.artifactTestResults,
        callback: expect.any(Function),
      });
    });
  });
});

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};
