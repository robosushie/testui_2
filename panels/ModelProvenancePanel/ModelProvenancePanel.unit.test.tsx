import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useQuery: jest.fn(),
  useBulkQuery: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
}));
import * as Messages from "@codegen/Messages";
import apiClients from "apiClients";
import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
import { ModelProvenancePanel } from "./ModelProvenancePanel";
import { ModelProvenance } from "odsc-client/dist/odsc-client";
import { ToastNotification } from "oui-react";
import { fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { DisclosureLink } from "oui-savant/dist/codegen/Messages";
import {
  createStore,
  Labs,
  Provider,
  Store,
  useBulkQuery,
  useConsoleState,
  useListingContextClientConsumer,
  useQuery,
} from "oui-savant";

describe("ModelProvenancePanel", () => {
  const modelProvenance: ModelProvenance = {
    repositoryUrl: "repositoryUrl",
    gitBranch: "gitBranch",
    gitCommit: "gitCommit",
    scriptDir: "scriptDir",
    trainingScript: "trainingScript",
    trainingId: "trainingId",
  };
  const notebookSession: any = {
    id: "ocid.datasciencenotebooksession",
    compartmentId: "compartmentId",
    projectId: "projectId",
    displayName: "notebookSession",
    description: "",
    lifecycleState: "ACTIVE",
  };
  let renderResult: any;

  const props = {
    activeProjectId: "activeProjectId",
    preselectedModelProvenanceCardType: "Notebook session",
    preselectedModelProvenance: modelProvenance,
    onModelProvenanceSubmit: jest.fn(),
    onClose: jest.fn(),
  };
  let mockStore: Store;
  let mockLoom: Labs.MockLoom.MockLoom;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    (useConsoleState as jest.Mock).mockReturnValue({
      compartments: [{ id: "compartmentId", name: "root" }],
      activeCompartment: { id: "compartmentId", name: "root" },
    });
    (useListingContextClientConsumer as jest.Mock).mockReturnValue({
      page: [notebookSession],
      pagination: { currentPage: 1 },
    });
    const queryResult = useQuery as jest.Mock;
    queryResult.mockReturnValue({
      loading: false,
      errors: false,
      response: {
        data: [modelProvenance],
      },
    });
    (useBulkQuery as jest.Mock).mockReturnValue({
      aggregatedResults: { loading: false, response: [] },
    });
  });

  describe("onModelProvenanceSubmit", () => {
    it("should call the onModelProvenanceSubmit method when submit button is clicked", () => {
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
        results: [],
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelProvenancePanel {...props} />
        </Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      expect(props.onModelProvenanceSubmit).toHaveBeenCalled();
    });

    it("should pass empty list when no attributes are provided", () => {
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
        results: [],
      });
      jest.spyOn(ToastNotification, "create").mockReturnValue();

      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ModelProvenancePanel
            {...props}
            preselectedModelProvenanceTrainingResource={{
              id: "notebookSession",
              displayName: "displayName",
              compartmentId: "compartmentId",
              projectId: "projectId",
            }}
          />
        </Provider>
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      const onModelProvenanceSubmitData = props.onModelProvenanceSubmit;
      expect(onModelProvenanceSubmitData).toHaveBeenCalledTimes(1);
    });
    it("should pass training code git metadata", () => {
      (useConsoleState as jest.Mock).mockReturnValue({
        compartments: [{ id: "compartmentId", name: "root" }],
        activeCompartment: { id: "compartmentId", name: "root" },
      });
      jest.spyOn(ToastNotification, "create").mockReturnValue();
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
        results: [],
      });

      const { getByText, getByLabelText } = render(
        <Provider store={mockStore as any}>
          <ModelProvenancePanel {...props} preselectedModelProvenanceTrainingResource={{}} />
        </Provider>
      );
      getByText(DisclosureLink.collapsedLabel()).click();
      mockTextField(
        getByLabelText("models.selectPanes.modelProvenanceSelect.trainingCode.label.repositoryUrl"),
        "https://github.com"
      );
      const submitButton = getByText(Messages.actions.select());
      submitButton.click();
      const onModelProvenanceSubmitData = props.onModelProvenanceSubmit;
      expect(onModelProvenanceSubmitData).toHaveBeenCalledTimes(1);
    });
  });
  describe("Search by OCID", () => {
    const renderAndClickOcid = async () => {
      await act(async () => {
        renderResult = render(
          <Provider store={mockStore as any}>
            <ModelProvenancePanel {...props} preselectedModelProvenanceTrainingResource={{}} />
          </Provider>
        );
      });
      const radioButton2 = renderResult.getByText(
        Messages.models.selectPanes.modelProvenanceSelect.labels.searchOCID()
      );
      fireEvent.click(radioButton2);
    };

    it("should disable the Search should not be clickable when there is no or invalid training id is in SearchInput and user should able to click submit button", async () => {
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
        results: [],
      });
      await renderAndClickOcid();
      const searchButton = renderResult.getByOuiTestId("searchButton");
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      const submitButton = renderResult.getByText(Messages.actions.select());
      submitButton.click();
      const onModelProvenanceSubmitData = props.onModelProvenanceSubmit;
      expect(onModelProvenanceSubmitData).toHaveBeenCalledTimes(1);
    });

    it("should enable the Search Button when OCID entered", async () => {
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
        results: [],
      });
      await renderAndClickOcid();
      const searchField = renderResult.getByOuiTestId("searchModelProvenanceTrainingOCID");
      const searchButton = renderResult.getByOuiTestId("searchButton");
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.change(searchField, {
        target: {
          value: "ocid1.datasciencenotebooksession.oc1.iad.1",
        },
      });
      expect(searchButton.attributes.getNamedItem("aria-disabled")).toBeNull();
    });

    it("should disable Submit Button if entered notebookSession doesn't exist", async () => {
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({ loading: false, error: { status: 404 } });
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      await renderAndClickOcid();

      const searchButton = renderResult.getByOuiTestId("searchButton");
      const searchField = renderResult.getByOuiTestId("searchModelProvenanceTrainingOCID");

      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      const submitButton = renderResult.getByText(Messages.actions.select());

      fireEvent.change(searchField, {
        target: {
          value: "ocid1.datasciencenotebooksession.oc1.iad.1",
        },
      });

      expect(searchButton.attributes.getNamedItem("aria-disabled")).toBeNull();
      fireEvent.click(searchButton);
      expect(
        renderResult.getByText("models.selectPanes.modelProvenanceSelect.errorMessages.notFound")
      ).toBeTruthy();
      submitButton.click();
      const onModelProvenanceSubmitData = props.onModelProvenanceSubmit;
      expect(onModelProvenanceSubmitData).toHaveBeenCalledTimes(1);
    });

    it("Should disable the Search Button if OCID wasn't found", async () => {
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({ loading: true });

      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false, response: [] },
      });

      await renderAndClickOcid();
      const searchField = renderResult.getByOuiTestId("searchModelProvenanceTrainingOCID");
      const searchButton = renderResult.getByOuiTestId("searchButton");
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.change(searchField, {
        target: {
          value: "ocid1.oc1.iad.1",
        },
      });
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
    });

    it("should render table if OCID exists", async () => {
      (useBulkQuery as jest.Mock).mockReturnValue({
        aggregatedResults: { loading: false },
        results: [
          {
            response: {
              data: {
                id: "ocid1.user.oc1..1",
                name: "testUser",
              },
            },
          },
        ],
      });
      const queryResult = useQuery as jest.Mock;
      queryResult.mockReturnValue({
        loading: false,
        response: {
          data: [notebookSession],
        },
      });
      (useListingContextClientConsumer as jest.Mock).mockReturnValue({
        page: [notebookSession],
        pagination: { currentPage: 1 },
      });

      await renderAndClickOcid();

      const searchField = renderResult.getByOuiTestId("searchModelProvenanceTrainingOCID");
      const searchButton = renderResult.getByOuiTestId("searchButton");
      const submitButton = renderResult.getByText(Messages.actions.select());
      expect(searchButton.attributes.getNamedItem("aria-disabled").value).toBe("true");
      fireEvent.change(searchField, {
        target: {
          value: "ocid1.datasciencenotebooksession.oc1.iad.1",
        },
      });
      expect(searchButton.attributes.getNamedItem("aria-disabled")).toBeNull();
      fireEvent.click(searchButton);
      expect(renderResult.getByText("notebookSession")).toBeTruthy();
      submitButton.click();
      const onModelProvenanceSubmitData = props.onModelProvenanceSubmit;
      expect(onModelProvenanceSubmitData).toHaveBeenCalledTimes(1);
    });
  });
  const mockTextField = (inputField: HTMLElement, value: string) => {
    fireEvent.change(inputField, { target: { value } });
  };
});
