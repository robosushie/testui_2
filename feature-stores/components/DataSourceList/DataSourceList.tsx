import * as React from "react";
import {
  ListTable,
  TCellWidth,
  StatusLabel,
  TSortDirection,
  Link,
  InfoBlockStatus,
  ToastNotification,
} from "oui-react";
import {
  useListingContextClientConsumer,
  useQuery,
  Filters,
  useConsoleState,
  TimeInterval,
} from "oui-savant";
import { ProjectSummary } from "odsc-client";
import { DataSourceSummary } from "fs-client";

import { StatusTypeForLifecycleState } from "../../../constants/lifecycleStates";
import { ListPrettyLifecycleState } from "../../../utils/lifecycleStatesUtils";

import * as Messages from "@codegen/Messages";
import { getDateTimeFormat } from "../../../utils/timeUtils";
import apiClients from "../../../apiClients";
import { EMPTY_TABLE_CELL_VALUE } from "../../../constants/table";
import { is404, objectEquals } from "../../../utils/dataUtils";

export const DataSourceList: React.FC = () => {
  const lifecycleState = Filters.LifecycleStateFilter.useState();
  const [data, setData] = React.useState<DataSourceSummary[]>(null);
  const [errorText, setErrorText] = React.useState("");

  // const [userResults, setUserResults] = React.useState([]);
  // const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const { activeCompartment } = useConsoleState();

  const dataSources = useQuery({
    method: apiClients.fsApi.listDataSources,
    options: {
      args: {
        lifecycleState,
        // Dramatically over-fetch to account for client-side pagination.
        limit: 1000,
        compartmentId: activeCompartment && activeCompartment.id,
      },
      // This arg is required for client-side pagination.
      fetchAllPages: true,
      caching: { type: "polling", pollingInterval: TimeInterval.md },
    },
  });

  // const {
  //   paging: { pageSize, pageNumber }
  // } = useListingContext();

  // const wait = !(featureStores.response && featureStores.response.data);
  // const args = wait ? [] : getUniqueUsersArg(featureStores, pageSize, pageNumber);

  // const userBulkQueryResult = useBulkQuery({
  //   wait,
  //   method: apiClients.identityApi.getUser,
  //   options: { args },
  // });

  React.useEffect(() => {
    const newData: any =
      !dataSources.error && !dataSources.loading ? dataSources.response.data : null;

    if (!activeCompartment) {
      setErrorText(Messages.errors.selectCompartment());
    } else if (is404(dataSources.error)) {
      setErrorText(Messages.errors.noListAuth(Messages.projects.linkText()));
    } else if (dataSources.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(data, newData) && newData) {
      setData(newData[0].items);

      setErrorText("");
    }
  }, [dataSources]);

  React.useEffect(() => {
    if (errorText !== "") {
      ToastNotification.create({
        title: `${Messages.errors.fetching()} ${errorText} ${Messages.errors.refreshHint()}`,
        status: InfoBlockStatus.Warning,
      });
    }
  }, [errorText]);

  // React.useEffect(() => {
  //   if (!userBulkQueryResult.aggregatedResults.loading) {
  //     setIsLoadingUsers(userBulkQueryResult.aggregatedResults.loading);
  //     setUserResults(userBulkQueryResult.results);
  //   }
  // }, [userBulkQueryResult]);

  const loadingText = dataSources.loading && Messages.actions.loading();

  // Table column render functions
  const getNameCell = (row: DataSourceSummary) => (
    <Link>
      {row.displayName}
    </Link>
  );
  const getStatusCell = (row: ProjectSummary) => (
    <StatusLabel statusType={StatusTypeForLifecycleState[row.lifecycleState]}>
      {ListPrettyLifecycleState(row.lifecycleState)}
    </StatusLabel>
  );
  const getDescriptionCell = (row: ProjectSummary) =>
    !!row.description ? row.description : EMPTY_TABLE_CELL_VALUE;
  // const getCreatedByCell = (row: ProjectSummary) => (
  //   <UserFromList userId={row.createdBy} userResults={userResults} loading={isLoadingUsers} />
  // );
  const getTimeCreatedCell = (row: ProjectSummary) => getDateTimeFormat(row.timeCreated);
  const getRowId = (row: ProjectSummary) => row.id;

  // Table columns
  const columns = [
    {
      header: Messages.projects.labels.name(),
      id: "displayName",
      cell: getNameCell,
      width: TCellWidth.OneSixth,
      // Presence of this property is what enables the carets on the column header
      // Default when clicking for the first time will be A-Z
      defaultSortDirection: TSortDirection.Asc,
    },
    {
      header: Messages.projects.labels.state(),
      id: "status",
      cell: getStatusCell,
      width: TCellWidth.OneSixth,
    },
    {
      header: Messages.projects.labels.description(),
      id: "description",
      cell: getDescriptionCell,
      width: TCellWidth.OneThird,
    },
    // {
    //   header: Messages.projects.labels.createdBy(),
    //   id: "createdBy",
    //   cell: getCreatedByCell,
    //   width: TCellWidth.OneSixth,
    // },
    {
      header: Messages.projects.labels.timeCreated(),
      id: "timeCreated",
      cell: getTimeCreatedCell,
      width: TCellWidth.OneSixth,
      // Presence of this property is what enables the carets on the column header
      defaultSortDirection: TSortDirection.Desc,
    },
  ];

  // Render actions
  // @ts-ignore

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(
    data ? data : null,
    {
      sorting: { enable: true },
      filtering: { filters: [Filters.TagFilter.ClientFilter] },
    }
  );

  return (
    <>
      <ListTable
        data={page}
        loadingText={loadingText}
        columns={columns}
        rowId={getRowId}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        numberShowingText={(numberShowing) =>
          Messages.projects.labels.numberShowingText(numberShowing)
        }
        caption={Messages.captions.projects()}
      />
    </>
  );
};

export default DataSourceList;
