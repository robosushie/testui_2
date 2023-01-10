import * as React from "react";
import {
  useQuery,
  useBulkQuery,
  Filters,
  useListingContextClientConsumer,
  useConsoleState,
} from "oui-savant";
import { SingleSelectListTable, ErrorText } from "oui-react";
import apiClients from "../../apiClients";
import { getColumnsList } from "./ListModelProvenanceTableColumns";
import { objectEquals } from "utils/dataUtils";
import * as Messages from "../../../codegen/Messages";
import { NotebookSessionSummary } from "odsc-client/dist/odsc-client";
import { isModelProvenanceResourceOCIDDisabled } from "../../utils/lifecycleStatesUtils";
import Label from "../../components/Label/Label";
import { SelectModelProvenanceOptions } from "./ModelProvenancePanel";

interface Props {
  notebookSessionId: string;
  selectModelProvenanceTypeOption: string;
  onSelectedModelProvenanceChanged: (selectedModelProvenance: any) => void;
  jobRunId: string;
}

const ListModelProvenanceByOcid: React.FC<Props> = ({
  notebookSessionId,
  onSelectedModelProvenanceChanged,
  selectModelProvenanceTypeOption,
  jobRunId,
}) => {
  const [isLoadingModelProvenances, setIsLoadingModelProvenances] = React.useState(true);
  const [modelProvenances, setModelProvenances] = React.useState([]);
  const [userId, setUserId] = React.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [users, setUsers] = React.useState([]);
  const [selectedOcids, setSelectedOcids] = React.useState<string[]>(undefined);
  const [selectedProjectId, setSelectedProjectId] = React.useState(null);
  const [selectedCompartmentId, setSelectedCompartmentId] = React.useState(null);
  const [errorText, setErrorText] = React.useState("");
  const { compartments } = useConsoleState();

  const findSelectedModelProvenance = (id: string) =>
    modelProvenances.find((modelProvenance) => modelProvenance.id === id);
  const onSelectedIdsChanged = (selectedIds: string[]) => {
    setSelectedOcids(selectedIds);
    onSelectedModelProvenanceChanged(findSelectedModelProvenance(selectedIds[0]));
  };

  const modelProvenanceQuery =
    selectModelProvenanceTypeOption === SelectModelProvenanceOptions.SelectByNotebookSession
      ? useQuery({
          method: apiClients.odscApi.getNotebookSession,
          options: {
            args: { notebookSessionId },
          },
        })
      : useQuery({
          method: apiClients.odscApi.getJobRun,
          options: {
            args: { jobRunId },
          },
        });
  const wait = !(modelProvenanceQuery.response && modelProvenanceQuery.response.data);
  React.useEffect(() => {
    const newModelProvenances =
      !modelProvenanceQuery.error && !modelProvenanceQuery.loading
        ? modelProvenanceQuery.response.data
        : {};
    setIsLoadingModelProvenances(modelProvenanceQuery.loading);
    if (modelProvenanceQuery.error) {
      if (
        (selectModelProvenanceTypeOption === SelectModelProvenanceOptions.SelectByNotebookSession &&
          notebookSessionId &&
          notebookSessionId.includes("notebooksession")) ||
        (selectModelProvenanceTypeOption === SelectModelProvenanceOptions.SelectByJobRun &&
          jobRunId &&
          jobRunId.includes("jobrun"))
      ) {
        setErrorText(Messages.models.selectPanes.modelProvenanceSelect.errorMessages.notFound());
      } else {
        setErrorText("");
      }
    } else if (!objectEquals(modelProvenances, [newModelProvenances])) {
      setModelProvenances([newModelProvenances]);
      if (modelProvenanceQuery.response && modelProvenanceQuery.response.data) {
        setUserId([{ userId: modelProvenanceQuery.response.data.createdBy }]);
        setSelectedProjectId(modelProvenanceQuery.response.data.projectId);
        setSelectedCompartmentId(modelProvenanceQuery.response.data.compartmentId);
        if (
          !isModelProvenanceResourceOCIDDisabled(modelProvenanceQuery.response.data.lifecycleState)
        ) {
          setSelectedOcids([modelProvenanceQuery.response.data.id]);
          onSelectedModelProvenanceChanged(modelProvenanceQuery.response.data);
        }
      }
    }
  }, [modelProvenanceQuery]);

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
  const projectQuery = useQuery({
    wait: !selectedProjectId,
    method: apiClients.odscApi.getProject,
    options: {
      args: {
        projectId: selectedProjectId,
      },
    },
  });
  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(
    modelProvenances,
    {
      sorting: { enable: true },
      filtering: { filters: [Filters.TagFilter.ClientFilter] },
    }
  );
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
  const isDisabled = (row: NotebookSessionSummary) =>
    isModelProvenanceResourceOCIDDisabled(row.lifecycleState);
  const getId = (row: NotebookSessionSummary) => row.id;

  return !modelProvenanceQuery.loading && !modelProvenanceQuery.error ? (
    <>
      <Label>
        {Messages.models.selectPanes.modelProvenanceSelect.labels.OcidtableLabel(
          selectModelProvenanceTypeOption === SelectModelProvenanceOptions.SelectByJobRun
            ? Messages.models.selectPanes.modelProvenanceSelect.labels.jobRunResource()
            : Messages.models.selectPanes.modelProvenanceSelect.labels.notebookSessionResource(),
          getProjectName(),
          getCompartmentName()
        )}
      </Label>
      <SingleSelectListTable
        data={page}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList(users, isLoadingUsers)}
        rowId={getId}
        loadingText={isLoadingModelProvenances && Messages.actions.loading()}
        disableControls={isLoadingModelProvenances}
        isSelectDisabled={isDisabled}
        selectedIds={selectedOcids}
        onSelectionChanged={onSelectedIdsChanged}
      />
    </>
  ) : (
    <ErrorText>{errorText}</ErrorText>
  );
};

export default ListModelProvenanceByOcid;
