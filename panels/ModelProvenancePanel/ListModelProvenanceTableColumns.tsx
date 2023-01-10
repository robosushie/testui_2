import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import { Link, TCellWidth, TSortDirection, StatusLabel } from "oui-react";
import { StatusTypeForLifecycleState } from "constants/lifecycleStates";
import { ListPrettyLifecycleState } from "utils/lifecycleStatesUtils";
import { getDateTimeFormat } from "utils/timeUtils";
import { BulkQueryResults } from "oui-savant";
import * as IdentitySpecTypes from "identity-control-plane-api-client";
import { UserFromList } from "components/UserFromList/UserFromList";
import { getRouteClient } from "loom-plugin-runtime";
import { ResourceNames } from "../../constants/resourceNames";

const getNameCell = (row: any) => (
  <>
    {row.id.includes("datasciencenotebooksession") ? (
      <Link
        href={getRouteClient().makePluginUrl(`/${ResourceNames.notebooks}/${row.id}`)}
        openInNewWindow={true}
      >
        {row.displayName}
      </Link>
    ) : (
      <Link
        href={getRouteClient().makePluginUrl(`/${ResourceNames.jobRuns}/${row.id}`)}
        openInNewWindow={true}
      >
        {row.displayName}
      </Link>
    )}
  </>
);

const getStatusCell = (row: any) => (
  <StatusLabel statusType={StatusTypeForLifecycleState[row.lifecycleState]}>
    {ListPrettyLifecycleState(row.lifecycleState)}
  </StatusLabel>
);

const getCreatedOnCell = (row: any) => getDateTimeFormat(row.timeCreated);

export const getColumnsList = (
  user: BulkQueryResults<IdentitySpecTypes.User>,
  isLoadingUsers: boolean
) => {
  const getCreatedByCell = (row: any) => {
    return <UserFromList userId={row.createdBy} userResults={user} loading={isLoadingUsers} />;
  };

  return [
    {
      header: Messages.models.labels.name(),
      id: "displayName",
      cell: getNameCell,
      width: TCellWidth.OneQuarter,
      defaultSortDirection: TSortDirection.Asc,
    },
    {
      header: Messages.models.labels.state(),
      id: "status",
      cell: getStatusCell,
      width: TCellWidth.OneQuarter,
    },
    {
      header: Messages.models.labels.createdBy(),
      id: "createdBy",
      cell: getCreatedByCell,
      width: TCellWidth.OneQuarter,
    },
    {
      header: Messages.models.labels.timeCreated(),
      id: "timeCreated",
      cell: getCreatedOnCell,
      width: TCellWidth.OneQuarter,
    },
  ];
};
