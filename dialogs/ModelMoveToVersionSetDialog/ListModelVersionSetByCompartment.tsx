import * as React from "react";
import {
  useQuery,
  useBulkQuery,
  useListingContext,
  useListingContextClientConsumer,
  TimeInterval,
  useConsoleState,
} from "oui-savant";
import { SingleSelectListTable, ErrorText } from "oui-react";
import apiClients from "../../apiClients";
import { getColumnsList } from "./ListModelVersionSetTableColumns";
import { objectEquals, getUniqueUsersArg } from "utils/dataUtils";
import * as Messages from "@codegen/Messages";
import { LifecycleState } from "constants/lifecycleStates";
import Label from "../../components/Label/Label";

interface Props {
  preselectedModelVersionSetId?: any;
  selectedCompartmentId: string;
  selectedProjectId: string;
  onSelectedModelVersionSetChanged: (selectedModelProvenance: any) => void;
}

const ListModelVersionSetByCompartment: React.FC<Props> = ({
  selectedCompartmentId,
  selectedProjectId,
  onSelectedModelVersionSetChanged,
}) => {
  const { compartments } = useConsoleState();
  const [isLoadingModelVersionSets, setIsLoadingModelVersionSets] = React.useState(true);
  const [modelVersionSetList, setModelVersionSetList] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [errorText, setErrorText] = React.useState("");
  const [selectedOcids, setSelectedOcids] = React.useState([]);
  const onSelectedIdsChanged = (selectedIds: string[]) => {
    onSelectedModelVersionSetChanged(selectedIds[0]);
    setSelectedOcids(selectedIds);
  };
  const modelVersionSetListQuery = useQuery({
    wait: !selectedProjectId,
    method: apiClients.odscApi.listModelVersionSets,
    options: {
      args: {
        compartmentId: selectedCompartmentId,
        projectId: selectedProjectId,
        // Filters out all modelVersionSets which are in ACTIVE lifecycle state.
        lifecycleState: LifecycleState.ACTIVE,
        limit: 1000,
      },
      // This arg is required for client-side pagination.
      fetchAllPages: true,
      caching: { type: "polling", pollingInterval: TimeInterval.md },
    },
  });

  const projectQuery = useQuery({
    wait: !selectedProjectId,
    method: apiClients.odscApi.getProject,
    options: {
      args: {
        projectId: selectedProjectId,
      },
    },
  });

  const {
    paging: { pageSize, pageNumber },
  } = useListingContext();

  const wait = !(modelVersionSetListQuery.response && modelVersionSetListQuery.response.data);
  const args = wait ? [] : getUniqueUsersArg(modelVersionSetListQuery, pageSize, pageNumber);

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
    const newModelVersionSetList =
      !modelVersionSetListQuery.error && !modelVersionSetListQuery.loading
        ? modelVersionSetListQuery.response && modelVersionSetListQuery.response.data
        : [];
    setIsLoadingModelVersionSets(modelVersionSetListQuery.loading && !!selectedProjectId);
    if (modelVersionSetListQuery.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(modelVersionSetList, newModelVersionSetList)) {
      setModelVersionSetList(newModelVersionSetList);
    }
  }, [modelVersionSetListQuery]);

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(
    modelVersionSetList,
    {
      sorting: { enable: true },
    }
  );
  const getId = (row: any) => row.id;

  const getProjectName = () => {
    return !projectQuery.error && !projectQuery.loading
      ? projectQuery.response &&
          projectQuery.response.data &&
          projectQuery.response.data.displayName
      : "";
  };
  const getCompartmentName = () => {
    if (selectedCompartmentId) {
      const compartmentName = compartments.find((result) => {
        return result.id === selectedCompartmentId;
      });
      return compartmentName && compartmentName.name;
    }
    return "";
  };

  return errorText ? (
    <ErrorText>{errorText}</ErrorText>
  ) : (
    <>
      <Label>
        {Messages.models.labels.compartmentSelectLabel(getCompartmentName(), getProjectName())}
      </Label>
      <SingleSelectListTable
        testId="listTableByCompartment"
        data={page}
        numberShowingText={(numberShowing) =>
          Messages.models.labels.numberShowingText(numberShowing)
        }
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList(users, isLoadingUsers)}
        rowId={getId}
        loadingText={isLoadingModelVersionSets && Messages.actions.loading()}
        disableControls={isLoadingModelVersionSets}
        selectedIds={selectedOcids}
        onSelectionChanged={onSelectedIdsChanged}
      />
    </>
  );
};

export default ListModelVersionSetByCompartment;
