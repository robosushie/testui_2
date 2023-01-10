import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import {
  CompartmentSelect,
  FormRemoteSubmitButton,
  NormalError,
  Panel,
  PanelSize,
  useConsoleState,
  useMutation,
  useQuery,
  useWhitelist,
} from "oui-savant";
import apiClients from "apiClients";
import {
  Field,
  Form,
  FormErrors,
  FormRef,
  FormValues,
  InfoBlockStatus,
  Textarea,
  TextInput,
  ToastNotification,
} from "oui-react";
import { useModalState } from "../../hooks/useModalState";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { trimDisplayName, validateField } from "utils/formUtils";
import { ModelAdvancedOptions } from "components/ModelAdvancedOptions/ModelAdvancedOptions";
import { Metadata, Model, UpdateModelDetails, ModelProvenance } from "odsc-client/dist/odsc-client";
import { objectEquals } from "../../utils/dataUtils";
import SelectCard from "../../components/SelectCard/SelectCard";
import {
  ModelProvenancePanel,
  SelectModelProvenanceOptions,
} from "../ModelProvenancePanel/ModelProvenancePanel";
import { LifecycleState } from "../../constants/lifecycleStates";
import {
  CustomAttribute,
  ModelDefinedMetadata,
  ModelTaxonomy,
  ModelTaxonomyPanel,
} from "../ModelTaxonomyPanel/ModelTaxonomyPanel";
import {
  getModelDefinedMetadataAsList,
  getModelMetadataValues,
} from "../../utils/modelTaxonomyUtils";
import { MODEL_STORE_V3_ENABLED_WHITELIST } from "../../pluginConstants";
import { CompareVersion } from "../../constants/modelVersioning";
import { getLabelForValue } from "../../constants/modelTaxonomy";

interface Props {
  onClose: () => void;
  modelId: string;
  refresh: () => void;
  provenanceRefresh?(): void;
}

const ModelEditPanel: React.FC<Props> = ({ onClose, refresh, provenanceRefresh, modelId }) => {
  const [isModelStoreV3Enabled] = useWhitelist(MODEL_STORE_V3_ENABLED_WHITELIST);
  const [model, setModel] = React.useState<Model>(undefined);
  const [modelCustomAttributes, setModelCustomAttributes] = React.useState<CustomAttribute[]>([]);
  const [modelDefinedMetadata, setModelDefinedMetadata] =
    React.useState<ModelDefinedMetadata>(undefined);

  const [preSelectedModelTaxonomy, setPreSelectedModelTaxonomy] = React.useState<ModelTaxonomy>({
    modelDefinedMetadata: {},
    customAttributes: [],
  });
  const [isModelTaxonomyOpen, openModelTaxonomy, closeModelTaxonomy] = useModalState();
  const { compartments } = useConsoleState();
  const { activeCompartment } = useConsoleState();
  const [compartmentId, setCompartmentId] = React.useState(
    activeCompartment ? activeCompartment.id : undefined
  );
  const [isModelProvenanceOpen, openModelProvenance, closeModelProvenance] = useModalState();
  const [selectedModelProvenanceTrainingResource, setSelectedModelProvenanceTrainingResource] =
    React.useState<any>(undefined);
  const [selectedModelProvenance, setSelectedModelProvenance] = React.useState<ModelProvenance>({});
  const [preselectedModelProvenanceCardType, setPreselectedModelProvenanceCardType] =
    React.useState(SelectModelProvenanceOptions.SelectByNotebookSession);

  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [error, setError] = React.useState<NormalError>(undefined);

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const modelQuery = useQuery({
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
    },
  });

  const modelReady = !modelQuery.error && modelQuery.response && modelQuery.response.data;
  const isSubResourcesCallable =
    modelReady && modelQuery.response.data.lifecycleState !== LifecycleState.DELETED;

  React.useEffect(() => {
    const newModel =
      modelQuery && !modelQuery.error && !modelQuery.loading ? modelQuery.response.data : undefined;
    if (!objectEquals(model, newModel)) {
      setModel(newModel);
      const customMetadata = newModel.customMetadataList as CustomAttribute[];
      const definedMetadata = newModel.definedMetadataList as Metadata[];
      const { modelDefinedMetadataDetails, modelCustomAttributesList } = getModelMetadataValues(
        definedMetadata,
        customMetadata
      );
      setModelDefinedMetadata(modelDefinedMetadataDetails);
      setModelCustomAttributes(modelCustomAttributesList);
      const updatedModelTaxonomy: ModelTaxonomy = {
        modelDefinedMetadata: modelDefinedMetadataDetails,
        customAttributes: modelCustomAttributesList,
      };
      setPreSelectedModelTaxonomy(updatedModelTaxonomy);
    }
    if (modelQuery && modelQuery.error) {
      setError(modelQuery.error);
    }
    if (newModel) {
      setCompartmentId(newModel.compartmentId);
    }
  }, [modelQuery]);

  const modelProvenanceQuery = useQuery({
    wait: !isSubResourcesCallable,
    method: apiClients.odscApi.getModelProvenance,
    options: {
      args: { modelId },
    },
  });

  const modelProvenanceReady =
    !modelProvenanceQuery.error &&
    modelProvenanceQuery.response &&
    modelProvenanceQuery.response.data;

  const isModelProvenanceSubResourcesCallable =
    modelProvenanceReady && modelProvenanceQuery.response.data.trainingId !== null;
  const [isModelProvenanceUpdated, setIsModelProvenanceUpdated] = React.useState(false);
  const [isModelProvenanceTrainingResourceUpdated, setIsModelProvenanceTrainingResourceUpdated] =
    React.useState(false);
  React.useEffect(() => {
    const newModelProvenance =
      modelProvenanceQuery && !modelProvenanceQuery.error && !modelProvenanceQuery.loading
        ? modelProvenanceQuery.response.data
        : undefined;
    if (!objectEquals(selectedModelProvenance, newModelProvenance) && !isModelProvenanceUpdated) {
      setIsModelProvenanceUpdated(true);
      setSelectedModelProvenance(newModelProvenance);
    }
    if (modelProvenanceQuery && modelProvenanceQuery.error && !isModelProvenanceUpdated) {
      setIsModelProvenanceUpdated(true);
      setError(modelProvenanceQuery.error);
    }
  }, [modelProvenanceQuery]);

  const modelProvenanceTrainingResourceQuery =
    modelProvenanceReady &&
    modelProvenanceReady.trainingId &&
    modelProvenanceReady.trainingId.includes(CompareVersion.datasciencejobrun)
      ? useQuery({
          wait: !isModelProvenanceSubResourcesCallable,
          method: apiClients.odscApi.getJobRun,
          options: {
            args: { jobRunId: modelProvenanceReady && modelProvenanceReady.trainingId },
          },
        })
      : useQuery({
          wait: !isModelProvenanceSubResourcesCallable,
          method: apiClients.odscApi.getNotebookSession,
          options: {
            args: { notebookSessionId: modelProvenanceReady && modelProvenanceReady.trainingId },
          },
        });
  React.useEffect(() => {
    const provenanceTrainingResourceData =
      !modelProvenanceTrainingResourceQuery.error && !modelProvenanceTrainingResourceQuery.loading
        ? modelProvenanceTrainingResourceQuery.response.data
        : {};
    if (modelProvenanceTrainingResourceQuery.error && !isModelProvenanceTrainingResourceUpdated) {
      setIsModelProvenanceTrainingResourceUpdated(true);
      setSelectedModelProvenanceTrainingResource({});
    } else if (
      !objectEquals(selectedModelProvenanceTrainingResource, provenanceTrainingResourceData) &&
      !isModelProvenanceTrainingResourceUpdated
    ) {
      setIsModelProvenanceTrainingResourceUpdated(true);
      setSelectedModelProvenanceTrainingResource(provenanceTrainingResourceData);
      modelProvenanceReady &&
      modelProvenanceReady.trainingId &&
      modelProvenanceReady.trainingId.includes(CompareVersion.datasciencejobrun)
        ? setPreselectedModelProvenanceCardType(SelectModelProvenanceOptions.SelectByJobRun)
        : setPreselectedModelProvenanceCardType(
            SelectModelProvenanceOptions.SelectByNotebookSession
          );
    }
  }, [modelProvenanceTrainingResourceQuery]);

  const callUpdateProvenance = async (modelId: string): Promise<any> => {
    const values = selectedModelProvenance;
    if (values === undefined) {
      provenanceMutation.invoke({
        modelId,
        updateModelProvenanceDetails: {},
      });
    } else {
      provenanceMutation.invoke({
        modelId,
        updateModelProvenanceDetails: {
          repositoryUrl: values.repositoryUrl,
          gitCommit: values.gitCommit,
          gitBranch: values.gitBranch,
          scriptDir: values.scriptDir,
          trainingScript: values.trainingScript,
          trainingId: values.trainingId,
        },
      });
    }
  };

  const modelMutation = useMutation({
    method: apiClients.odscApi.updateModel,
    onSuccess: (results) => {
      refresh();
      if (modelProvenanceQuery.error && modelProvenanceQuery.error.status.toString() === "400") {
        onClose();
      } else {
        callUpdateProvenance(results.response.data.id);
      }
    },
  });

  const loading = !model || (modelMutation.result && modelMutation.result.loading);

  const provenanceMutation = useMutation({
    method: apiClients.odscApi.updateModelProvenance,
    onSuccess: () => {
      provenanceRefresh && provenanceRefresh();
      onClose();
    },
  });

  const getModelProvenanceSelectLabel = () => {
    if (selectedModelProvenanceTrainingResource && selectedModelProvenanceTrainingResource.id) {
      const compartment = compartments.find(
        (compartment) => compartment.id === selectedModelProvenanceTrainingResource.compartmentId
      );
      const compartmentNameValue = compartment ? compartment.name : compartmentId;
      return Messages.models.selectPanes.modelProvenanceSelect.labels.selectedInputLabel(
        selectedModelProvenanceTrainingResource.displayName,
        compartmentNameValue
      );
    } else return Messages.models.labels.modelProvenanceSelect();
  };

  const getModelTaxonomySelectSelections = () => {
    const modelTaxonomyMap: Map<string, string> = new Map<string, string>();
    if (modelDefinedMetadata && !!modelDefinedMetadata.useCaseType) {
      modelTaxonomyMap.set(
        Messages.models.selectPanes.modelTaxonomySelect.labels.useCaseType(),
        getLabelForValue(modelDefinedMetadata.useCaseType)
      );
    }
    if (modelDefinedMetadata && !!modelDefinedMetadata.frameworkName) {
      modelTaxonomyMap.set(
        Messages.models.selectPanes.modelTaxonomySelect.labels.framework(),
        getLabelForValue(modelDefinedMetadata.frameworkName)
      );
    }
    if (modelDefinedMetadata && !!modelDefinedMetadata.algorithm) {
      modelTaxonomyMap.set(
        Messages.models.selectPanes.modelTaxonomySelect.labels.estimatorObject(),
        getLabelForValue(modelDefinedMetadata.algorithm)
      );
    }
    return modelTaxonomyMap;
  };

  const onModelTaxonomySubmit = (newModelTaxonomy: ModelTaxonomy) => {
    setModelCustomAttributes(newModelTaxonomy.customAttributes);
    setModelDefinedMetadata(newModelTaxonomy.modelDefinedMetadata);
    setPreSelectedModelTaxonomy(newModelTaxonomy);
    closeModelTaxonomy();
  };

  React.useEffect(() => {
    if (modelMutation.result && modelMutation.result.error) {
      setError(modelMutation.result.error);
    }
  }, [modelMutation.result]);

  const getModelDetails = (values: Record<string, any>): UpdateModelDetails => {
    const displayName = trimDisplayName(values.displayName);
    const { definedMetadataList } = getModelDefinedMetadataAsList(modelDefinedMetadata);
    return {
      displayName,
      description: values.description,
      versionLabel: !values.versionLabel ? null : values.versionLabel,
      definedMetadataList: definedMetadataList as Metadata[],
      customMetadataList: modelCustomAttributes as Metadata[],
      freeformTags: values.tags ? values.tags.freeformTags : model.freeformTags,
      definedTags: values.tags ? values.tags.definedTags : model.definedTags,
    } as UpdateModelDetails;
  };

  const onSubmit = (form: Form): void => {
    const values = form.getValues();
    modelMutation.reset();
    modelMutation.invoke({
      modelId: model.id,
      updateModelDetails: getModelDetails(values),
    });
  };

  React.useEffect(() => {
    if (error) {
      ToastNotification.create({
        title: `${error.body.message}`,
        status: InfoBlockStatus.Warning,
      });
    }
  }, [error]);

  /* validation */

  const validate = (values: FormValues): FormErrors => ({
    displayName: validateField({ value: values.displayName, required: false, maxLen: 255 }),
    description: validateField({ value: values.description, required: false, maxLen: 400 }),
    versionLabel: validateField({ value: values.versionLabel, required: false, maxLen: 255 }),
  });

  const defaultValues = {
    displayName: model && model.displayName,
    description: model && model.description,
    versionLabel: model && model.versionLabel,
  };

  const onModelProvenanceSubmit = (
    modelProvenance: ModelProvenance,
    modelProvenanceTrainingResource: any
  ) => {
    setSelectedModelProvenanceTrainingResource(modelProvenanceTrainingResource);
    setSelectedModelProvenance(modelProvenance);
    closeModelProvenance();
  };

  return (
    <>
      <Form
        formRef={getFormRef}
        onSubmit={onSubmit}
        validator={validate}
        defaultValues={defaultValues}
      >
        <Panel
          actions={[
            <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"}>
              {Messages.actions.saveChanges()}
            </FormRemoteSubmitButton>,
          ]}
          onClose={onClose}
          title={Messages.models.editTitle()}
          size={PanelSize.Large}
        >
          <div className="fullscreen-two-thirds-width">
            {loading && <DialogLoader />}
            <CompartmentSelect
              disabled={true}
              value={compartmentId}
              onChange={(compartment) => setCompartmentId(compartment.id)}
              fieldName="compartmentId"
              tooltip={Messages.tooltips.compartmentSelect()}
              label={Messages.models.labels.compartment()}
              testId="model-edit-compartment-select"
            />
            <Field
              label={Messages.models.labels.name()}
              fieldName="displayName"
              tooltip={Messages.tooltips.displayName()}
            >
              <TextInput />
            </Field>
            <Field
              label={Messages.models.labels.description()}
              fieldName="description"
              optional={true}
            >
              <Textarea />
            </Field>
            {isModelStoreV3Enabled && modelReady && modelReady.modelVersionSetName && (
              <Field
                label={Messages.models.labels.versionLabel()}
                fieldName="versionLabel"
                optional={true}
                tooltip={Messages.tooltips.versionLabel()}
              >
                <TextInput />
              </Field>
            )}
            <SelectCard
              fieldName="modelProvenance"
              fieldValue={""}
              header={Messages.models.labels.documentModelProvenance()}
              label={getModelProvenanceSelectLabel()}
              buttonName={Messages.models.actions.select()}
              onButtonClick={openModelProvenance}
              optional={true}
            />
            <SelectCard
              fieldName="modelTaxonomy"
              fieldValue={""}
              header={Messages.models.labels.modelTaxonomy()}
              label={Messages.models.labels.modelTaxonomyDescription()}
              buttonName={Messages.models.actions.select()}
              onButtonClick={openModelTaxonomy}
              optional={true}
              selections={getModelTaxonomySelectSelections()}
            />
            {model && <ModelAdvancedOptions model={model} compartmentId={compartmentId} />}
          </div>
        </Panel>
      </Form>
      {isModelProvenanceOpen && (
        <ModelProvenancePanel
          activeProjectId={model && model.projectId}
          preselectedModelProvenanceTrainingResource={selectedModelProvenanceTrainingResource}
          preselectedModelProvenanceCardType={preselectedModelProvenanceCardType}
          onClose={closeModelProvenance}
          preselectedModelProvenance={selectedModelProvenance}
          onModelProvenanceSubmit={onModelProvenanceSubmit}
        />
      )}
      {isModelTaxonomyOpen && (
        <ModelTaxonomyPanel
          onClose={closeModelTaxonomy}
          preSelectedModelTaxonomy={preSelectedModelTaxonomy}
          onModelTaxonomySubmit={onModelTaxonomySubmit}
        />
      )}
    </>
  );
};

export default ModelEditPanel;
