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
import { getRouteClient } from "loom-plugin-runtime";
import { FeatureStoreSummary } from "fs-client";

import { StatusTypeForLifecycleState } from "../../../constants/lifecycleStates";
import { ListPrettyLifecycleState } from "../../../utils/lifecycleStatesUtils";

import { ResourceNames } from "../../../constants/resourceNames";
import * as Messages from "@codegen/Messages";
import { getDateTimeFormat } from "../../../utils/timeUtils";
import apiClients from "../../../apiClients";
import { EMPTY_TABLE_CELL_VALUE } from "../../../constants/table";
import { is404, objectEquals } from "../../../utils/dataUtils";

export const FeatureStoreList: React.FC = () => {
  const lifecycleState = Filters.LifecycleStateFilter.useState();
  const [data, setData] = React.useState<FeatureStoreSummary[]>(null);
  const [errorText, setErrorText] = React.useState("");

  // const [userResults, setUserResults] = React.useState([]);
  // const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const { activeCompartment } = useConsoleState();

  const featureStores = useQuery({
    method: apiClients.fsApi.listFeatureStores,
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
      !featureStores.error && !featureStores.loading ? featureStores.response.data : null;

    if (!activeCompartment) {
      setErrorText(Messages.errors.selectCompartment());
    } else if (is404(featureStores.error)) {
      setErrorText(Messages.errors.noListAuth(Messages.projects.linkText()));
    } else if (featureStores.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(data, newData) && newData) {
      setData(newData[0].items);

      setErrorText("");
    }
  }, [featureStores]);

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

  const loadingText = featureStores.loading && Messages.actions.loading();

  // Table column render functions
  const getNameCell = (row: FeatureStoreSummary) => (
    <Link href={getRouteClient().makePluginUrl(`/${ResourceNames.featureStore}/${row.id}`)}>
      {row.displayName}
    </Link>
  );
  const getStatusCell = (row: FeatureStoreSummary) => (
    <StatusLabel statusType={StatusTypeForLifecycleState[row.lifecycleState]}>
      {ListPrettyLifecycleState(row.lifecycleState as any)}
    </StatusLabel>
  );
  const getDescriptionCell = (row: FeatureStoreSummary) =>
    !!row.description ? row.description : EMPTY_TABLE_CELL_VALUE;
  // const getCreatedByCell = (row: FeatureStoreSummary) => (
  //   <UserFromList userId={row.createdBy} userResults={userResults} loading={isLoadingUsers} />
  // );
  const getTimeCreatedCell = (row: FeatureStoreSummary) => getDateTimeFormat(row.timeCreated);
  const getRowId = (row: FeatureStoreSummary) => row.id;

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
        caption={Messages.captions.featureStores()}
      />
    </>
  );
};

export default FeatureStoreList;
