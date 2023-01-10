import * as React from "react";
import {
  useQuery,
  useListingContextClientConsumer,
  TimeInterval,
  useBulkQuery,
  useListingContext,
} from "oui-savant";
import { SingleSelectListTable, ErrorText } from "oui-react";
import apiClients from "../../apiClients";
import { getModelVersionSetColumnsList } from "../ModelVersionSetCreatePanel/ListModelsTableColumns";
import { getUniqueUsersArg, objectEquals } from "utils/dataUtils";
import * as Messages from "@codegen/Messages";
import { ModelVersionSet } from "odsc-client/dist/odsc-client";
import { LifecycleState } from "../../constants/lifecycleStates";

interface Props {
  compartmentId: string;
  onSelectedModelVersionSetChanged: (selectedModelVersionSetId: ModelVersionSet) => void;
  preSelectedVersionId: string;
}

const ListModelVersionSets: React.FC<Props> = ({
  compartmentId,
  onSelectedModelVersionSetChanged,
  preSelectedVersionId,
}) => {
  const [modelVersionSets, setModelVersionSets] = React.useState([]);
  const [isLoadingModelVersionSets, setIsLoadingModelVersionSets] = React.useState(true);
  const selectedOcids = !!preSelectedVersionId ? [preSelectedVersionId] : [];
  const [users, setUsers] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [errorText, setErrorText] = React.useState("");

  const findSelectedModelVersionSet = (id: string) =>
    modelVersionSets.find((modelVersionSet) => modelVersionSet.id === id);
  const onSelectedIdsChanged = (selectedIds: string[]) => {
    onSelectedModelVersionSetChanged(findSelectedModelVersionSet(selectedIds[0]));
  };

  const modelVersionSetQuery = useQuery({
    method: apiClients.odscApi.listModelVersionSets,
    options: {
      args: {
        compartmentId,
        lifecycleState: LifecycleState.ACTIVE,
        limit: 1000,
      },
      fetchAllPages: true,
      caching: { type: "polling", pollingInterval: TimeInterval.md },
    },
  });

  const {
    paging: { pageSize, pageNumber },
  } = useListingContext();

  const wait = !(modelVersionSetQuery.response && modelVersionSetQuery.response.data);
  const args = wait ? [] : getUniqueUsersArg(modelVersionSetQuery, pageSize, pageNumber);

  const userBulkQuery = useBulkQuery({
    wait,
    method: apiClients.identityApi.getUser,
    options: { args },
  });

  React.useEffect(() => {
    if (!userBulkQuery.aggregatedResults.loading) {
      setIsLoadingUsers(userBulkQuery.aggregatedResults.loading);
      setUsers(userBulkQuery.results);
    }
  }, [userBulkQuery]);
  React.useEffect(() => {
    const newModelVersionSets =
      !modelVersionSetQuery.error && !modelVersionSetQuery.loading
        ? modelVersionSetQuery.response.data
        : [];
    setIsLoadingModelVersionSets(modelVersionSetQuery.loading);
    if (modelVersionSetQuery.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(modelVersionSets, newModelVersionSets)) {
      setModelVersionSets(newModelVersionSets);
    }
  }, [modelVersionSetQuery]);

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(
    modelVersionSets,
    {
      sorting: { enable: true },
    }
  );
  const getId = (row: ModelVersionSet) => row.id;

  return errorText ? (
    <ErrorText>{errorText}</ErrorText>
  ) : (
    <SingleSelectListTable
      testId={"list-version-set-table"}
      data={page}
      numberShowingText={(numberShowing) => Messages.models.labels.numberShowingText(numberShowing)}
      paginationProps={pagination}
      sortOrder={sortOrder}
      updateSortOrder={setSortOrder}
      columns={getModelVersionSetColumnsList(users, isLoadingUsers)}
      rowId={getId}
      loadingText={isLoadingModelVersionSets && Messages.actions.loading()}
      disableControls={isLoadingModelVersionSets}
      selectedIds={selectedOcids}
      onSelectionChanged={onSelectedIdsChanged}
    />
  );
};

export default ListModelVersionSets;
