import { render, RenderResult } from "@testing-library/react";
import * as React from "react";
import * as savant from "oui-savant";
import * as Messages from "@codegen/Messages";
import { LogTypeSelect } from "./LogTypeSelect";
import apiClients from "apiClients";
import { Form } from "oui-react";
import { act } from "react-dom/test-utils";

describe("LogTypeSelect", () => {
  const logTitle = "logTitle";
  const titleTooltip = "titleTooltip";
  const fieldNames = {
    subForm: "subForm",
    compartmentSelect: "compartmentSelect",
    logGroup: "logGroup",
    log: "log",
  };
  const defaultValues = {
    compartmentId: "",
    logGroup: "",
    log: "",
  };

  const fakeApiResponse = (data: any[]) => ({
    data,
    response: {
      status: 200,
      statusText: "unknown",
      ok: true,
      headers: {
        forEach: () => {},
        get: () => {},
      },
    } as unknown as Response,
  });

  let mockStore: savant.Store;
  let mockLoom: savant.Labs.MockLoom.MockLoom;
  let renderResult: RenderResult;

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

  it("should include the unconfigured option in the log select dropdown", async () => {
    apiClients.asyncLoggingApi.listLogs = jest.fn(() => Promise.resolve(fakeApiResponse([])));

    await act(async () => {
      renderResult = render(
        <savant.Provider store={mockStore as any}>
          <Form>
            <LogTypeSelect
              logTitle={logTitle}
              titleTooltip={titleTooltip}
              fieldNames={fieldNames}
              defaultValues={defaultValues}
            />
          </Form>
        </savant.Provider>
      );
    });

    expect(
      renderResult.getByText(Messages.modelDeployments.resources.logs.noLogSelected())
    ).toBeTruthy();
  });
});
