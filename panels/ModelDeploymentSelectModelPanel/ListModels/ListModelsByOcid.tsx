import * as React from "react";
import { useQuery, useBulkQuery, Filters, useListingContextClientConsumer } from "oui-savant";
import { SingleSelectListTable, ErrorText } from "oui-react";
import apiClients from "../../../apiClients";
import { getColumnsList } from "./ListModelsTableColumns";
import { objectEquals } from "utils/dataUtils";
import * as Messages from "../../../../codegen/Messages";
import { Model } from "odsc-client/dist/odsc-client";
import { isCreateModelDeploymentDisabled } from "../../../utils/lifecycleStatesUtils";

interface Props {
  modelId: string;
  onSelectedModelChanged: (selectedModel: Model) => void;
}

const ListModels: React.FC<Props> = ({ modelId, onSelectedModelChanged }) => {
  const [models, setModels] = React.useState([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);
  const [userId, setUserId] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [selectedOcids, setSelectedOcids] = React.useState<string[]>(undefined);
  const [errorText, setErrorText] = React.useState("");

  const findSelectedModel = (id: string) => models.find((m) => m.id === id);
  const onSelectedIdsChanged = (selectedIds: string[]) => {
    setSelectedOcids(selectedIds);
    onSelectedModelChanged(findSelectedModel(selectedIds[0]));
  };

  const modelQuery = useQuery({
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
    },
  });

  React.useEffect(() => {
    const newModels = !modelQuery.error && !modelQuery.loading ? modelQuery.response.data : {};
    setIsLoadingModels(modelQuery.loading);
    if (modelQuery.error) {
      setErrorText(Messages.modelDeployments.errorMessages.notFound());
    } else if (!objectEquals(models, [newModels])) {
      setModels([newModels]);
      if (modelQuery.response && modelQuery.response.data) {
        setUserId([{ userId: modelQuery.response.data.createdBy }]);
        // Pre-select the model and enable the submit button if lifecycleState allows
        if (!isCreateModelDeploymentDisabled(modelQuery.response.data.lifecycleState)) {
          setSelectedOcids([modelQuery.response.data.id]);
          onSelectedModelChanged(modelQuery.response.data);
        }
      }
    }
  }, [modelQuery]);

  const wait = !(modelQuery.response && modelQuery.response.data);
  const userBulkQuery = useBulkQuery({
    wait,
    method: apiClients.identityApi.getUser,
    options: {
      args: userId,
    },
  });

  React.useEffect(() => {
    if (!userBulkQuery.aggregatedResults.loading) {
      setIsLoadingUsers(userBulkQuery.aggregatedResults.loading);
      setUsers(userBulkQuery.results);
    }
  }, [userBulkQuery]);

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(models, {
    sorting: { enable: true },
    filtering: { filters: [Filters.TagFilter.ClientFilter] },
  });
  const isDisabled = (row: Model) => isCreateModelDeploymentDisabled(row.lifecycleState);
  const getId = (row: Model) => row.id;

  return errorText ? (
    <ErrorText>{errorText}</ErrorText>
  ) : (
    <SingleSelectListTable
      data={page}
      paginationProps={pagination}
      sortOrder={sortOrder}
      updateSortOrder={setSortOrder}
      columns={getColumnsList(users, isLoadingUsers)}
      rowId={getId}
      loadingText={isLoadingModels && Messages.actions.loading()}
      disableControls={isLoadingModels}
      isSelectDisabled={isDisabled}
      selectedIds={selectedOcids}
      onSelectionChanged={onSelectedIdsChanged}
      numberShowingText={(numberShowing) =>
        Messages.modelDeployments.selectPanes.modelSelect.customAttributes.numberShowingText(
          numberShowing
        )
      }
    />
  );
};

export default ListModels;
