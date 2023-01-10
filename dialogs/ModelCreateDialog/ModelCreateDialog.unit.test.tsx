import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useConsoleState: jest.fn(),
}));
import * as formUtils from "../../utils/formUtils";
import apiClients from "../../apiClients";
import { render, fireEvent, RenderResult, act } from "@testing-library/react";
import { ModelCreateDialog } from "./ModelCreateDialog";
import { createStore, Labs, Provider, useConsoleState, useMutation, useQuery } from "oui-savant";

describe("ModelCreateDialog", () => {
  const projectId = "1";
  const activeCompartment = { id: "compartment" };
  let mockLoom: any;
  let mockStore: any;
  let mockCloseHandler: any;
  let mockRefresh: any;
  let props: any;
  let mockUseMutation: jest.SpyInstance<any>;
  let mockValidateField: jest.SpyInstance<any>;

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
    mockCloseHandler = jest.fn();
    mockRefresh = jest.fn();
    props = { projectId, isError: false, closeHandler: mockCloseHandler, refresh: mockRefresh };

    mockUseMutation = (useMutation as jest.Mock).mockImplementation(
      mockUseMutationImplementationGenerator({
        createModelProvenanceReturnValue: {
          reset: jest.fn(),
          invoke: jest.fn(),
        },
        createModelReturnValue: {
          reset: jest.fn(),
          invoke: jest.fn(),
        },
      })
    );
    (useQuery as jest.Mock).mockImplementation(jest.fn());
    (useConsoleState as jest.Mock).mockImplementation(() => {
      return { activeCompartment };
    });
    mockValidateField = jest.spyOn(formUtils, "validateField");
    apiClients.identityApi.listTagNamespaces = jest.fn();
    apiClients.identityApi.listTags = jest.fn();
  });

  describe("form submitted", () => {
    describe("validation", () => {
      it("should validate all fields", async () => {
        // render
        let renderResult: RenderResult;

        await act(async () => {
          renderResult = render(
            <Provider store={mockStore}>
              <ModelCreateDialog {...props} />
            </Provider>
          );
        });

        const { getByText, getByLabelText } = renderResult;

        // fill fields
        const displayValue = "display";
        mockTextField(getByLabelText("models.labels.name"), displayValue);

        const descriptionValue = "description";
        mockTextField(getByLabelText("models.labels.description"), descriptionValue);

        const modelArtifactValue = new File(["file contents"], "modelArtifact", {
          type: "image/png",
        });
        mockModelArtifactField(getByLabelText("models.labels.modelArtifact"), modelArtifactValue);

        const repositoryUrlValue = "repoUrl";
        mockTextField(getByLabelText("models.labels.repositoryUrl"), repositoryUrlValue);

        const gitCommitValue = "gitCommit";
        mockTextField(getByLabelText("models.labels.gitCommit"), gitCommitValue);

        const gitBranchValue = "gitBranch";
        mockTextField(getByLabelText("models.labels.gitBranch"), gitBranchValue);

        const scriptDirValue = "scriptDirectory";
        mockTextField(getByLabelText("models.labels.scriptDir"), scriptDirValue);

        const trainingScriptValue = "trainingScript";
        mockTextField(getByLabelText("models.labels.trainingScript"), trainingScriptValue);

        // clear mocks and click submit
        mockValidateField.mockClear();

        const submitButton = getByText("actions.create");
        submitButton.click();

        // expects
        expect(mockValidateField).toHaveBeenCalledTimes(8);
        expect(mockValidateField).toHaveBeenCalledWith({
          value: displayValue,
          maxLen: 255,
        });
        expect(mockValidateField).toHaveBeenCalledWith({ value: descriptionValue, maxLen: 400 });
        expect(mockValidateField).toHaveBeenCalledWith(
          expect.objectContaining({
            value: modelArtifactValue,
            required: true,
          })
        );
        expect(mockValidateField).toHaveBeenCalledWith({ value: repositoryUrlValue, maxLen: 255 });
        expect(mockValidateField).toHaveBeenCalledWith({ value: gitCommitValue, maxLen: 255 });
        expect(mockValidateField).toHaveBeenCalledWith({ value: gitBranchValue, maxLen: 255 });
        expect(mockValidateField).toHaveBeenCalledWith({ value: scriptDirValue, maxLen: 255 });
        expect(mockValidateField).toHaveBeenCalledWith({ value: trainingScriptValue, maxLen: 255 });
      });
    });

    describe("onSubmit", () => {
      let mockModelMutationReset: jest.Mock;
      let mockModelMutationInvoke: jest.Mock;

      beforeEach(() => {
        mockModelMutationReset = jest.fn();
        mockModelMutationInvoke = jest.fn();

        mockUseMutation.mockImplementation(
          mockUseMutationImplementationGenerator({
            createModelProvenanceReturnValue: {
              reset: jest.fn(),
              invoke: jest.fn(),
            },
            createModelReturnValue: {
              reset: mockModelMutationReset,
              invoke: mockModelMutationInvoke,
            },
          })
        );
      });

      describe("Successful validation", () => {
        it("should reset the modelMutation", async () => {
          // render
          let renderResult: RenderResult;

          await act(async () => {
            renderResult = render(
              <Provider store={mockStore}>
                <ModelCreateDialog {...props} />
              </Provider>
            );
          });

          const { getByText, getByLabelText } = renderResult;

          // fill required field
          const modelArtifactValue = new File(["file contents"], "modelArtifact", {
            type: "image/png",
          });
          mockModelArtifactField(getByLabelText("models.labels.modelArtifact"), modelArtifactValue);

          getByText("actions.create").click();
          expect(mockModelMutationReset).toHaveBeenCalled();
        });

        it("should invoke the modelMutation with the proper datails", async () => {
          // render
          let renderResult: RenderResult;

          await act(async () => {
            renderResult = render(
              <Provider store={mockStore}>
                <ModelCreateDialog {...props} />
              </Provider>
            );
          });

          const { getByText, getByLabelText } = renderResult;

          // fill relevant fields
          const displayValue = "display";
          mockTextField(getByLabelText("models.labels.name"), displayValue);

          const descriptionValue = "description";
          mockTextField(getByLabelText("models.labels.description"), descriptionValue);

          // fill required field
          const modelArtifactValue = new File(["file contents"], "modelArtifact", {
            type: "image/png",
          });
          mockModelArtifactField(getByLabelText("models.labels.modelArtifact"), modelArtifactValue);

          getByText("actions.create").click();
          expect(mockModelMutationInvoke).toHaveBeenCalledWith({
            createModelDetails: expect.objectContaining({
              projectId,
              compartmentId: activeCompartment.id,
              displayName: displayValue,
              description: descriptionValue,
            }),
          });
        });
      });

      describe("Unsuccessful validation", () => {
        let renderResult: RenderResult;
        beforeEach(async () => {
          await act(async () => {
            renderResult = await render(
              <Provider store={mockStore}>
                <ModelCreateDialog {...props} />
              </Provider>
            );
          });
        });

        it("should not reset the modelMutation", () => {
          // render
          const { getByText } = renderResult;
          getByText("actions.create").click();
          expect(mockModelMutationReset).not.toHaveBeenCalled();
        });

        it("should not invoke the modelMutation", () => {
          // render
          const { getByText } = renderResult;
          getByText("actions.create").click();
          expect(mockModelMutationInvoke).not.toHaveBeenCalled();
        });
      });
    });
  });
});

const mockUseMutationImplementationGenerator = ({
  createModelProvenanceReturnValue,
  createModelReturnValue,
}: {
  createModelProvenanceReturnValue: any;
  createModelReturnValue: any;
}) => {
  return (mutationArgs: any): any => {
    if (mutationArgs.method === apiClients.odscApi.createModelProvenance) {
      return createModelProvenanceReturnValue;
    } else if (mutationArgs.method === apiClients.odscApi.createModel) {
      return createModelReturnValue;
    }
  };
};

const mockModelArtifactField = (modelArtifactInput: HTMLElement, modelArtifactValue: File) => {
  // https://github.com/kentcdodds/react-testing-library-examples/pull/1/files
  Object.defineProperty(modelArtifactInput, "files", {
    value: [modelArtifactValue],
  });
  fireEvent.change(modelArtifactInput);
  return modelArtifactValue;
};

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};
