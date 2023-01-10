import * as React from "react";
import {
  useQuery,
  useBulkQuery,
  useListingContext,
  useListingContextClientConsumer,
  TimeInterval,
} from "oui-savant";
import { ErrorText, MultiSelectListTable } from "oui-react";
import apiClients from "../../apiClients";
import { objectEquals, getUniqueUsersArg } from "utils/dataUtils";
import * as Messages from "@codegen/Messages";
import { LifecycleState } from "constants/lifecycleStates";
import { getColumnsList } from "./ListModelsTableColumns";

interface Props {
  preselectedModelProvenanceTrainingOcid?: any;
  selectedCompartmentId: string;
  selectedProjectId: string;
  preSelectedIds: string[];
  onSelectedModelIdsChanged: (
    selectedModelIds: string[],
    labelList: Map<string, string>,
    modelListForAssociation: Map<string, string>
  ) => void;
  preLabelList: Map<string, string>;
}

const ModelVersionSetModelList: React.FC<Props> = ({
  selectedCompartmentId,
  selectedProjectId,
  onSelectedModelIdsChanged,
  preSelectedIds,
  preLabelList,
}) => {
  const [errorText, setErrorText] = React.useState("");
  const [models, setModels] = React.useState([]);
  const [isLoadingModels, setIsLoadingModels] = React.useState(true);
  const [selectedModelIds] = React.useState(preSelectedIds);
  const [users, setUsers] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const labelList = React.useMemo<Map<string, string>>(() => preLabelList, []);
  const modelsQuery = useQuery({
    wait: !selectedProjectId,
    method: apiClients.odscApi.listModels,
    options: {
      args: {
        compartmentId: selectedCompartmentId,
        projectId: selectedProjectId,
        // Filters out all models which are  in ACTIVE lifecycle state.
        lifecycleState: LifecycleState.ACTIVE,
        limit: 1000,
      },
      // This arg is required for client-side pagination.
      fetchAllPages: true,
      caching: { type: "polling", pollingInterval: TimeInterval.md },
    },
  });

  React.useEffect(() => {
    const newModels = !modelsQuery.error && !modelsQuery.loading ? modelsQuery.response.data : [];
    setIsLoadingModels(modelsQuery.loading && !!selectedProjectId);
    // only show models not already in version set
    const modelsNotInVersionSet = newModels.filter((model) => !model.modelVersionSetName);
    if (modelsQuery.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(models, modelsNotInVersionSet)) {
      setModels(modelsNotInVersionSet);
    }
  }, [modelsQuery]);

  const {
    paging: { pageSize, pageNumber },
  } = useListingContext();

  const wait = !(modelsQuery.response && modelsQuery.response.data);
  const args = wait ? [] : getUniqueUsersArg(modelsQuery, pageSize, pageNumber);

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
  const onSetLabels = (id: string, label: string) => {
    if (!label) {
      labelList.set(id, null);
    } else {
      labelList.set(id, label);
    }
  };

  const onSelectedModelIdChanged = (selectedIds: string[]) => {
    // sort models in created at desc
    const modelListForAssociation = new Map<string, string>();
    const sortedSelectedIds = models
      .filter((model) => selectedIds.includes(model.id))
      .sort((firstModel, secondModel) =>
        secondModel.timeCreated.localeCompare(firstModel.timeCreated)
      )
      .map((model) => {
        modelListForAssociation.set(model.id, model.displayName);
        return model.id;
      });
    onSelectedModelIdsChanged(sortedSelectedIds, labelList, modelListForAssociation);
  };

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(models, {
    sorting: { enable: true },
  });
  const getId = (row: any) => row.id;

  return errorText ? (
    <ErrorText>{errorText}</ErrorText>
  ) : (
    <>
      <MultiSelectListTable
        testId="listModelsTable"
        data={page}
        numberShowingText={(numberShowing) =>
          Messages.models.labels.numberShowingText(numberShowing)
        }
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList(users, isLoadingUsers, onSetLabels, labelList)}
        rowId={getId}
        loadingText={isLoadingModels && Messages.actions.loading()}
        disableControls={isLoadingModels}
        selectedIds={selectedModelIds}
        onSelectionChanged={onSelectedModelIdChanged}
      />
    </>
  );
};

export default ModelVersionSetModelList;
