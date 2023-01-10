import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useWhitelist: jest.fn(),
}));
import apiClients from "apiClients";
import { act } from "react-dom/test-utils";
import { fireEvent, render, RenderResult } from "@testing-library/react";
import ModelCreatePanel from "./ModelCreatePanel";
import * as formUtils from "../../utils/formUtils";
import { ToastNotification } from "oui-react";
import { DisclosureLink } from "oui-savant/dist/codegen/Messages";
import {
  createStore,
  Labs,
  Provider,
  Store,
  useConsoleState,
  useMutation,
  useQuery,
  useWhitelist,
} from "oui-savant";
import * as Messages from "@codegen/Messages";

describe("ModelCreatePanel", () => {
  const props = {
    onClose: jest.fn(),
    refresh: jest.fn(),
    projectId: "1",
  };
  const activeCompartment = { id: "ID" };
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;
  let renderResult: any;
  let mockValidateField: jest.SpyInstance<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({
      activeCompartment: { id: "ID" },
      compartments: [{ id: "ID", name: "compartmentId" }],
    });
    jest.spyOn(ToastNotification, "create").mockReturnValue();
    (useWhitelist as jest.Mock).mockReturnValue([true]);
    mockValidateField = jest.spyOn(formUtils, "validateField");
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("Notifications", () => {
    describe("Errors", () => {
      it("should display a ToastNotification if submitting data fails", async () => {
        (useMutation as jest.Mock).mockReturnValue({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { error: { body: { message: "error" } } },
        });
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelCreatePanel {...props} />
            </Provider>
          );
        });
        expect(ToastNotification.create).toHaveBeenCalled();
      });
    });

    describe("Loader", () => {
      it("should display a loader while data submitting", async () => {
        (useMutation as jest.Mock).mockReturnValue({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { loading: true },
        });
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelCreatePanel {...props} />
            </Provider>
          );
        });
        expect(renderResult.getByText("actions.loading")).toBeTruthy();
      });
    });
  });

  describe("Form tests", () => {
    describe("validation", () => {
      it("should validate displayName, description on Submit", async () => {
        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          response: {
            data: [
              {
                id: "ocid.datasciejobrun",
                compartmentId: "compartmentId",
                projectId: "projectId",
                displayName: "datasciejobrun",
                description: "",
                lifecycleState: "ACTIVE",
              },
            ],
          },
        });
        // render
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelCreatePanel {...props} />
            </Provider>
          );
        });
        const { getByText, getAllByText } = renderResult;

        // fill fields
        const { displayNameValue, descriptionValue, modelArtifactValue } =
          mockValidateFields(renderResult);
        const submit = getAllByText("models.actions.upload");
        submit[0].click();

        // clear mocks and click submit
        mockValidateField.mockClear();
        const submitButton = getByText("actions.create");
        submitButton.click();

        // expects
        expect(mockValidateField).toHaveBeenCalledTimes(3);
        expect(mockValidateField).toHaveBeenCalledWith({
          value: displayNameValue,
          required: false,
          maxLen: 255,
        });
        expect(mockValidateField).toHaveBeenCalledWith({
          value: descriptionValue,
          required: false,
          maxLen: 400,
        });
        expect(mockValidateField).toHaveBeenCalledWith(
          expect.objectContaining({
            value: modelArtifactValue,
            required: true,
          })
        );
      });
    });
  });

  describe("onSubmit", () => {
    let mockModelMutationReset: jest.Mock;
    let mockModelMutationInvoke: jest.Mock;
    describe("Successful validation", () => {
      it("should reset the modelMutation", async () => {
        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          response: {
            data: [
              {
                id: "ocid.datasciejobrun",
                compartmentId: "compartmentId",
                projectId: "projectId",
                displayName: "datasciejobrun",
                description: "",
                lifecycleState: "ACTIVE",
              },
            ],
          },
        });
        let renderResult: RenderResult;

        mockModelMutationReset = jest.fn();
        mockModelMutationInvoke = jest.fn();
        (useMutation as jest.Mock).mockReturnValue({
          reset: mockModelMutationReset,
          invoke: mockModelMutationInvoke,
          result: { loading: false },
        });

        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <ModelCreatePanel {...props} />
            </Provider>
          );
        });

        const { getByText, getAllByText } = renderResult;

        // fill fields
        mockValidateFields(renderResult);
        const submit = getAllByText("models.actions.upload");
        submit[0].click();
        const submitButton = getByText("actions.create");
        submitButton.click();
        expect(mockModelMutationReset).toHaveBeenCalled();
      });

      it("should invoke the modelMutation with the proper details", async () => {
        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          response: {
            data: [
              {
                id: "ocid.datasciejobrun",
                compartmentId: "compartmentId",
                projectId: "projectId",
                displayName: "datasciejobrun",
                description: "",
                lifecycleState: "ACTIVE",
              },
            ],
          },
        });
        // render
        let renderResult: RenderResult;

        mockModelMutationReset = jest.fn();
        mockModelMutationInvoke = jest.fn();

        (useMutation as jest.Mock).mockReturnValue({
          reset: mockModelMutationReset,
          invoke: mockModelMutationInvoke,
          result: { loading: false },
        });

        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <ModelCreatePanel {...props} />
            </Provider>
          );
        });

        const { getByText, getAllByText } = renderResult;

        // fill fields
        const { displayNameValue, descriptionValue } = mockValidateFields(renderResult);

        const submit = getAllByText("models.actions.upload");
        // upload artifact
        submit[0].click();
        const select = getAllByText("actions.select");
        // for provenance and taxonomy
        select[0].click();
        select[1].click();
        select[2].click();
        select[3].click();
        const submitButton = getByText("actions.create");
        submitButton.click();

        expect(mockModelMutationInvoke).toHaveBeenCalledWith({
          createModelDetails: {
            projectId: "1",
            compartmentId: activeCompartment.id,
            displayName: displayNameValue,
            description: descriptionValue,
            customMetadataList: [],
            definedMetadataList: [
              { key: "UseCaseType", value: "binary_classification" },
              { key: "Framework", value: "scikit-learn" },
              { key: "Algorithm", value: "NLP" },
            ],
            inputSchema: null,
            outputSchema: null,
            definedTags: {},
            freeformTags: {},
            modelVersionSetId: null,
            versionLabel: null,
          },
        });
      });
    });

    describe("onSubmit with Job run Model Provenance's training OCID ", () => {
      it("should reset the modelMutation with job run training ocid and model provenance sgould allow to change the card option", async () => {
        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          response: {
            data: [
              {
                id: "ocid.datasciejobrun",
                compartmentId: "compartmentId",
                projectId: "projectId",
                displayName: "datasciejobrun",
                description: "",
                lifecycleState: "ACTIVE",
              },
            ],
          },
        });
        let renderResult: RenderResult;

        mockModelMutationReset = jest.fn();
        mockModelMutationInvoke = jest.fn();
        (useMutation as jest.Mock).mockReturnValue({
          reset: mockModelMutationReset,
          invoke: mockModelMutationInvoke,
          result: { loading: false },
        });

        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <ModelCreatePanel {...props} />
            </Provider>
          );
        });

        const { getByText, getAllByText } = renderResult;

        // fill fields
        mockValidateFieldsWithJobRunOcid(renderResult);
        const submit = getAllByText("models.actions.upload");
        submit[0].click();
        const submitButton = getByText("actions.create");
        submitButton.click();
        expect(mockModelMutationReset).toHaveBeenCalled();
      });
    });

    describe("Unsuccessful validation", () => {
      let renderResult: RenderResult;
      beforeEach(async () => {
        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <ModelCreatePanel {...props} />
            </Provider>
          );
        });
      });

      it("should not reset and should not invoke the modelMutation", () => {
        const { getByText, getByLabelText } = renderResult;
        const displayNameValue =
          "displayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayName";
        mockTextField(getByLabelText("models.labels.name"), displayNameValue);

        const submitButton = getByText("actions.create");
        submitButton.click();
        expect(mockModelMutationReset).not.toHaveBeenCalled();
        expect(mockModelMutationInvoke).not.toHaveBeenCalled();
      });
    });
  });
});

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};
const mockModelFileField = (modelFileInput: HTMLElement, modelFileValue: File) => {
  Object.defineProperty(modelFileInput, "files", {
    value: [modelFileValue],
  });
  fireEvent.change(modelFileInput);
  return modelFileValue;
};
const mockValidateFields = (renderResult: RenderResult) => {
  const { getAllByText, getByLabelText } = renderResult;

  const displayNameValue = "displayName";
  mockTextField(getByLabelText("models.labels.name"), displayNameValue);

  const descriptionValue = "description";
  mockTextField(getByLabelText("models.labels.description"), descriptionValue);
  const selectButton = getAllByText("models.actions.select");
  selectButton[0].click();
  selectButton[1].click();
  selectButton[2].click();
  selectButton[3].click();
  selectButton[4].click();
  const modelArtifactValue = new File(["file contents"], "modelArtifact", {
    type: "image/png",
  });
  mockModelFileField(getByLabelText("models.labels.uploadLabel"), modelArtifactValue);
  mockTextField(getByLabelText("models.selectPanes.modelTaxonomySelect.labels.algorithm"), "NLP");
  mockTextField(
    getByLabelText("models.selectPanes.modelTaxonomySelect.labels.useCase"),
    "binary_classification"
  );
  mockTextField(
    getByLabelText("models.selectPanes.modelTaxonomySelect.labels.frameworkName"),
    "scikit-learn"
  );

  const modelInputSchemaValue = new File(["file contents"], "inputSchema.json", {
    type: "JSON",
  });
  mockModelFileField(
    getByLabelText("models.selectPanes.modelSchemaSelect.labels.inputSchemaUploadLabel"),
    modelInputSchemaValue
  );
  const modelOutputSchemaValue = new File(["file contents"], "outputSchema.json", {
    type: "JSON",
  });
  mockModelFileField(
    getByLabelText("models.selectPanes.modelSchemaSelect.labels.outputSchemaUploadLabel"),
    modelOutputSchemaValue
  );
  const newModelVersionSetData = getByLabelText(
    Messages.models.selectPanes.modelVersionSet.labels.createNewModelVersionSet()
  );
  fireEvent.click(newModelVersionSetData);
  mockTextField(getByLabelText("models.selectPanes.modelVersionSet.labels.name"), "versionSet");
  mockTextField(
    getByLabelText("models.selectPanes.modelVersionSet.labels.description"),
    "description"
  );
  mockTextField(
    getByLabelText("models.selectPanes.modelVersionSet.labels.versionLabel"),
    "versionLabel"
  );
  const getTrainingoptionText = getAllByText(DisclosureLink.collapsedLabel());
  getTrainingoptionText[0].click();
  getTrainingoptionText[1].click();
  mockTextField(
    getByLabelText("models.selectPanes.modelProvenanceSelect.trainingCode.label.repositoryUrl"),
    "https://github.com"
  );
  return {
    displayNameValue,
    descriptionValue,
    modelArtifactValue,
    modelInputSchemaValue,
    newModelVersionSetData,
  };
};
const mockValidateFieldsWithJobRunOcid = (renderResult: RenderResult) => {
  const { getAllByText, getByLabelText, getByText } = renderResult;

  const displayNameValue = "displayName";
  mockTextField(getByLabelText("models.labels.name"), displayNameValue);

  const descriptionValue = "description";
  mockTextField(getByLabelText("models.labels.description"), descriptionValue);
  const selectButton = getAllByText("models.actions.select");
  selectButton[0].click();
  selectButton[1].click();
  selectButton[2].click();
  const modelArtifactValue = new File(["file contents"], "modelArtifact", {
    type: "image/png",
  });
  mockModelFileField(getByLabelText("models.labels.uploadLabel"), modelArtifactValue);
  getByLabelText("models.selectPanes.modelProvenanceSelect.jobsRun.optionText").click();
  expect(getByText("datasciejobrun")).toBeTruthy();
  getByText("models.selectPanes.modelProvenanceSelect.labels.searchOCID").click();
  getByLabelText("models.selectPanes.modelProvenanceSelect.notebookSession.optionText").click();
  getByLabelText(
    "models.selectPanes.modelProvenanceSelect.labels.selectByCompartmentAndProject"
  ).click();
  getByLabelText("models.selectPanes.modelProvenanceSelect.jobsRun.optionText").click();
  expect(getByText("datasciejobrun")).toBeTruthy();
  const getTrainingoptionText = getAllByText(DisclosureLink.collapsedLabel());
  getTrainingoptionText[0].click();
  getTrainingoptionText[1].click();
  mockTextField(
    getByLabelText("models.selectPanes.modelProvenanceSelect.trainingCode.label.repositoryUrl"),
    "https://github.com"
  );
  return { displayNameValue, descriptionValue, modelArtifactValue };
};
