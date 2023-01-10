import * as React from "react";
import {
  useQuery,
  useBulkQuery,
  useListingContext,
  useListingContextClientConsumer,
  TimeInterval,
} from "oui-savant";
import { SingleSelectListTable, ErrorText } from "oui-react";
import apiClients from "../../../apiClients";
import { getColumnsList } from "./ListModelsTableColumns";
import { objectEquals, getUniqueUsersArg } from "utils/dataUtils";
import * as Messages from "../../../../codegen/Messages";
import { Model } from "odsc-client/dist/odsc-client";
import { LifecycleState } from "constants/lifecycleStates";

interface Props {
  preSelectedModel?: Model;
  selectedCompartmentId: string;
  selectedProjectId: string;
  onSelectedModelChanged: (selectedModel: Model) => void;
}

const ListModelsByCompartment: React.FC<Props> = ({
  preSelectedModel,
  selectedCompartmentId,
  selectedProjectId,
  onSelectedModelChanged,
}) => {
  const [models, setModels] = React.useState([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);
  const [users, setUsers] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [errorText, setErrorText] = React.useState("");

  const selectedOcids = preSelectedModel && preSelectedModel.id ? [preSelectedModel.id] : [];

  const findSelectedModel = (id: string) => models.find((model) => model.id === id);
  const onSelectedIdsChanged = (selectedIds: string[]) => {
    onSelectedModelChanged(findSelectedModel(selectedIds[0]));
  };

  const modelQuery = useQuery({
    wait: !selectedProjectId,
    method: apiClients.odscApi.listModels,
    options: {
      args: {
        compartmentId: selectedCompartmentId,
        projectId: selectedProjectId,
        // Filters out all models which are not in ACTIVE lifecycle state.
        lifecycleState: LifecycleState.ACTIVE,
        // Dramatically over-fetch to account for client-side pagination.
        limit: 1000,
      },
      // This arg is required for client-side pagination.
      fetchAllPages: true,
      caching: { type: "polling", pollingInterval: TimeInterval.md },
    },
  });

  React.useEffect(() => {
    const newModels = !modelQuery.error && !modelQuery.loading ? modelQuery.response.data : [];
    setIsLoadingModels(modelQuery.loading && !!selectedProjectId);
    if (modelQuery.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(models, newModels)) {
      setModels(newModels);
    }
  }, [modelQuery]);

  const {
    paging: { pageSize, pageNumber },
  } = useListingContext();

  const wait = !(modelQuery.response && modelQuery.response.data);
  const args = wait ? [] : getUniqueUsersArg(modelQuery, pageSize, pageNumber);

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

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(models, {
    sorting: { enable: true },
  });
  const getId = (row: Model) => row.id;

  return errorText ? (
    <ErrorText>{errorText}</ErrorText>
  ) : (
    <>
      <SingleSelectListTable
        testId="listTableByCompartment"
        data={page}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList(users, isLoadingUsers)}
        rowId={getId}
        loadingText={isLoadingModels && Messages.actions.loading()}
        disableControls={isLoadingModels}
        selectedIds={selectedOcids}
        onSelectionChanged={onSelectedIdsChanged}
        numberShowingText={(numberShowing) =>
          Messages.modelDeployments.selectPanes.modelSelect.customAttributes.numberShowingText(
            numberShowing
          )
        }
      />
    </>
  );
};

export default ListModelsByCompartment;
