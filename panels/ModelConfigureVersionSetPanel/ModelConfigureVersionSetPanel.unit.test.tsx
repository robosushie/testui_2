import { fireEvent, render } from "../../../unittest/utils/reactTestingLibraryUtils";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useListingContext: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
  useBulkQuery: jest.fn(),
  useQuery: jest.fn(),
}));
import {
  createStore,
  Labs,
  Provider,
  Store,
  useBulkQuery,
  useConsoleState,
  useListingContext,
  useListingContextClientConsumer,
  useQuery,
} from "oui-savant";
import * as Messages from "@codegen/Messages";
import * as React from "react";
import * as formUtils from "../../utils/formUtils";
import apiClients from "../../apiClients";
import { CreateModelVersionSetDetails } from "odsc-client";
import ModelVersionSetPanel from "./ModelConfigureVersionSetPanel";
import { ToastNotification } from "oui-react";
import * as userFromList from "../../components/UserFromList/UserFromList";
import { act } from "react-dom/test-utils";
import { ModelSummary } from "odsc-client/dist/odsc-client";

const emptymodels: string[] = [];
const models: ModelSummary[] = [
  {
    compartmentId: "compartment",
    projectId: "mtocid",
    id: "ocid.id.1",
    displayName: "UItesting",
    createdBy: "ocid.user.1",
    timeCreated: Date.UTC(2022, 2, 17, 16, 0, 0, 0) as unknown as Date,
    lifecycleState: "ACTIVE",
    modelVersionSetId: "ocid1",
    modelVersionSetName: undefined,
    versionId: 1,
    versionLabel: "Test",
  },
  {
    compartmentId: "compartment",
    projectId: "project",
    id: "ocid.id.2",
    displayName: "UI testing 1",
    createdBy: "ocid.user.1",
    timeCreated: Date.UTC(2022, 2, 17, 16, 0, 0, 0) as unknown as Date,
    lifecycleState: "ACTIVE",
    modelVersionSetId: "ocid2",
    modelVersionSetName: undefined,
    versionId: 2,
    versionLabel: "Test",
  },
];

let mockStore: Store;
let mockLoom: Labs.MockLoom.MockLoom;
let wrapper: any;
let mockValidateField: jest.SpyInstance<any>;

const emptydetails: CreateModelVersionSetDetails = {
  compartmentId: "compartment",
  projectId: "project",
  name: "mvs1",
};
const details: CreateModelVersionSetDetails = {
  compartmentId: "compartment",
  projectId: "project",
  name: "MVS",
  description: "UI testing 1",
  freeformTags: {},
  definedTags: {},
};
const labellist = new Map<string, string>();
const modelList = new Map<string, string>();
describe("ModelConfigureVersionSetPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useConsoleState as jest.Mock).mockReturnValue({
      activeCompartment: { id: "ocid", name: "compartment" },
      compartments: [{ id: "compartment", name: "compartment" }],
    });
    mockValidateField = jest.spyOn(formUtils, "validateField");
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    (useListingContext as jest.Mock).mockReturnValue({ paging: { pageSize: 1, pageNumber: 1 } });
    (useListingContextClientConsumer as jest.Mock).mockReturnValue({
      page: models,
      pagination: 1,
      sortOrder: "",
      setSortOrder: "",
    });
    (useBulkQuery as jest.Mock).mockImplementation(() => {
      return { aggregatedResults: { loading: true, response: [] } };
    });
    jest.spyOn(ToastNotification, "create").mockReturnValue();
  });

  describe("Select existing model version set option in create model", () => {
    const props = {
      preSelectedProjectId: "ocid.projectId",
      preSelectedCompartmentId: "ocid",
      onClose: jest.fn(),
      onModelVersionSetSubmit: jest.fn(),
      preSelectedIsNewModelVersionSet: false,
      preSelectedModelIds: emptymodels,
      preSelectedModelVersionSetDetails: emptydetails,
      preSelectedModelVersionSetId: "",
      preLabelList: labellist,
      preLabelText: "",
    };
    beforeEach(() => {
      (useQuery as jest.Mock).mockReturnValue({ loading: false, response: { data: models } });
    });
    it("should call the onModelVersionSetSubmit method when submit button is clicked", () => {
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalled();
    });

    it("should pass empty list of attributes when not provided with", () => {
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalledWith(
        false,
        [],
        {
          compartmentId: undefined,
          definedTags: undefined,
          description: null,
          freeformTags: undefined,
          name: "mvs1",
          projectId: "ocid.projectId",
        },
        "",
        labellist,
        modelList,
        null,
        undefined
      );
    });

    it("should pass list of attributes when provided with", () => {
      props.preSelectedModelVersionSetId = "ocid1.mvsId";
      props.preLabelText = "test";
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );

      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalledWith(
        false,
        [],
        {
          compartmentId: undefined,
          definedTags: undefined,
          description: null,
          freeformTags: undefined,
          name: "mvs1",
          projectId: "ocid.projectId",
        },
        "ocid1.mvsId",
        labellist,
        modelList,
        "test",
        undefined
      );
    });

    it("Should call onModelVersionSetSubmit with changed values", () => {
      props.preSelectedModelVersionSetId = "ocid1.mvsId";
      props.preLabelText = "test";

      wrapper = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );

      const submitButton = wrapper.getByText(Messages.actions.select());

      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.versionLabel"),
        "test1"
      );

      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalledWith(
        false,
        [],
        {
          compartmentId: undefined,
          definedTags: undefined,
          description: null,
          freeformTags: undefined,
          name: "mvs1",
          projectId: "ocid.projectId",
        },
        "ocid1.mvsId",
        labellist,
        modelList,
        "test1",
        undefined
      );
    });

    it("should validate version Label on Submit", async () => {
      // render
      await act(async () => {
        wrapper = render(
          <Provider store={mockStore as any}>
            <ModelVersionSetPanel {...props} />
          </Provider>
        );
      });

      // fill fields
      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.versionLabel"),
        "label1"
      );

      // clear mocks and click submit
      mockValidateField.mockClear();
      const submitButton = wrapper.getByText(Messages.actions.select());
      submitButton.click();

      // expects
      expect(mockValidateField).toHaveBeenCalledTimes(3);
      expect(mockValidateField).toHaveBeenCalledWith({
        value: "label1",
        required: false,
        maxLen: 255,
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: null,
        required: false,
        maxLen: 400,
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: "mvs1",
        required: false,
        callback: expect.any(Function),
      });
    });
  });

  describe("Create new model version set option in create model", () => {
    const props = {
      preSelectedProjectId: "ocid.projectId",
      preSelectedCompartmentId: "ocid",
      onClose: jest.fn(),
      onModelVersionSetSubmit: jest.fn(),
      preSelectedIsNewModelVersionSet: true,
      preSelectedModelIds: emptymodels,
      preSelectedModelVersionSetDetails: emptydetails,
      preSelectedModelVersionSetId: "",
      preLabelList: labellist,
      preLabelText: "",
    };
    it("should call the onModelVersionSetSubmit method when submit button is clicked", () => {
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalled();
    });

    it("should throw an error when models query fails", () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: {},
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );
      const errors = getByText("errors.generic");
      expect(errors).toBeTruthy();
    });

    it("should pass empty list of attributes when not provided with", () => {
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalledWith(
        true,
        [],
        {
          compartmentId: "ocid",
          definedTags: undefined,
          description: null,
          freeformTags: undefined,
          name: "mvs1",
          projectId: "ocid.projectId",
        },
        "",
        labellist,
        modelList,
        null,
        "mvs1"
      );
    });

    it("should pass list of attributes when provided with", () => {
      props.preLabelList = labellist;
      props.preSelectedModelVersionSetDetails = details;
      props.preSelectedModelIds = [models[0].id, models[1].id];
      props.preLabelText = "VersionLabel";
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );

      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalledWith(
        true,
        [models[0].id, models[1].id],
        {
          compartmentId: "ocid",
          definedTags: undefined,
          description: "UI testing 1",
          freeformTags: undefined,
          name: "MVS",
          projectId: "ocid.projectId",
        },
        "",
        labellist,
        modelList,
        "VersionLabel",
        "MVS"
      );
    });

    it("Should call onModelVersionSetSubmit with changed values", () => {
      props.preSelectedModelVersionSetDetails = details;
      props.preSelectedModelIds = emptymodels;
      props.preLabelText = "VersionLabel";
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false },
        results: { response: { data: { id: "ocid.user.1", name: "user1" } } },
      });
      jest.spyOn(userFromList, "UserFromList").mockReturnValue(<span>user1</span>);
      (useQuery as jest.Mock).mockReturnValue({ loading: false, response: { data: models } });

      wrapper = render(
        <Provider store={mockStore as any}>
          <ModelVersionSetPanel {...props} />
        </Provider>
      );

      const submitButton = wrapper.getByText(Messages.actions.select());
      // wrapper.getByText(Messages.actions.advancedOptions()).click()
      const table = wrapper.getByOuiTestId("listModelsTable");
      const inputCheckBoxes = table.getElementsByClassName("oui-table-shrink");
      // 1 for select all and 2 for each of two models
      expect(inputCheckBoxes.length).toBe(3);

      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.name"),
        "versionSet1"
      );
      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.description"),
        "description1"
      );
      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.versionLabel"),
        "versionLabel1"
      );

      submitButton.click();
      expect(props.onModelVersionSetSubmit).toHaveBeenCalledWith(
        true,
        emptymodels,
        {
          compartmentId: "ocid",
          definedTags: undefined,
          description: "description1",
          freeformTags: undefined,
          name: "versionSet1",
          projectId: "ocid.projectId",
        },
        "",
        labellist,
        modelList,
        "versionLabel1",
        "versionSet1"
      );
    });

    it("should validate displayName, description and version Label on Submit", async () => {
      // render
      await act(async () => {
        wrapper = render(
          <Provider store={mockStore as any}>
            <ModelVersionSetPanel {...props} />
          </Provider>
        );
      });

      // fill fields
      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.name"),
        "versionSet1"
      );
      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.description"),
        "description1"
      );
      mockTextField(
        wrapper.getByLabelText("models.selectPanes.modelVersionSet.labels.versionLabel"),
        "label1"
      );

      // clear mocks and click submit
      mockValidateField.mockClear();
      const submitButton = wrapper.getByText(Messages.actions.select());
      submitButton.click();

      // expects
      expect(mockValidateField).toHaveBeenCalledTimes(3);
      expect(mockValidateField).toHaveBeenCalledWith({
        value: "label1",
        required: false,
        maxLen: 255,
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: "description1",
        required: false,
        maxLen: 400,
      });
      expect(mockValidateField).toHaveBeenCalledWith({
        value: "versionSet1",
        required: false,
        callback: expect.any(Function),
      });
    });
  });
});
const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};
