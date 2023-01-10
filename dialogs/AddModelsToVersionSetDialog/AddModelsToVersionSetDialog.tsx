import * as React from "react";
import { ErrorText, Form, FormRef, InfoBlockStatus, Modal, ToastNotification } from "oui-react";
import * as Messages from "@codegen/Messages";
import { getDialogBoxHelpLink, MANAGE_MODELS } from "../../utils/docUtils";
import {
  CompartmentScopedField,
  FormRemoteSubmitButton,
  ListingContextProvider,
  useConsoleState,
  useMutation,
} from "oui-savant";
import { Compartment } from "identity-control-plane-api-client";
import ProjectSelect from "projects/components/ProjectSelect/ProjectSelect";
import apiClients from "../../apiClients";
import DialogLoader from "../../components/DialogLoader/DialogLoader";
import ModelVersionSetModelList from "../../panels/ModelVersionSetCreatePanel/ModelVersionSetModelList";
import "./AddModelsToVersionSetDialog.less";

interface Props {
  closeHandler(): void;
  refresh(): void;
  modelVersionSetId: string;
  activeProjectId: string;
}

export const AddModelsToVersionSetDialog: React.FC<Props> = ({
  closeHandler,
  activeProjectId,
  refresh,
  modelVersionSetId,
}) => {
  const [ref, setRef] = React.useState<FormRef>(null);
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };
  const [errorText, setErrorText] = React.useState("");
  const [selectedModelIds, setSelectedModelIds] = React.useState(null);
  const [isMoveModelToModelVersionSetStarted, setIsMoveModelToModelVersionSetStarted] =
    React.useState(false);
  const { activeCompartment } = useConsoleState();
  const [compartment, setCompartmentId] = React.useState(activeCompartment.id);
  const [projectId, setProjectId] = React.useState(activeProjectId);
  const [labelList, setLabelList] = React.useState<Map<string, string>>(
    () => new Map<string, string>()
  );
  let modelsForAssociation = new Map<string, string>();

  const portalclass = "oui-dialog-width";
  const onSubmit = (): void => {
    if (selectedModelIds && selectedModelIds.length > 0) {
      setIsMoveModelToModelVersionSetStarted(true);
      callMoveModeltoVersionSetMutation(modelVersionSetId);
      refresh();
    } else {
      setErrorText(Messages.models.errorMessages.addModelToMVSDetailsDialog.noModelSelected());
    }
  };

  const fetchInitialCompartmentForProjectSelect = () => {
    return activeCompartment;
  };

  const onCompartmentChange = (compartment: Compartment) => {
    setCompartmentId(compartment.id);
    setProjectId(undefined);
  };

  const onProjectChange = (projectId: string) => {
    setProjectId(projectId);
  };

  const loading = isMoveModelToModelVersionSetStarted;

  const onSelectedModelIdsChanged = (
    selectedIds: string[],
    labelList: any,
    modelListForAssociation: Map<string, string>
  ) => {
    // sort models in created at desc
    setLabelList(labelList);
    setErrorText(null);
    modelsForAssociation = modelListForAssociation;
    setSelectedModelIds(selectedIds);
  };

  const getLabelFromId = (mvsId: string): string => {
    return labelList.get(mvsId);
  };
  const moveModeltoVersionSetMutation = useMutation({
    method: apiClients.odscApi.updateModel,
    onSuccess: (results) => {
      modelsForAssociation.delete(results.response.data.id);
      callMoveModeltoVersionSetMutation(results.response.data.modelVersionSetId);
    },
  });

  const callMoveModeltoVersionSetMutation = (modelVersionSetId: string) => {
    if (selectedModelIds.length > 0) {
      const modelId = selectedModelIds.pop();
      moveModeltoVersionSetMutation.invoke({
        modelId,
        updateModelDetails: {
          modelVersionSetId,
          versionLabel: getLabelFromId(modelId),
        },
      });
    } else {
      closeHandler();
    }
  };
  React.useEffect(() => {
    if (moveModeltoVersionSetMutation.result) {
      if (moveModeltoVersionSetMutation.result.error) {
        const modelName =
          modelsForAssociation &&
          modelsForAssociation.size !== 0 &&
          Array.from(modelsForAssociation.values())[0];
        ToastNotification.create({
          title: `${
            modelsForAssociation.size > 1
              ? Messages.modelVersionSets.error.mvsModelsAssociationError(
                  modelName,
                  modelName,
                  Array.from(modelsForAssociation.values())[modelsForAssociation.size - 1]
                )
              : Messages.modelVersionSets.error.mvsModelAssociationError(modelName)
          }`,
          status: InfoBlockStatus.Critical,
        });
      }
    }
  }, [moveModeltoVersionSetMutation.result]);

  return (
    <Modal
      portalClass={portalclass}
      testId="add-model-to-version-set-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.models.addTitle()}
      // TODO will update link with MVS
      helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "edit-models")}
      footerContent={
        <FormRemoteSubmitButton formRef={ref}>
          {Messages.models.actions.add()}
        </FormRemoteSubmitButton>
      }
    >
      {loading && <DialogLoader message={Messages.modelVersionSets.actions.loading()} />}
      <Form onSubmit={onSubmit} formRef={getFormRef}>
        <CompartmentScopedField
          fieldName={"compartmentScopedSelect"}
          label={Messages.models.labels.selectByProject()}
          initialCompartment={fetchInitialCompartmentForProjectSelect()}
          onChange={onCompartmentChange}
        >
          {({ selectedCompartment }) => (
            <ProjectSelect
              compartmentId={selectedCompartment.id}
              selectedProjectId={projectId}
              onChange={onProjectChange}
              label={""}
            />
          )}
        </CompartmentScopedField>
        <br />
        <ListingContextProvider paging={{ pageSize: 10 }}>
          <ModelVersionSetModelList
            selectedCompartmentId={compartment}
            selectedProjectId={projectId}
            onSelectedModelIdsChanged={onSelectedModelIdsChanged}
            preSelectedIds={selectedModelIds}
            preLabelList={labelList}
          />
        </ListingContextProvider>
        {/* Error messages */}
        {errorText && <ErrorText testId="model-get-error">{errorText}</ErrorText>}
      </Form>
    </Modal>
  );
};
