import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useQuery: jest.fn(),
}));
import apiClients from "../../apiClients";
import { render } from "@testing-library/react";
import { ModelEditDialog } from "./ModelEditDialog";
import { createStore, Labs, Provider, useQuery } from "oui-savant";
describe("ModelEditDialog", () => {
  const modelId = "1";
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let mockProvenanceRefresh: any;
  let props: any;
  let mockUseQuery: jest.SpyInstance;

  beforeEach(() => {
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    mockCloseHandler = jest.fn();
    mockRefresh = jest.fn();
    mockProvenanceRefresh = jest.fn();
    props = {
      modelId,
      closeHandler: mockCloseHandler,
      refresh: mockRefresh,
      provenanceRefresh: mockProvenanceRefresh,
    };
    mockUseQuery = useQuery as jest.Mock;
  });

  describe("loading model info", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query) =>
        query.method === apiClients.odscApi.getModel ? { loading: true } : {}
      );
    });

    it("should request the model info", () => {
      render(
        <Provider store={mockStore}>
          <ModelEditDialog {...props} />
        </Provider>
      );
      expect(mockUseQuery).toHaveBeenCalledWith({
        method: apiClients.odscApi.getModel,
        options: {
          args: { modelId },
        },
      });
    });

    it("should display the loading spinner", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelEditDialog {...props} />
        </Provider>
      );
      expect(getByText("actions.loading"));
    });
  });

  describe("loading provenance info", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query) =>
        query.method === apiClients.odscApi.getModelProvenance ? { loading: true } : {}
      );
    });

    it("should request the model info", () => {
      render(
        <Provider store={mockStore}>
          <ModelEditDialog {...props} />
        </Provider>
      );
      expect(mockUseQuery).toHaveBeenCalledWith({
        wait: false,
        method: apiClients.odscApi.getModelProvenance,
        options: {
          args: { modelId },
        },
      });
    });

    it("should display the loading spinner", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelEditDialog {...props} />
        </Provider>
      );
      expect(getByText("actions.loading"));
    });
  });

  describe("when the model has finished loading successfully", () => {
    const displayName = "display-name";
    const description = "description";

    it("should pre-fill the model fields correctly", () => {
      mockUseQuery.mockImplementation((query) =>
        query.method === apiClients.odscApi.getModel
          ? { response: { data: { displayName, description } } }
          : { loading: true }
      );

      const { getByLabelText } = render(
        <Provider store={mockStore}>
          <ModelEditDialog {...props} />
        </Provider>
      );

      expect((getByLabelText("models.labels.name") as HTMLInputElement).value).toBe(displayName);
      expect((getByLabelText("models.labels.description") as HTMLInputElement).value).toBe(
        description
      );
    });

    describe("when the provenance info has finished loading successfully", () => {
      it("should pre-fill the provenance fields correctly", () => {
        const repositoryUrl = "repo-url";
        const gitCommit = "commit";
        const gitBranch = "branch";
        const scriptDir = "script-directory";
        const trainingScript = "training-script";

        mockUseQuery.mockImplementation((query) =>
          query.method === apiClients.odscApi.getModelProvenance
            ? {
                response: {
                  data: { repositoryUrl, gitCommit, gitBranch, scriptDir, trainingScript },
                },
              }
            : { response: { data: { displayName, description } } }
        );

        const { getByLabelText } = render(
          <Provider store={mockStore}>
            <ModelEditDialog {...props} />
          </Provider>
        );

        expect((getByLabelText("models.labels.repositoryUrl") as HTMLInputElement).value).toBe(
          repositoryUrl
        );
        expect((getByLabelText("models.labels.gitCommit") as HTMLInputElement).value).toBe(
          gitCommit
        );
        expect((getByLabelText("models.labels.gitBranch") as HTMLInputElement).value).toBe(
          gitBranch
        );
      });
    });
  });

  describe("model response error", () => {
    const errorMessage = "error-message";

    beforeEach(() => {
      mockUseQuery.mockImplementation((query) =>
        query.method === apiClients.odscApi.getModel
          ? { error: { body: { message: errorMessage } } }
          : {}
      );
    });

    it("should display the error message", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelEditDialog {...props} />
        </Provider>
      );
      expect(getByText(errorMessage));
    });
  });

  describe("provenance response error", () => {
    const errorMessage = "error-message";

    beforeEach(() => {
      mockUseQuery.mockImplementation((query) =>
        query.method === apiClients.odscApi.getModelProvenance
          ? { error: { body: { message: errorMessage } } }
          : { response: { data: { displayName: "", description: "" } } }
      );
    });

    it("should display the error message", () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ModelEditDialog {...props} />
        </Provider>
      );
      expect(getByText(errorMessage));
    });
  });
});
