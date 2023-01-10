import * as React from "react";
import * as Messages from "@codegen/Messages";
import { Link, TCellWidth, TSortDirection, StatusLabel, TextInput } from "oui-react";
import { StatusTypeForLifecycleState } from "constants/lifecycleStates";
import { ListPrettyLifecycleState } from "utils/lifecycleStatesUtils";
import { getDateTimeFormat } from "utils/timeUtils";
import { BulkQueryResults } from "oui-savant";
import * as IdentitySpecTypes from "identity-control-plane-api-client";
import { UserFromList } from "components/UserFromList/UserFromList";
import { getRouteClient } from "loom-plugin-runtime";
import { ResourceNames } from "../../constants/resourceNames";

const getNameCell = (row: any) => (
  <Link
    href={getRouteClient().makePluginUrl(`/${ResourceNames.models}/${row.id}`)}
    openInNewWindow={true}
  >
    {row.displayName}
  </Link>
);

const getMVSNameCell = (row: any) => (
  <Link
    href={getRouteClient().makePluginUrl(`/${ResourceNames.modelVersionSets}/${row.id}`)}
    openInNewWindow={true}
  >
    {row.name}
  </Link>
);

const getStatusCell = (row: any) => (
  <StatusLabel statusType={StatusTypeForLifecycleState[row.lifecycleState]}>
    {ListPrettyLifecycleState(row.lifecycleState)}
  </StatusLabel>
);

const getCreatedOnCell = (row: any) => getDateTimeFormat(row.timeCreated);

export const getColumnsList = (
  user: BulkQueryResults<IdentitySpecTypes.User>,
  isLoadingUsers: boolean,
  onSetLabels: (id: string, label: string) => void,
  labelList?: Map<string, string>
) => {
  const getCreatedByCell = (row: any) => {
    return <UserFromList userId={row.createdBy} userResults={user} loading={isLoadingUsers} />;
  };

  const getVersionLabelCell = (row: any) => (
    <TextInput
      label={"versionLabel"}
      defaultValue={!!!labelList ? null : getLabelFromId(row.id)}
      onChange={(event) => onSetLabels(row.id, event.target.value)}
    />
  );

  const getLabelFromId = (mvsId: string): string => {
    return labelList.get(mvsId);
  };

  return [
    {
      header: Messages.models.selectPanes.modelVersionSet.table.name(),
      id: "displayName",
      cell: getNameCell,
      width: TCellWidth.OneFifth,
      defaultSortDirection: TSortDirection.Asc,
    },
    {
      header: Messages.models.labels.state(),
      id: "status",
      cell: getStatusCell,
      width: TCellWidth.OneFifth,
    },
    {
      header: Messages.models.labels.createdBy(),
      id: "createdBy",
      cell: getCreatedByCell,
      width: TCellWidth.OneFifth,
    },
    {
      header: Messages.models.labels.timeCreated(),
      id: "timeCreated",
      cell: getCreatedOnCell,
      width: TCellWidth.OneFifth,
    },
    {
      header: Messages.models.labels.versionLabel(),
      id: "versionLabel",
      cell: getVersionLabelCell,
      width: TCellWidth.OneFifth,
    },
  ];
};

export const getModelVersionSetColumnsList = (
  user: BulkQueryResults<IdentitySpecTypes.User>,
  isLoadingUsers: boolean
) => {
  const getCreatedByCell = (row: any) => {
    return <UserFromList userId={row.createdBy} userResults={user} loading={isLoadingUsers} />;
  };
  return [
    {
      header: Messages.models.labels.versionSetName(),
      id: "displayName",
      cell: getMVSNameCell,
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
