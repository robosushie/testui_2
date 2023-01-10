import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useWhitelist: jest.fn(),
}));
import apiClients from "apiClients";
import { act } from "react-dom/test-utils";
import { render, fireEvent } from "../../../unittest/utils/reactTestingLibraryUtils";
import * as formUtils from "../../utils/formUtils";
import { ToastNotification } from "oui-react";
import ModelEditPanel from "./ModelEditPanel";
import { Model } from "odsc-client/dist/odsc-client";
import { RenderResult } from "@testing-library/react";
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

describe("ModelEditPanel", () => {
  const props = {
    onClose: jest.fn(),
    refresh: jest.fn(),
    modelId: "",
  };
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;
  let renderResult: any;
  let mockValidateField: jest.SpyInstance<any>;

  const modelData: Model = {
    id: "",
    timeCreated: new Date(),
    projectId: "",
    compartmentId: "",
    createdBy: "",
    displayName: "name",
    lifecycleState: "ACTIVE",
    definedMetadataList: [],
    customMetadataList: [],
    modelVersionSetId: "",
    modelVersionSetName: "",
    versionLabel: "versionLabel",
    versionId: 1,
  };

  const displayNameValue = modelData.displayName;
  const descriptionValue = "description";
  const versionLabelValue = modelData.versionLabel;

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
    (useMutation as jest.Mock).mockReturnValue({
      reset: jest.fn(),
      invoke: jest.fn(),
      result: { loading: false },
    });
  });

  describe("Notifications", () => {
    describe("Errors", () => {
      it("should display a ToastNotification error if fetching data fails", async () => {
        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          error: { body: { message: "error" } },
        });

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelEditPanel {...props} />
            </Provider>
          );
        });
        expect(ToastNotification.create).toHaveBeenCalled();
      });

      it("should display a ToastNotification if submitting data fails", async () => {
        (useMutation as jest.Mock).mockReturnValue({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { error: { body: { message: "error" } } },
        });
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelEditPanel {...props} />
            </Provider>
          );
        });
        expect(ToastNotification.create).toHaveBeenCalled();
      });
    });

    describe("Loaders", () => {
      it("should display a loader while data submitting", async () => {
        (useMutation as jest.Mock).mockReturnValue({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { loading: true },
        });
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelEditPanel {...props} />
            </Provider>
          );
        });
        expect(renderResult.getByText("actions.loading")).toBeTruthy();
      });
    });
  });

  describe("Form Loaded", () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      (useConsoleState as jest.Mock).mockReturnValue({ activeCompartmennt: { id: "ID" } });
      jest.spyOn(ToastNotification, "create").mockReturnValue();
      mockValidateField = jest.spyOn(formUtils, "validateField");
      mockLoom = Labs.MockLoom.createMockLoom();
      mockStore = createStore({
        apiClients,
        loomStartData: mockLoom.getLoomStartData(),
        pluginName: "test-plugin",
        reducers: {},
        middleware: [],
      });
      const modelQueryResult = {
        response: {
          data: modelData,
        },
      };

      // Mock modelQuery return
      (useQuery as jest.Mock).mockReturnValue(modelQueryResult);

      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ModelEditPanel {...props} />
          </Provider>
        );
      });

      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: false,
        response: { data: {} },
      });
    });

    describe("Validation", () => {
      it("should validate displayName and description on Submit Button click", () => {
        const { getByText, getByLabelText } = renderResult;

        // fill fields
        mockTextField(getByLabelText("models.labels.name"), displayNameValue);
        mockTextField(getByLabelText("models.labels.description"), descriptionValue);

        // clear mocks and click submit
        mockValidateField.mockClear();
        const submitButton = getByText("actions.saveChanges");
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
      });
    });
  });
  describe("onSubmit", () => {
    let mockModelMutationReset: jest.Mock;
    let mockModelMutationInvoke: jest.Mock;

    describe("Successful validation", () => {
      it("should reset the modelMutation", async () => {
        // render
        let renderResult: RenderResult;
        modelData.modelVersionSetName = "MVS";
        modelData.id = "modelId";
        const modelQueryResult1 = {
          response: {
            data: modelData,
          },
        };

        // Mock modelQuery return
        jest.clearAllMocks();
        (useQuery as jest.Mock).mockReturnValue(modelQueryResult1);
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
              <ModelEditPanel {...props} />
            </Provider>
          );
        });

        const { getByText, getByLabelText } = renderResult;

        // fill fields
        const displayNameValue = "displayName";
        mockTextField(getByLabelText("models.labels.name"), displayNameValue);

        const descriptionValue = "description";
        mockTextField(getByLabelText("models.labels.description"), descriptionValue);

        mockTextField(getByLabelText("models.labels.versionLabel"), versionLabelValue);

        const submitButton = getByText("actions.saveChanges");
        submitButton.click();
        expect(mockModelMutationReset).toHaveBeenCalled();
        expect(mockValidateField).toHaveBeenCalledWith({
          value: versionLabelValue,
          required: false,
          maxLen: 255,
        });
      });

      it("should invoke the modelMutation with the proper details", async () => {
        // render
        let renderResult: RenderResult;
        modelData.modelVersionSetName = "MVS";
        modelData.id = "modelId";
        const modelQueryResult1 = {
          response: {
            data: modelData,
          },
        };

        // Mock modelQuery return
        jest.clearAllMocks();
        (useQuery as jest.Mock).mockReturnValue(modelQueryResult1);
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
              <ModelEditPanel {...props} />
            </Provider>
          );
        });

        const { getByText, getByLabelText, getAllByText } = renderResult;

        // fill fields
        const displayNameValue = "displayName";
        mockTextField(getByLabelText("models.labels.name"), displayNameValue);

        const descriptionValue = "description";
        mockTextField(getByLabelText("models.labels.description"), descriptionValue);

        const versionLabelValue = "versionLabel";
        mockTextField(getByLabelText("models.labels.versionLabel"), versionLabelValue);

        const selectButton = getAllByText("models.actions.select");
        selectButton[1].click();
        mockTextField(
          getByLabelText("models.selectPanes.modelTaxonomySelect.labels.algorithm"),
          "NLP"
        );
        mockTextField(
          getByLabelText("models.selectPanes.modelTaxonomySelect.labels.useCase"),
          "binary_classification"
        );
        mockTextField(
          getByLabelText("models.selectPanes.modelTaxonomySelect.labels.frameworkName"),
          "scikit-learn"
        );
        const select = getByText("actions.select");
        select.click();
        const submitButton = getByText("actions.saveChanges");
        submitButton.click();

        expect(mockModelMutationInvoke).toHaveBeenCalledWith({
          modelId: "modelId",
          updateModelDetails: {
            displayName: displayNameValue,
            description: descriptionValue,
            versionLabel: versionLabelValue,
            customMetadataList: [],
            definedMetadataList: [
              { key: "UseCaseType", value: "binary_classification" },
              { key: "Framework", value: "scikit-learn" },
              { key: "Algorithm", value: "NLP" },
            ],
            definedTags: {},
            freeformTags: {},
          },
        });
      });
    });

    describe("Unsuccessful validation", () => {
      let renderResult: RenderResult;
      beforeEach(async () => {
        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <ModelEditPanel {...props} />
            </Provider>
          );
        });
      });

      it("should not reset and should not invoke the modelMutation", () => {
        const { getByText, getByLabelText } = renderResult;
        const displayNameValue =
          "displayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayName";
        mockTextField(getByLabelText("models.labels.name"), displayNameValue);

        const submitButton = getByText("actions.saveChanges");
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
