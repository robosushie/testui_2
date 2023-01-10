import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useBulkQuery: jest.fn(),
  useQuery: jest.fn(),
}));
import { createStore, Labs, Provider, useBulkQuery, useConsoleState, useQuery } from "oui-savant";
import { render, fireEvent } from "../../../unittest/utils/reactTestingLibraryUtils";
import apiClients from "../../apiClients";
import CompareVersionsPanel from "./CompareVersionsPanel";
import { ModelSummary } from "odsc-client/dist/odsc-client";
import * as userartifact from "../../hooks/useArtifact";

describe("CompareVersionsPanel", () => {
  const modelSummary: ModelSummary[] = [
    {
      compartmentId: "compartment",
      projectId: "mtocid",
      id: "ocid.id2",
      displayName: "UItesting",
      createdBy: "ocid.user.1",
      timeCreated: Date.now() as unknown as Date,
      lifecycleState: "ACTIVE",
      modelVersionSetName: "test model version set",
      modelVersionSetId: "mvs4",
      versionId: 1,
      versionLabel: "Test",
    },
    {
      compartmentId: "compartment",
      projectId: "project",
      id: "ocid.id3",
      displayName: "UI testing 1",
      createdBy: "ocid.user.1",
      timeCreated: Date.now() as unknown as Date,
      lifecycleState: "ACTIVE",
      modelVersionSetName: "test model version set",
      modelVersionSetId: "mvs3",
      versionId: 2,
      versionLabel: "Test",
    },
    {
      compartmentId: "compartment",
      projectId: "mtocid",
      id: "ocid.id4",
      displayName: "UI testing 1",
      createdBy: "ocid.user.1",
      timeCreated: Date.now() as unknown as Date,
      lifecycleState: "ACTIVE",
      modelVersionSetName: "test model version set",
      modelVersionSetId: "mvs2",
      versionId: 3,
      versionLabel: "Test2",
    },
    {
      compartmentId: "compartment",
      projectId: "mtocid",
      id: "ocid.id5",
      displayName: "UI testing 1",
      createdBy: "ocid.user.1",
      timeCreated: Date.now() as unknown as Date,
      lifecycleState: "ACTIVE",
      modelVersionSetName: "test model version set",
      modelVersionSetId: "mvs1",
      versionId: 4,
      versionLabel: "Test",
    },
  ];

  let props: { onClose: jest.Mock<unknown>; modelsList: ModelSummary[]; selectedModelIds: any[] };

  let mockLoom: any;
  let mockStore: any;

  beforeEach(() => {
    jest.resetAllMocks();
    (useBulkQuery as jest.Mock).mockImplementation(() => {
      return { aggregatedResults: { loading: true, response: [] } };
    });
    (useQuery as jest.Mock).mockImplementation(() => {
      return { loading: true, response: [] };
    });
    jest.spyOn(userartifact, "useArtifact").mockReturnValue({
      result: {
        name: "artifact",
        type: "XGBoost",
        size: 1.8,
      },
      loading: false,
      refresh: jest.fn().mockImplementationOnce(() => Promise.resolve()),
    });
    (useConsoleState as jest.Mock).mockReturnValue({ activeCompartment: { id: "ID" } });
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  describe("Initial State", () => {
    it("When no model is selected and highlight button should be clickable", () => {
      props = {
        onClose: jest.fn(),
        selectedModelIds: [],
        modelsList: modelSummary,
      };
      const renderResult = render(
        <Provider store={mockStore}>
          <CompareVersionsPanel {...props} />
        </Provider>
      );

      const { getByOuiTestId } = renderResult;
      expect((getByOuiTestId("dropdown-selectedModelId-1") as HTMLSelectElement).value).toBe(
        "ocid.id3"
      );
      expect((getByOuiTestId("dropdown-selectedModelId-2") as HTMLSelectElement).value).toBe(
        "ocid.id2"
      );
      const highlightedDiff = getByOuiTestId("highlight-difference");
      expect((highlightedDiff as HTMLInputElement).checked).toBe(true);
      highlightedDiff.click();
      expect((highlightedDiff as HTMLInputElement).checked).toBe(false);
    });

    it("When one model is selected", () => {
      props = {
        onClose: jest.fn(),
        selectedModelIds: ["ocid.id4"],
        modelsList: modelSummary,
      };
      const renderResult = render(
        <Provider store={mockStore}>
          <CompareVersionsPanel {...props} />
        </Provider>
      );

      const { getByOuiTestId } = renderResult;
      expect((getByOuiTestId("dropdown-selectedModelId-1") as HTMLSelectElement).value).toBe(
        "ocid.id3"
      );
      expect((getByOuiTestId("dropdown-selectedModelId-2") as HTMLSelectElement).value).toBe(
        "ocid.id2"
      );
    });

    it("when two model is selected", () => {
      props = {
        onClose: jest.fn(),
        selectedModelIds: ["ocid.id4", "ocid.id5"],
        modelsList: modelSummary,
      };
      const renderResult = render(
        <Provider store={mockStore}>
          <CompareVersionsPanel {...props} />
        </Provider>
      );

      const { getByOuiTestId } = renderResult;
      expect((getByOuiTestId("dropdown-selectedModelId-1") as HTMLSelectElement).value).toBe(
        "ocid.id5"
      );
      expect((getByOuiTestId("dropdown-selectedModelId-2") as HTMLSelectElement).value).toBe(
        "ocid.id4"
      );
    });

    it("should be able to change the dropdown value", () => {
      props = {
        onClose: jest.fn(),
        selectedModelIds: ["ocid.id4", "ocid.id5"],
        modelsList: modelSummary,
      };
      const renderResult = render(
        <Provider store={mockStore}>
          <CompareVersionsPanel {...props} />
        </Provider>
      );

      const { getByOuiTestId } = renderResult;

      expect((getByOuiTestId("dropdown-selectedModelId-1") as HTMLSelectElement).value).toBe(
        "ocid.id5"
      );
      expect((getByOuiTestId("dropdown-selectedModelId-2") as HTMLSelectElement).value).toBe(
        "ocid.id4"
      );

      fireEvent.change(getByOuiTestId("dropdown-selectedModelId-1"), {
        target: { value: "ocid.id3" },
      });
      fireEvent.change(getByOuiTestId("dropdown-selectedModelId-2"), {
        target: { value: "ocid.id2" },
      });

      expect((getByOuiTestId("dropdown-selectedModelId-1") as HTMLSelectElement).value).toBe(
        "ocid.id3"
      );
      expect((getByOuiTestId("dropdown-selectedModelId-2") as HTMLSelectElement).value).toBe(
        "ocid.id2"
      );
    });
  });
});
