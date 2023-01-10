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
  useWhitelist,
} from "oui-savant";
import apiClients from "apiClients";
import {
  ErrorText,
  Field,
  Form,
  FormErrors,
  FormRef,
  FormValues,
  InfoBlockStatus,
  ProgressBar,
  Textarea,
  TextInput,
  ToastNotification,
} from "oui-react";
import { useModalState } from "../../hooks/useModalState";
import DialogLoader from "components/DialogLoader/DialogLoader";
import {
  CreateModelDetails,
  Model,
  Metadata,
  ModelProvenance,
  CreateModelVersionSetDetails,
  ModelVersionSet,
} from "odsc-client/dist/odsc-client";
import { trimDisplayName, validateField } from "utils/formUtils";
import { getRouteClient } from "loom-plugin-runtime";
import { ResourceNames } from "constants/resourceNames";
import { useDispatch } from "redux-react-hook";
import { push } from "connected-react-router";
import {
  CustomAttribute,
  ModelDefinedMetadata,
  ModelTaxonomy,
  ModelTaxonomyPanel,
} from "../ModelTaxonomyPanel/ModelTaxonomyPanel";
import { ModelAdvancedOptions } from "../../components/ModelAdvancedOptions/ModelAdvancedOptions";
import { getModelDefinedMetadataAsList } from "../../utils/modelTaxonomyUtils";
import { ArtifactError, UploadRequest } from "../../models/ArtifactModels";
import { normalizeError } from "oui-react/dist/utils/error";
import { BackendResourceNames } from "../../constants/backendResourceNames";
import "./ModelCreatePanel.less";
import {
  ModelProvenancePanel,
  SelectModelProvenanceOptions,
} from "../ModelProvenancePanel/ModelProvenancePanel";
import { ModelArtifactPanel } from "../ModelArtifactPanel/ModelArtifactPanel";
import { CustomDataScienceApi } from "../../models/customApiClients";
import SelectCard from "../../components/SelectCard/SelectCard";
import { getOverrideEndpoint } from "../../utils/EndpointUtil";
import { SchemaFiles } from "../../constants/modelSchema";
import { ModelSchemaDefinitionPanel } from "../ModelSchemaDefinitionPanel/ModelSchemaDefinitionPanel";
import ModelConfigureVersionSetPanel from "../ModelConfigureVersionSetPanel/ModelConfigureVersionSetPanel";
import { MODEL_STORE_V3_ENABLED_WHITELIST } from "../../pluginConstants";
import { CompareVersion } from "../../constants/modelVersioning";
import { getLabelForValue } from "../../constants/modelTaxonomy";

interface Props {
  onClose: () => void;
  projectId: string;
}

const ModelCreatePanel: React.FC<Props> = ({ onClose, projectId }) => {
  const [isModelStoreV3Enabled] = useWhitelist(MODEL_STORE_V3_ENABLED_WHITELIST);
  const [modelCustomAttributes, setModelCustomAttributes] = React.useState<CustomAttribute[]>([]);
  const [modelDefinedMetadata, setModelDefinedMetadata] =
    React.useState<ModelDefinedMetadata>(undefined);
  const [preSelectedModelTaxonomy, setPreSelectedModelTaxonomy] = React.useState<ModelTaxonomy>({
    modelDefinedMetadata: {},
    customAttributes: [],
  });
  const [isModelTaxonomyOpen, openModelTaxonomy, closeModelTaxonomy] = useModalState();
  const { activeCompartment } = useConsoleState();
  const [compartmentId, setCompartmentId] = React.useState(
    activeCompartment ? activeCompartment.id : undefined
  );
  const [preSelectedSchemaFiles, setPreSelectedSchemaFiles] =
    React.useState<SchemaFiles>(undefined);
  const [isProvenanceMutationComplete, setProvenanceMutationComplete] = React.useState(false);

  const [isModelProvenanceOpen, openModelProvenance, closeModelProvenance] = useModalState();
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [error, setError] = React.useState<NormalError>(undefined);
  const { compartments } = useConsoleState();
  const [preselectedModelProvenanceCardType, setPreselectedModelProvenanceCardType] =
    React.useState(SelectModelProvenanceOptions.SelectByNotebookSession);
  const [selectedModelProvenanceTrainingResource, setSelectedModelProvenanceTrainingResource] =
    React.useState<any>(undefined);
  const [selectedModelProvenance, setSelectedModelProvenance] = React.useState<ModelProvenance>({});

  const [isArtifactOpen, openArtifact, closeArtifact] = useModalState();
  const [isModelVersionSetOpen, openModelVersionSet, closeModelVersionSet] = useModalState();
  const [isModelVersionSetComplete, setModelVersionSetComplete] = React.useState(false);
  const [modelArtifactUpload, setModelArtifactUpload] = React.useState<File>(undefined);
  const [isUploadArtifact, setIsUploadArtifact] = React.useState(false);

  const customDataScienceApi = new CustomDataScienceApi(getOverrideEndpoint());

  const [uploadInProgress, setUploadInProgress] = React.useState(false);
  const [currentUploadProgress, setCurrentUploadProgress] = React.useState(0);

  let isUploadArtifactCompleted = false;
  let isUploadArtifactError = false;
  let modelId = undefined;
  const [isMVSAssociationStarted, setIsMVSAssociationStarted] = React.useState(false);
  const [isModelSchemaOpen, openModelSchema, closeModelSchema] = useModalState();
  const [modelInputSchemaUpload, setModelInputSchemaUpload] = React.useState<string | ArrayBuffer>(
    undefined
  );
  const [modelVersionSetId, setModelVersionSetId] = React.useState(undefined);
  const [isCreateNewModelVersionSet, setIsCreateNewModelVersionSet] = React.useState(false);
  const [createModelVersionSetDetails, setCreateModelVersionSetDetails] =
    React.useState<CreateModelVersionSetDetails>(undefined);
  const [selectedModelIdsToAddModelVersionSet, setSelectedModelIdsToAddModelVersionSet] =
    React.useState([]);

  const [labelList, setLabelList] = React.useState<Map<string, string>>(
    () => new Map<string, string>()
  );
  const [modelVersionLabel, setModelVersionLabel] = React.useState(undefined);
  const [mvsName, setMVSName] = React.useState(undefined);
  const [modelOutputSchemaUpload, setModelOutputSchemaUpload] = React.useState<
    string | ArrayBuffer
  >(undefined);
  const [selectedInputSchemaFile, setSelectedInputSchemaFile] = React.useState(undefined);
  const [selectedOutputSchemaFile, setSelectedOutputSchemaFile] = React.useState(undefined);
  const [modelListForAssociation, setModelListForAssociation] = React.useState<Map<string, string>>(
    () => new Map<string, string>()
  );
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  /* Create Model */

  const dispatch = useDispatch();

  const modelVersionSetMutation = useMutation({
    method: apiClients.odscApi.createModelVersionSet,
    onSuccess: (result) => {
      const modelVersionSet: ModelVersionSet = result.response.data;
      if (!result.error) {
        callMoveModeltoVersionSetMutation(modelVersionSet.id);
      }
    },
  });

  const callCreateModelVersionSet = async (): Promise<void> => {
    if (isCreateNewModelVersionSet) {
      modelVersionSetMutation.reset();
      await modelVersionSetMutation.invoke({
        createModelVersionSetDetails,
      });
    }
  };

  const moveModeltoVersionSetMutation = useMutation({
    method: apiClients.odscApi.updateModel,
    onSuccess: (results) => {
      if (isModelVersionSetComplete) {
        ToastNotification.create({
          title: `${Messages.models.createModelVersionSetSuccessMessage()}`,
          status: InfoBlockStatus.Success,
        });
        const model: Model = modelMutation.result.response.data;
        const url = getRouteClient().makePluginUrl(`/${ResourceNames.models}/${model.id}`);
        if (isModelVersionSetComplete) dispatch(push(url));
      }
      callMoveModeltoVersionSetMutation(results.response.data.modelVersionSetId);
    },
  });

  const callMoveModeltoVersionSetMutation = (modelVersionSetId: string) => {
    setIsMVSAssociationStarted(true);
    if (selectedModelIdsToAddModelVersionSet.length > 0) {
      modelId = selectedModelIdsToAddModelVersionSet.pop();
      moveModeltoVersionSetMutation.invoke({
        modelId,
        updateModelDetails: {
          modelVersionSetId,
          versionLabel: getLabelFromId(modelId),
        },
      });
    } else if (selectedModelIdsToAddModelVersionSet.length === 0 && !isModelVersionSetComplete) {
      moveModeltoVersionSetMutation.invoke({
        modelId: modelMutation.result.response.data.id,
        updateModelDetails: {
          modelVersionSetId,
          versionLabel: modelVersionLabel,
        },
      });
      setModelVersionSetComplete(true);
    }
  };

  const modelMutation = useMutation({
    method: apiClients.odscApi.createModel,
    onSuccess: (result) => {
      const model: Model = result.response.data;
      if (!result.error) {
        callCreateProvenance(model.id);
      }
    },
  });

  const loading = modelMutation.result && modelMutation.result.loading;
  const showLoadingTillArtifactUpload =
    modelArtifactUpload && isUploadArtifact && !isUploadArtifactCompleted;

  React.useEffect(() => {
    if (modelMutation.result) {
      if (modelMutation.result.error) {
        setError(modelMutation.result.error);
      } else if (
        modelMutation.result.response &&
        isProvenanceMutationComplete &&
        !uploadInProgress
      ) {
        if (modelVersionSetMutation.result) {
          if (modelVersionSetMutation.result.error || moveModeltoVersionSetMutation.result.error) {
            setError(
              modelVersionSetMutation.result.error
                ? modelVersionSetMutation.result.error
                : moveModeltoVersionSetMutation.result.error
            );
            const modelName =
              modelListForAssociation &&
              modelListForAssociation.size !== 0 &&
              Array.from(modelListForAssociation.values())[0];
            ToastNotification.create({
              title: `${
                modelListForAssociation.size > 1
                  ? Messages.modelVersionSets.error.mvsModelsAssociationError(
                      modelName,
                      modelName,
                      Array.from(modelListForAssociation.values())[modelListForAssociation.size - 1]
                    )
                  : Messages.modelVersionSets.error.mvsModelAssociationError(modelName)
              }`,
              status: InfoBlockStatus.Critical,
            });
            const url = getRouteClient().makePluginUrl(
              `/${ResourceNames.models}/${modelMutation.result.response.data.id}`
            );
            dispatch(push(url));
          }
        }
      }
    }
  }, [
    modelMutation.result,
    modelVersionSetMutation.result,
    moveModeltoVersionSetMutation.result,
    isProvenanceMutationComplete,
    uploadInProgress,
  ]);

  const callCreateProvenance = async (modelId: string): Promise<any> => {
    // to show single loading till artifact uploaded
    if (modelArtifactUpload) {
      setIsUploadArtifact(true);
    }
    const values = selectedModelProvenance;
    if (values === undefined) {
      await provenanceMutation.invoke({
        modelId,
        createModelProvenanceDetails: {},
      });
    } else {
      await provenanceMutation.invoke({
        modelId,
        createModelProvenanceDetails: {
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

  const provenanceMutation = useMutation({
    method: apiClients.odscApi.createModelProvenance,
    onSuccess: () => {
      setProvenanceMutationComplete(true);
      if (isModelStoreV3Enabled) {
        callCreateModelVersionSet();
      }
      if (modelArtifactUpload) {
        const url = getRouteClient().makePluginUrl(
          `/${ResourceNames.models}/${modelMutation.result.response.data.id}`
        );
        callUploadModelArtifact(modelMutation.result.response.data.id).then(() => {
          ToastNotification.create({
            title: `${Messages.models.createModelSuccessMessage()}`,
            status: InfoBlockStatus.Success,
          });
          if (isUploadArtifactCompleted) {
            ToastNotification.create({
              title: `${Messages.uploadModelArtifact.uploadSuccessNotification()}`,
              status: InfoBlockStatus.Success,
            });
            if (!isCreateNewModelVersionSet) {
              dispatch(push(url));
            }
          } else if (isUploadArtifactError) {
            ToastNotification.create({
              title: `${Messages.uploadModelArtifact.uploadFailureNotification()}`,
              status: InfoBlockStatus.Critical,
            });
            dispatch(push(url));
          }
        });
      }
    },
  });

  React.useEffect(() => {
    if (provenanceMutation.result) {
      if (provenanceMutation.result.error) {
        const modelId =
          modelMutation.result &&
          modelMutation.result.response &&
          modelMutation.result.response.data &&
          modelMutation.result.response.data.id;
        setError(provenanceMutation.result.error);
        const url = getRouteClient().makePluginUrl(`/${ResourceNames.models}/${modelId}`);
        dispatch(push(url));
      }
    }
  }, [provenanceMutation.result, modelMutation.result]);

  React.useEffect(() => {
    if (error) {
      ToastNotification.create({
        title: `${error.body.message}`,
        status: InfoBlockStatus.Critical,
      });
    }
  }, [error]);

  const callUploadModelArtifact = async (modelId: string): Promise<any> => {
    return uploadFileListener(modelId, BackendResourceNames.models, modelArtifactUpload);
  };

  const uploadFileListener = async (id: string, type: string, file: File): Promise<void> => {
    const request: UploadRequest = {
      id,
      type,
      file,
      progressCallBack,
      onErrorCallBack,
      successCallBack,
    };

    return await singleUpload(request);
  };

  const singleUpload = async (request: UploadRequest): Promise<void> => {
    const { onErrorCallBack, progressCallBack, successCallBack } = request;
    setUploadInProgress(true);
    progressCallBack(0);
    try {
      await customDataScienceApi.createArtifact(request);
      successCallBack();
    } catch (error) {
      const errorMessage = await normalizeError(error);
      // Call Error Call Back!
      onErrorCallBack({ errorMessage });
    }
  };

  const onErrorCallBack = (errors: ArtifactError): void => {
    setUploadInProgress(false);
    setError(errors.errorMessage);
    isUploadArtifactError = true;
  };

  const successCallBack = (): void => {
    setUploadInProgress(false);
    isUploadArtifactCompleted = true;
  };

  const progressCallBack = (uploadedBytes: number): void => {
    if (modelArtifactUpload.size === 0) {
      isUploadArtifactCompleted = true;
      return;
    }
    const currentUploadProgress = Math.round((uploadedBytes / modelArtifactUpload.size) * 100);
    setCurrentUploadProgress(currentUploadProgress);
  };

  const onSubmit = (form: Form): void => {
    const createModelDetails = form.getValues();
    const { definedMetadataList } = getModelDefinedMetadataAsList(modelDefinedMetadata);
    modelMutation.reset();
    modelMutation.invoke({
      createModelDetails: {
        projectId,
        compartmentId: createModelDetails.compartmentId,
        displayName: trimDisplayName(createModelDetails.displayName),
        description: createModelDetails.description,
        definedMetadataList: definedMetadataList as Metadata[],
        customMetadataList: modelCustomAttributes as Metadata[],
        freeformTags: createModelDetails.tags && createModelDetails.tags.freeformTags,
        definedTags: createModelDetails.tags && createModelDetails.tags.definedTags,
        inputSchema: modelInputSchemaUpload,
        outputSchema: modelOutputSchemaUpload,
        modelVersionSetId: !isCreateNewModelVersionSet ? modelVersionSetId : null,
        versionLabel: !isCreateNewModelVersionSet ? modelVersionLabel : null,
      } as CreateModelDetails,
    });
  };

  const onArtifactDataSubmit = (selectedArtifact: File) => {
    setModelArtifactUpload(selectedArtifact);
    closeArtifact();
  };

  /* validation */

  const validate = (values: FormValues): FormErrors => ({
    displayName: validateField({ value: values.displayName, required: false, maxLen: 255 }),
    description: validateField({ value: values.description, required: false, maxLen: 400 }),
    artifact: validateField({ value: modelArtifactUpload, required: true }),
  });

  const getModelArtifactSelections = () => {
    const modelArtifactmap: Map<string, string> = new Map<string, string>();
    if (modelArtifactUpload) {
      modelArtifactmap.set(
        Messages.models.selectPanes.artifactSelect.labels.selectedArtifact(),
        modelArtifactUpload.name
      );
    }
    return modelArtifactmap;
  };

  const getModelProvenanceSelections = () => {
    const modelProvenanceMap: Map<string, string> = new Map<string, string>();
    if (selectedModelProvenanceTrainingResource && selectedModelProvenanceTrainingResource.id) {
      const compartment = compartments.find(
        (compartment) => compartment.id === selectedModelProvenanceTrainingResource.compartmentId
      );
      const compartmentNameValue = compartment ? compartment.name : compartmentId;
      modelProvenanceMap.set(
        Messages.models.resources.modelProvenance.resource(),
        selectedModelProvenanceTrainingResource.displayName
      );
      modelProvenanceMap.set(
        Messages.models.resources.modelProvenance.compartment(),
        compartmentNameValue
      );
    }
    if (selectedModelProvenance) {
      if (!!selectedModelProvenance.repositoryUrl) {
        modelProvenanceMap.set(
          Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.repositoryUrl(),
          selectedModelProvenance.repositoryUrl
        );
      }
      if (!!selectedModelProvenance.gitCommit) {
        modelProvenanceMap.set(
          Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.gitCommit(),
          selectedModelProvenance.gitCommit
        );
      }
      if (!!selectedModelProvenance.gitBranch) {
        modelProvenanceMap.set(
          Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.gitBranch(),
          selectedModelProvenance.gitBranch
        );
      }
      if (!!selectedModelProvenance.scriptDir) {
        modelProvenanceMap.set(
          Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.scriptDir(),
          selectedModelProvenance.scriptDir
        );
      }
      if (!!selectedModelProvenance.trainingScript) {
        modelProvenanceMap.set(
          Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.trainingScript(),
          selectedModelProvenance.trainingScript
        );
      }
    }
    return modelProvenanceMap;
  };

  const getModelVersionSetSelections = () => {
    const modelVersionSetMap: Map<string, string> = new Map<string, string>();
    if (modelVersionSetId || isCreateNewModelVersionSet) {
      modelVersionSetMap.set(Messages.models.labels.modelVersionSet(), mvsName);
      modelVersionSetMap.set(Messages.models.labels.versionLabel(), modelVersionLabel);
    }
    return modelVersionSetMap;
  };

  const getModelTaxonomySelections = () => {
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

  const getModelSchemaSelections = () => {
    const modelSchemaMap: Map<string, string> = new Map<string, string>();
    if (selectedInputSchemaFile) {
      modelSchemaMap.set(
        Messages.models.selectPanes.modelSchemaSelect.labels.inputSchema(),
        selectedInputSchemaFile.name
      );
    }
    if (selectedOutputSchemaFile) {
      modelSchemaMap.set(
        Messages.models.selectPanes.modelSchemaSelect.labels.outputSchema(),
        selectedOutputSchemaFile.name
      );
    }
    return modelSchemaMap;
  };

  const getLabelFromId = (modelId: string): string => {
    return labelList.get(modelId);
  };

  const onModelProvenanceSubmit = (
    modelProvenance: ModelProvenance,
    modelProvenanceTrainingResource: any
  ) => {
    setSelectedModelProvenanceTrainingResource(modelProvenanceTrainingResource);
    setSelectedModelProvenance(modelProvenance);
    !!modelProvenanceTrainingResource &&
    !!modelProvenanceTrainingResource.id &&
    modelProvenanceTrainingResource.id.includes(CompareVersion.datasciencejobrun)
      ? setPreselectedModelProvenanceCardType(SelectModelProvenanceOptions.SelectByJobRun)
      : setPreselectedModelProvenanceCardType(SelectModelProvenanceOptions.SelectByNotebookSession);
    closeModelProvenance();
  };

  const onModelVersionSetSubmit = (
    isNewModelVersionSet: boolean,
    selectedModelIds: [],
    modelVersionSetDetails: CreateModelVersionSetDetails,
    modelVersionSetId: string,
    modelsForAssociation: Map<string, string>,
    labelList: Map<string, string>,
    label: string,
    mvsName: string
  ) => {
    setIsCreateNewModelVersionSet(isNewModelVersionSet);
    if (isNewModelVersionSet) {
      setModelVersionSetId(null);
      setCreateModelVersionSetDetails(modelVersionSetDetails);
      setSelectedModelIdsToAddModelVersionSet(selectedModelIds);
      setLabelList(labelList);
    } else {
      setCreateModelVersionSetDetails(null);
      setModelListForAssociation(modelsForAssociation);
      setModelVersionSetId(modelVersionSetId);
    }
    setModelVersionLabel(label);
    if (!!mvsName) {
      setMVSName(mvsName);
    }
    closeModelVersionSet();
  };

  const onModelTaxonomySubmit = (modelTaxonomy: ModelTaxonomy) => {
    setModelCustomAttributes(modelTaxonomy.customAttributes);
    setModelDefinedMetadata(modelTaxonomy.modelDefinedMetadata);
    setPreSelectedModelTaxonomy(modelTaxonomy);
    closeModelTaxonomy();
  };
  const onModelSchemaSubmit = (selectedSchemaFiles: SchemaFiles) => {
    setPreSelectedSchemaFiles(selectedSchemaFiles);
    setModelInputSchemaUpload(selectedSchemaFiles.modelSchemaInputText);
    setModelOutputSchemaUpload(selectedSchemaFiles.modelSchemaOutputText);
    setSelectedInputSchemaFile(selectedSchemaFiles.selectedInputSchemaFile);
    setSelectedOutputSchemaFile(selectedSchemaFiles.selectedOutputSchemaFile);
    closeModelSchema();
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
          title={Messages.models.createTitle()}
          size={PanelSize.Large}
        >
          <div className="fullscreen-two-thirds-width">
            {loading && <DialogLoader />}
            {showLoadingTillArtifactUpload &&
              (!isMVSAssociationStarted ? (
                <DialogLoader />
              ) : (
                <DialogLoader message={Messages.modelVersionSets.actions.loading()} />
              ))}
            <CompartmentSelect
              value={compartmentId}
              onChange={(compartment) => setCompartmentId(compartment.id)}
              fieldName="compartmentId"
              tooltip={Messages.tooltips.compartmentSelect()}
              label={Messages.models.labels.compartment()}
            />
            <Field
              label={Messages.models.labels.name()}
              fieldName="displayName"
              tooltip={Messages.tooltips.displayName()}
              optional={true}
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
            <SelectCard
              fieldName="artifact"
              fieldValue={modelArtifactUpload && modelArtifactUpload.name}
              header={Messages.models.modelArtifactTitle()}
              label={Messages.models.labels.artifactDescription()}
              buttonName={Messages.models.actions.select()}
              onButtonClick={openArtifact}
              selections={getModelArtifactSelections()}
            />
            {isModelStoreV3Enabled && (
              <SelectCard
                fieldName="modelVersionSet"
                fieldValue={""}
                header={Messages.models.labels.modelVersionSet()}
                label={Messages.models.labels.modelVersionSetSelect()}
                buttonName={Messages.models.actions.select()}
                onButtonClick={openModelVersionSet}
                optional={true}
                selections={getModelVersionSetSelections()}
              />
            )}
            <SelectCard
              fieldName="modelProvenance"
              fieldValue={""}
              header={Messages.models.labels.modelProvenance()}
              label={Messages.models.labels.modelProvenanceSelect()}
              buttonName={Messages.models.actions.select()}
              onButtonClick={openModelProvenance}
              optional={true}
              selections={getModelProvenanceSelections()}
            />
            <SelectCard
              fieldName="modelTaxonomy"
              fieldValue={""}
              header={Messages.models.labels.modelTaxonomy()}
              label={Messages.models.labels.modelTaxonomyDescription()}
              buttonName={Messages.models.actions.select()}
              onButtonClick={openModelTaxonomy}
              optional={true}
              selections={getModelTaxonomySelections()}
            />
            <SelectCard
              fieldName="modelSchema"
              fieldValue={""}
              header={Messages.models.selectPanes.modelSchemaSelect.title()}
              label={Messages.models.labels.modelSchemaDescription()}
              buttonName={Messages.models.actions.select()}
              onButtonClick={openModelSchema}
              optional={true}
              selections={getModelSchemaSelections()}
            />
            <ModelAdvancedOptions compartmentId={compartmentId} />
            {modelMutation.result && modelMutation.result.error && (
              <ErrorText>{modelMutation.result.error.body.message}</ErrorText>
            )}
          </div>
          <div className="artifact-progress-bar">
            {uploadInProgress && (
              <ProgressBar
                value={currentUploadProgress}
                progressLabel={Messages.upload.progressMsgText(currentUploadProgress)}
              />
            )}
          </div>
        </Panel>
      </Form>
      {isArtifactOpen && (
        <ModelArtifactPanel
          onClose={closeArtifact}
          onArtifactDataSubmit={onArtifactDataSubmit}
          preSelectedArtifact={modelArtifactUpload}
        />
      )}
      {isModelVersionSetOpen && (
        <ModelConfigureVersionSetPanel
          onClose={closeModelVersionSet}
          onModelVersionSetSubmit={onModelVersionSetSubmit}
          preSelectedCompartmentId={
            !(createModelVersionSetDetails && createModelVersionSetDetails.compartmentId)
              ? activeCompartment
                ? activeCompartment.id
                : undefined
              : createModelVersionSetDetails.compartmentId
          }
          preSelectedProjectId={
            !!!(createModelVersionSetDetails && createModelVersionSetDetails.projectId)
              ? projectId
              : createModelVersionSetDetails.projectId
          }
          preSelectedIsNewModelVersionSet={isCreateNewModelVersionSet}
          preSelectedModelIds={selectedModelIdsToAddModelVersionSet}
          preSelectedModelVersionSetDetails={createModelVersionSetDetails}
          preSelectedModelVersionSetId={modelVersionSetId}
          preLabelList={labelList}
          preLabelText={modelVersionLabel}
        />
      )}
      {isModelTaxonomyOpen && (
        <ModelTaxonomyPanel
          onClose={closeModelTaxonomy}
          preSelectedModelTaxonomy={preSelectedModelTaxonomy}
          onModelTaxonomySubmit={onModelTaxonomySubmit}
        />
      )}
      {isModelSchemaOpen && (
        <ModelSchemaDefinitionPanel
          onClose={closeModelSchema}
          preSelectedSchema={preSelectedSchemaFiles}
          onModelSchemaSubmit={onModelSchemaSubmit}
        />
      )}
      {isModelProvenanceOpen && (
        <ModelProvenancePanel
          activeProjectId={projectId}
          preselectedModelProvenanceTrainingResource={selectedModelProvenanceTrainingResource}
          preselectedModelProvenanceCardType={preselectedModelProvenanceCardType}
          onClose={closeModelProvenance}
          preselectedModelProvenance={selectedModelProvenance}
          onModelProvenanceSubmit={onModelProvenanceSubmit}
        />
      )}
    </>
  );
};

export default ModelCreatePanel;
