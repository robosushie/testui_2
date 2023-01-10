import { render } from "../../../unittest/utils/reactTestingLibraryUtils";
jest.doMock("oui-savant", () => ({
  ...(jest.requireActual("oui-savant") as any),
  useListingContext: jest.fn(),
  useListingContextClientConsumer: jest.fn(),
  useQuery: jest.fn(),
}));
import * as React from "react";
import apiClients from "../../apiClients";
import ListModelVersionSets from "./ListModelVersionSets";
import {
  Provider,
  Labs,
  createStore,
  Store,
  BulkQueryResults,
  useQuery,
  useListingContext,
  useListingContextClientConsumer,
} from "oui-savant";
import * as IdentitySpecTypes from "identity-control-plane-api-client";

let mockStore: Store;
let mockLoom: Labs.MockLoom.MockLoom;

describe("ListModelVersionSets", () => {
  const userList: BulkQueryResults<IdentitySpecTypes.User> = [];
  const props = {
    compartmentId: "c1",
    onSelectedModelVersionSetChanged: jest.fn(),
    users: userList,
    isLoadingUsers: false,
    preSelectedVersionId: "",
  };

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
    (useListingContext as jest.Mock).mockImplementation(() => {
      return { paging: { pageSize: 1, pageNumber: 1 } };
    });
    (useListingContextClientConsumer as jest.Mock).mockImplementation(() => {
      return { page: [], pagination: 1, sortOrder: "", setSortOrder: "" };
    });
  });

  describe("Select existing version sets table in create model", () => {
    it("should throw an error when model version sets query fails", () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: {},
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ListModelVersionSets {...props} />
        </Provider>
      );
      const errors = getByText("errors.generic");
      expect(errors).toBeTruthy();
    });
    it("should show loading text when model version sets query is loading", () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: true,
        error: false,
      });
      const { getByText } = render(
        <Provider store={mockStore as any}>
          <ListModelVersionSets {...props} />
        </Provider>
      );
      const loading = getByText("actions.loading");
      expect(loading).toBeTruthy();
    });
    it("should render the table", () => {
      (useQuery as jest.Mock).mockReturnValue({
        loading: false,
        error: false,
        response: [],
      });
      const { getByOuiTestId } = render(
        <Provider store={mockStore as any}>
          <ListModelVersionSets {...props} />
        </Provider>
      );
      expect(getByOuiTestId("list-version-set-table")).toBeTruthy();
    });
  });
});
