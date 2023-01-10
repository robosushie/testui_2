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
import { getColumnsList } from "./ListModelProvenanceTableColumns";
import { objectEquals, getUniqueUsersArg } from "utils/dataUtils";
import * as Messages from "@codegen/Messages";
import { LifecycleState } from "constants/lifecycleStates";
import Label from "../../components/Label/Label";
import { SelectModelProvenanceOptions } from "./ModelProvenancePanel";

interface Props {
  preselectedModelProvenanceTrainingOcid?: any;
  selectedCompartmentId: string;
  selectModelProvenanceTypeOption: string;
  selectedProjectId: string;
  onSelectedModelProvenanceChanged: (selectedModelProvenance: any) => void;
}

const ListModelProvenanceByCompartment: React.FC<Props> = ({
  preselectedModelProvenanceTrainingOcid,
  selectedCompartmentId,
  selectedProjectId,
  onSelectedModelProvenanceChanged,
  selectModelProvenanceTypeOption,
}) => {
  const [isLoadingModelProvenance, setIsLoadingModelProvenance] = React.useState(true);
  const [modelProvenance, setModelProvenance] = React.useState([]);

  const [users, setUsers] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [errorText, setErrorText] = React.useState("");
  const selectedOcids =
    preselectedModelProvenanceTrainingOcid && preselectedModelProvenanceTrainingOcid.id
      ? [preselectedModelProvenanceTrainingOcid.id]
      : [];
  const { compartments } = useConsoleState();
  const findSelectedModelProvenance = (id: string) =>
    modelProvenance.find((modelProvenance) => modelProvenance.id === id);
  const onSelectedIdsChanged = (selectedIds: string[]) => {
    onSelectedModelProvenanceChanged(findSelectedModelProvenance(selectedIds[0]));
  };
  const modelProvenanceQuery =
    selectModelProvenanceTypeOption === SelectModelProvenanceOptions.SelectByJobRun
      ? useQuery({
          wait: !selectedProjectId,
          method: apiClients.odscApi.listJobRuns,
          options: {
            args: {
              compartmentId: selectedCompartmentId,
              // Filters out all modelProvenance which are  in SUCCEEDED lifecycle state.
              lifecycleState: LifecycleState.SUCCEEDED,
              limit: 1000,
            },
            // This arg is required for client-side pagination.
            fetchAllPages: true,
            caching: { type: "polling", pollingInterval: TimeInterval.md },
          },
        })
      : useQuery({
          wait: !selectedProjectId,
          method: apiClients.odscApi.listNotebookSessions,
          options: {
            args: {
              compartmentId: selectedCompartmentId,
              projectId: selectedProjectId,
              // Filters out all modelProvenance which are  in ACTIVE lifecycle state.
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

  React.useEffect(() => {
    const newModelProvenance =
      !modelProvenanceQuery.error && !modelProvenanceQuery.loading
        ? selectModelProvenanceTypeOption === SelectModelProvenanceOptions.SelectByJobRun
          ? filterJobRunByProject(modelProvenanceQuery.response.data)
          : modelProvenanceQuery.response.data
        : [];
    setIsLoadingModelProvenance(modelProvenanceQuery.loading && !!selectedProjectId);
    if (modelProvenanceQuery.error) {
      setErrorText(Messages.errors.generic());
    } else if (!objectEquals(modelProvenance, newModelProvenance)) {
      setModelProvenance(newModelProvenance);
    }
  }, [modelProvenanceQuery]);

  const {
    paging: { pageSize, pageNumber },
  } = useListingContext();

  const filterJobRunByProject = (jobRunlist: any) => {
    return jobRunlist.filter(filter);
  };
  const filter = (jobRun: any) => {
    return jobRun.projectId === selectedProjectId;
  };

  const wait = !(modelProvenanceQuery.response && modelProvenanceQuery.response.data);
  const args = wait ? [] : getUniqueUsersArg(modelProvenanceQuery, pageSize, pageNumber);

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

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(
    modelProvenance,
    {
      sorting: { enable: true },
    }
  );
  const getId = (row: any) => row.id;

  const getProjectName = () => {
    const project =
      !projectQuery.error && !projectQuery.loading ? projectQuery.response.data : null;
    if (project) {
      return project.displayName;
    }
    return "";
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
        {Messages.models.selectPanes.modelProvenanceSelect.notebookSession.compartmentTableLabel(
          selectModelProvenanceTypeOption === SelectModelProvenanceOptions.SelectByNotebookSession
            ? Messages.models.selectPanes.modelProvenanceSelect.labels.notebookSessionResource()
            : Messages.models.selectPanes.modelProvenanceSelect.labels.jobRunResource(),
          getProjectName(),
          getCompartmentName()
        )}
      </Label>
      <SingleSelectListTable
        testId="listTableByCompartment"
        data={page}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList(users, isLoadingUsers)}
        rowId={getId}
        loadingText={isLoadingModelProvenance && Messages.actions.loading()}
        disableControls={isLoadingModelProvenance}
        selectedIds={selectedOcids}
        onSelectionChanged={onSelectedIdsChanged}
      />
    </>
  );
};

export default ListModelProvenanceByCompartment;
