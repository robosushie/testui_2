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

// import {FeatureStoreSummary, Entity} from "fs-client";
import { getDateTimeFormat } from "utils/timeUtils";

import { StatusTypeForLifecycleState } from "constants/lifecycleStates";
import { ListPrettyLifecycleState } from "../../../utils/lifecycleStatesUtils";

import { is404, objectEquals } from "utils/dataUtils";
import apiClients from "apiClients";
import * as Messages from "@codegen/Messages";
import { EMPTY_TABLE_CELL_VALUE } from "../../../constants/table";
import { FeatureDefinitionSummary } from "fs-client";
import { getRouteClient } from "loom-plugin-runtime";
import { ResourceNames } from "../../../constants/resourceNames";

interface Props {
  featureStoreId: string;
}

// tslint:disable-next-line:no-unused
export const FeatureDefinitionList: React.FC<Props> = ({ featureStoreId }) => {
  const [data, setData] = React.useState<FeatureDefinitionSummary[]>(null);
  const [errorText, setErrorText] = React.useState("");
  const lifecycleState = Filters.LifecycleStateFilter.useState();
  const { activeCompartment } = useConsoleState();

  const entities = useQuery({
    method: apiClients.fsApi.listFeatureDefinitions,
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

  React.useEffect(() => {
    const newData: any = !entities.error && !entities.loading ? entities.response.data : null;

    if (!activeCompartment) {
      setErrorText(Messages.errors.selectCompartment());
    } else if (is404(entities.error)) {
      setErrorText(Messages.errors.noListAuth(Messages.projects.linkText()));
    } else if (entities.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(data, newData) && newData) {
      setData(newData[0].items);

      setErrorText("");
    }
  }, [entities]);

  React.useEffect(() => {
    if (errorText !== "") {
      ToastNotification.create({
        title: `${Messages.errors.fetching()} ${errorText} ${Messages.errors.refreshHint()}`,
        status: InfoBlockStatus.Warning,
      });
    }
  }, [errorText]);

  const loadingText = entities.loading && Messages.actions.loading();

  // Table column render functions
  const getNameCell = (row: FeatureDefinitionSummary) => (
    <Link
      href={getRouteClient().makePluginUrl(
        `/${ResourceNames.featureStoreFeatureDefinition}/${row.id}`
      )}
    >
      {row.displayName}
    </Link>
  );
  const getStatusCell = (row: FeatureDefinitionSummary) => (
    <StatusLabel statusType={StatusTypeForLifecycleState[row.lifecycleState]}>
      {ListPrettyLifecycleState(row.lifecycleState as any)}
    </StatusLabel>
  );

  const getTimeCreatedCell = (row: FeatureDefinitionSummary) => getDateTimeFormat(row.timeCreated);
  const getRowId = (row: FeatureDefinitionSummary) => row.id;
  const getDescriptionCell = (row: FeatureDefinitionSummary) =>
    !!row.description ? row.description : EMPTY_TABLE_CELL_VALUE;

  // Table columns
  const columns = [
    {
      header: Messages.projects.labels.name(),
      id: "displayName",
      cell: getNameCell,
      width: TCellWidth.OneFifth,
      // Presence of this property is what enables the carets on the column header
      // Default when clicking for the first time will be A-Z
      defaultSortDirection: TSortDirection.Asc,
    },
    {
      header: Messages.projects.labels.description(),
      id: "description",
      cell: getDescriptionCell,
      width: TCellWidth.OneThird,
    },
    {
      header: Messages.projects.labels.state(),
      id: "status",
      cell: getStatusCell,
      width: TCellWidth.OneFifth,
    },
    {
      header: Messages.projects.labels.timeCreated(),
      id: "timeCreated",
      cell: getTimeCreatedCell,
      width: TCellWidth.OneFifth,
      // Presence of this property is what enables the carets on the column header
      defaultSortDirection: TSortDirection.Desc,
    },
  ];
  // @ts-ignore

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(data, {
    sorting: { enable: true },
    filtering: { filters: [Filters.TagFilter.ClientFilter] },
  });

  // @ts-ignore
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
        caption={Messages.captions.entities()}
      />
    </>
  );
};
