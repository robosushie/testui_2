import { render, fireEvent } from "../../../../unittest/utils/reactTestingLibraryUtils";
import * as React from "react";
import * as savant from "oui-savant";
import { CustomAttributesSelect } from "./CustomAttributesSelect";
import apiClients from "apiClients";
import { Form, FormErrors } from "oui-react";
import { act } from "react-dom/test-utils";
import { CustomAttribute } from "../ModelTaxonomyPanel";

describe("CustomAttributesSelect", () => {
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
  const fieldErrors: FormErrors = {};
  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;
  let renderResult: any;
  const mockSetState = jest.fn();

  beforeEach(() => {
    mockLoom = savant.Labs.MockLoom.createMockLoom();
    mockStore = savant.createStore({
      apiClients,
      loomStartData: mockLoom.getLoomStartData(),
      pluginName: "test-plugin",
      reducers: {},
      middleware: [],
    });
  });

  it("should check that onChange is triggered when text fields of custom metadata are updated", async () => {
    await act(async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <Form>
            <CustomAttributesSelect
              groupCustomAttributes={customMetadata}
              setGroupCustomAttributes={mockSetState}
              fieldErrors={fieldErrors}
            />
          </Form>
        </savant.Provider>
      );
    });

    const label = renderResult.getAllByLabelText(
      "models.selectPanes.modelTaxonomySelect.labels.label"
    );
    mockTextField(label[0], "new label");
    const value = renderResult.getAllByLabelText(
      "models.selectPanes.modelTaxonomySelect.labels.value"
    );
    customMetadata[0].key = "new label";
    expect(mockSetState).toHaveBeenCalledWith(customMetadata);
    mockTextField(value[0], "new value");
    customMetadata[0].value = "new value";
    expect(mockSetState).toHaveBeenCalledWith(customMetadata);
    const description = renderResult.getAllByLabelText(
      "models.selectPanes.modelTaxonomySelect.labels.description"
    );
    mockTextField(description[1], "new description");
    customMetadata[1].description = "new description";
    expect(mockSetState).toHaveBeenCalledWith(customMetadata);
  });

  it("should check that onRemove is triggered when text fields of custom metadata are removed", async () => {
    await act(async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <Form>
            <CustomAttributesSelect
              groupCustomAttributes={customMetadata}
              setGroupCustomAttributes={mockSetState}
              fieldErrors={fieldErrors}
            />
          </Form>
        </savant.Provider>
      );
    });
    const set = renderResult.getAllByLabelText("Delete");
    expect(set).toHaveLength(2);
    fireEvent.click(set[1]);
    const newCustomMetadata = customMetadata.filter((attribute) => attribute.id === "1");
    expect(mockSetState).toHaveBeenCalledWith(newCustomMetadata);
  });
});
const mockTextField = (inputField: HTMLElement, value: string) => {
  fireEvent.change(inputField, { target: { value } });
};
