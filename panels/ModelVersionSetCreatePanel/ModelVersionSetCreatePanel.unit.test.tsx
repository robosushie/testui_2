import * as React from "react";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useConsoleState: jest.fn(),
  useListingContext: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
  useBulkQuery: jest.fn(),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
import {
  Provider,
  Labs,
  createStore,
  Store,
  useQuery,
  useConsoleState,
  useMutation,
  useListingContextClientConsumer,
  useListingContext,
  useBulkQuery,
} from "oui-savant";
import apiClients from "apiClients";
import { act } from "react-dom/test-utils";
import { fireEvent, render, RenderResult } from "@testing-library/react";
import ModelVersionSetCreatePanel from "./ModelVersionSetCreatePanel";
import * as formUtils from "../../utils/formUtils";
import { ToastNotification } from "oui-react";

describe("ModelVersionSetCreatePanel", () => {
  const props = {
    onClose: jest.fn(),
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
    mockValidateField = jest.spyOn(formUtils, "validateField");
    mockLoom = Labs.MockLoom.createMockLoom();
    mockStore = createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
    (useListingContext as jest.Mock).mockImplementation(() => {
      return { paging: { pageSize: 1, pageNumber: 1 } };
    });
    (useListingContextClientConsumer as jest.Mock).mockImplementation(() => {
      return { page: [], pagination: 1, sortOrder: "", setSortOrder: "" };
    });
    (useBulkQuery as jest.Mock).mockImplementation(() => {
      return { aggregatedResults: { loading: false, response: [] } };
    });
    (useQuery as jest.Mock).mockReturnValue({
      loading: false,
      response: {
        data: [
          {
            id: "ocid.datasciencemodel",
            compartmentId: "compartmentId",
            projectId: "projectId",
            displayName: "datasciejobrun",
            description: "",
            lifecycleState: "ACTIVE",
          },
        ],
      },
    });
  });

  describe("Notifications", () => {
    describe("Errors", () => {
      it("should display a ToastNotification if submitting data fails", async () => {
        (useMutation as jest.Mock).mockReturnValueOnce({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { loading: false, error: false, response: { data: { id: "id" } } },
        });
        (useMutation as jest.Mock).mockReturnValue({
          reset: jest.fn(),
          invoke: jest.fn(),
          result: { error: { body: { message: "error" } } },
        });
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelVersionSetCreatePanel {...props} />
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
              <ModelVersionSetCreatePanel {...props} />
            </Provider>
          );
        });
        expect(renderResult.getByText("modelVersionSets.actions.loading")).toBeTruthy();
      });
    });
  });

  describe("Form tests", () => {
    describe("validation", () => {
      it("should validate displayName, description on Submit", async () => {
        // render
        await act(async () => {
          renderResult = render(
            <Provider store={mockStore as any}>
              <ModelVersionSetCreatePanel {...props} />
            </Provider>
          );
        });
        const { getByText } = renderResult;

        // fill fields
        const { displayNameValue, descriptionValue } = mockValidateFields(renderResult);

        // clear mocks and click submit
        mockValidateField.mockClear();
        const submitButton = getByText("actions.create");
        submitButton.click();

        // expects
        expect(mockValidateField).toHaveBeenCalledTimes(2);
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
    let mockModelVersionSetMutationReset: jest.Mock;
    let mockModelVersionSetMutationInvoke: jest.Mock;
    describe("Successful validation", () => {
      it("should reset the modelVersionSetMutation", async () => {
        (useQuery as jest.Mock).mockReturnValue({
          loading: false,
          response: {
            data: [
              {
                id: "ocid.datasciencemodel",
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

        mockModelVersionSetMutationReset = jest.fn();
        mockModelVersionSetMutationInvoke = jest.fn();
        (useMutation as jest.Mock).mockReturnValue({
          reset: mockModelVersionSetMutationReset,
          invoke: mockModelVersionSetMutationInvoke,
          result: { loading: false, response: { data: { id: "id" } } },
        });

        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <ModelVersionSetCreatePanel {...props} />
            </Provider>
          );
        });

        const { getByText } = renderResult;

        // fill fields
        mockValidateFields(renderResult);
        const submitButton = getByText("actions.create");
        submitButton.click();
        expect(mockModelVersionSetMutationReset).toHaveBeenCalled();
      });

      it("should invoke the modelVersionSetMutation with the proper details", async () => {
        // render
        let renderResult: RenderResult;

        mockModelVersionSetMutationReset = jest.fn();
        mockModelVersionSetMutationInvoke = jest.fn();

        (useMutation as jest.Mock).mockReturnValue({
          reset: mockModelVersionSetMutationReset,
          invoke: mockModelVersionSetMutationInvoke,
          result: { loading: false },
        });

        await act(async () => {
          renderResult = await render(
            <Provider store={mockStore as any}>
              <ModelVersionSetCreatePanel {...props} />
            </Provider>
          );
        });

        const { getByText } = renderResult;

        // fill fields
        const { displayNameValue, descriptionValue } = mockValidateFields(renderResult);

        const submitButton = getByText("actions.create");
        submitButton.click();

        expect(mockModelVersionSetMutationInvoke).toHaveBeenCalledWith({
          createModelVersionSetDetails: {
            projectId: "1",
            compartmentId: activeCompartment.id,
            name: displayNameValue,
            description: descriptionValue,
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
              <ModelVersionSetCreatePanel {...props} />
            </Provider>
          );
        });
      });

      it("should not reset and should not invoke the ModelVersionSetMutation", () => {
        const { getByText, getByLabelText } = renderResult;
        const displayNameValue =
          "displayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayNamedisplayName";
        mockTextField(getByLabelText("modelVersionSets.labels.name"), displayNameValue);

        const submitButton = getByText("actions.create");
        submitButton.click();
        expect(mockModelVersionSetMutationReset).not.toHaveBeenCalled();
        expect(mockModelVersionSetMutationInvoke).not.toHaveBeenCalled();
      });
    });
  });
});

const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};

const mockValidateFields = (renderResult: RenderResult) => {
  const { getByLabelText } = renderResult;

  const displayNameValue = "displayName";
  mockTextField(getByLabelText("modelVersionSets.labels.name"), displayNameValue);

  const descriptionValue = "description";
  mockTextField(getByLabelText("modelVersionSets.labels.description"), descriptionValue);

  return { displayNameValue, descriptionValue };
};
