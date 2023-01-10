import * as React from "react";
import * as Messages from "@codegen/Messages";
import {
  CompartmentSelect,
  DisclosureLink,
  FormRemoteSubmitButton,
  ListingContextProvider,
  NormalError,
  Panel,
  PanelSize,
  TagsSubForm,
  useConsoleState,
  useMutation,
} from "oui-savant";
import apiClients from "apiClients";
import {
  ErrorText,
  Field,
  FieldSet,
  Form,
  FormErrors,
  FormRef,
  FormValues,
  InfoBlockStatus,
  Textarea,
  TextInput,
  ToastNotification,
} from "oui-react";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { CreateModelVersionSetDetails, ModelVersionSet } from "odsc-client/dist/odsc-client";
import { trimDisplayName, validateField } from "utils/formUtils";
import { getRouteClient } from "loom-plugin-runtime";
import { ResourceNames } from "constants/resourceNames";
import { useDispatch } from "redux-react-hook";
import { push } from "connected-react-router";
import ModelVersionSetModelList from "./ModelVersionSetModelList";

interface Props {
  onClose: () => void;
  projectId: string;
}

const ModelVersionSetCreatePanel: React.FC<Props> = ({ onClose, projectId }) => {
  const { activeCompartment } = useConsoleState();
  const [compartmentId, setCompartmentId] = React.useState(
    activeCompartment ? activeCompartment.id : undefined
  );

  const [isModelVersionSetStarted, setModelVersionSetStarted] = React.useState(false);

  const [selectedModelIds, setSelectedModelIds] = React.useState([]);
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [error, setError] = React.useState<NormalError>(undefined);
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };
  const [labelList, setLabelList] = React.useState<Map<string, string>>(
    () => new Map<string, string>()
  );
  const [modelsForAssociation, setModelsForAssociation] = React.useState<Map<string, string>>(
    () => new Map<string, string>()
  );
  /* Create Model */

  const dispatch = useDispatch();

  const modelVersionSetMutation = useMutation({
    method: apiClients.odscApi.createModelVersionSet,
    onSuccess: (result) => {
      const modelVersionSet: ModelVersionSet = result.response.data;
      if (!result.error) {
        setModelVersionSetStarted(true);
        callMoveModeltoVersionSetMutation(modelVersionSet.id);
      }
    },
  });

  const getLabelFromId = (mvsId: string): string => {
    return labelList.get(mvsId);
  };

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
      const url = getRouteClient().makePluginUrl(
        `/${ResourceNames.modelVersionSets}/${modelVersionSetId}`
      );
      dispatch(push(url));
    }
  };

  const moveModeltoVersionSetMutation = useMutation({
    method: apiClients.odscApi.updateModel,
    onSuccess: (results) => {
      modelsForAssociation.delete(results.response.data.id);
      callMoveModeltoVersionSetMutation(modelVersionSetMutation.result.response.data.id);
    },
  });

  const loading =
    (modelVersionSetMutation.result && !modelVersionSetMutation.result.error) ||
    isModelVersionSetStarted;

  React.useEffect(() => {
    if (modelVersionSetMutation.result) {
      if (modelVersionSetMutation.result.error) {
        setError(modelVersionSetMutation.result.error);
      } else if (modelVersionSetMutation.result.response) {
        ToastNotification.create({
          title: `${Messages.modelVersionSets.createModelVersionSetSuccessMessage()}`,
          status: InfoBlockStatus.Success,
        });
      }
    }
  }, [modelVersionSetMutation.result]);

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
        const url = getRouteClient().makePluginUrl(
          `/${ResourceNames.modelVersionSets}/${modelVersionSetMutation.result.response.data.id}`
        );
        dispatch(push(url));
      }
    }
  }, [moveModeltoVersionSetMutation.result]);

  React.useEffect(() => {
    if (error) {
      ToastNotification.create({
        title: `${error.body.message}`,
        status: InfoBlockStatus.Warning,
      });
    }
  }, [error]);

  const onSubmit = (form: Form): void => {
    const createModelVersionSetDetails = form.getValues();
    modelVersionSetMutation.reset();
    modelVersionSetMutation.invoke({
      createModelVersionSetDetails: {
        projectId,
        compartmentId: createModelVersionSetDetails.compartmentId,
        name: trimDisplayName(createModelVersionSetDetails.name),
        description: createModelVersionSetDetails.description,
        freeformTags:
          createModelVersionSetDetails.tags && createModelVersionSetDetails.tags.freeformTags,
        definedTags:
          createModelVersionSetDetails.tags && createModelVersionSetDetails.tags.definedTags,
      } as CreateModelVersionSetDetails,
    });
  };

  /* validation */

  const validate = (values: FormValues): FormErrors => ({
    name: validateField({ value: values.name, required: false, maxLen: 255 }),
    description: validateField({ value: values.description, required: false, maxLen: 400 }),
  });

  const onSelectedModelIdsChanged = (
    selectedIds: string[],
    labelList: any,
    modelListForAssociation: Map<string, string>
  ) => {
    // sort models in created at desc
    setSelectedModelIds(selectedIds);
    setModelsForAssociation(modelListForAssociation);
    setLabelList(labelList);
  };

  return (
    <>
      <Form formRef={getFormRef} onSubmit={onSubmit} validator={validate}>
        <Panel
          actions={[
            <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"}>
              {Messages.actions.create()}
            </FormRemoteSubmitButton>,
          ]}
          onClose={onClose}
          title={Messages.modelVersionSets.createTitle()}
          size={PanelSize.Large}
        >
          <div className="fullscreen-two-thirds-width">
            {loading && <DialogLoader message={Messages.modelVersionSets.actions.loading()} />}
            <CompartmentSelect
              value={compartmentId}
              onChange={(compartment) => setCompartmentId(compartment.id)}
              fieldName="compartmentId"
              tooltip={Messages.tooltips.compartmentSelect()}
              label={Messages.modelVersionSets.labels.compartment()}
            />
            <Field
              label={Messages.modelVersionSets.labels.name()}
              fieldName="name"
              hint={Messages.models.selectPanes.modelVersionSet.hints.name()}
            >
              <TextInput required={true} />
            </Field>
            <Field
              label={Messages.modelVersionSets.labels.description()}
              fieldName="description"
              optional={true}
            >
              <Textarea />
            </Field>
            <FieldSet legend={Messages.modelVersionSets.labels.selectModels()}>
              <p>{Messages.modelVersionSets.labels.selectModelsDescription()}</p>
              <ListingContextProvider paging={{ pageSize: 10 }}>
                <ModelVersionSetModelList
                  selectedCompartmentId={compartmentId}
                  selectedProjectId={projectId}
                  onSelectedModelIdsChanged={onSelectedModelIdsChanged}
                  preSelectedIds={selectedModelIds}
                  preLabelList={labelList}
                />
              </ListingContextProvider>
            </FieldSet>
            <DisclosureLink>
              <TagsSubForm showLabel={true} compartmentId={compartmentId} />
            </DisclosureLink>
            {modelVersionSetMutation.result && modelVersionSetMutation.result.error && (
              <ErrorText>{modelVersionSetMutation.result.error.body.message}</ErrorText>
            )}
          </div>
        </Panel>
      </Form>
    </>
  );
};

export default ModelVersionSetCreatePanel;
