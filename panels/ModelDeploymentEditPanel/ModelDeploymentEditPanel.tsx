import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import {
  CompartmentSelect,
  FormRemoteSubmitButton,
  NormalError,
  Panel,
  PanelSize,
  QueryResult,
  useConsoleState,
  useMutation,
  useQuery,
  useWhitelist,
} from "oui-savant";
import apiClients from "apiClients";
import {
  Field,
  FieldSet,
  Form,
  FormErrors,
  FormRef,
  FormValues,
  InfoBlockStatus,
  NumberInput,
  Textarea,
  TextInput,
  ToastNotification,
} from "oui-react";
import { useModalState } from "../../hooks/useModalState";
import DialogLoader from "components/DialogLoader/DialogLoader";
import {
  CategoryLogDetails,
  Model,
  ModelDeployment,
  ModelDeploymentInstanceShapeConfigDetails,
  OcirModelDeploymentEnvironmentConfigurationDetails,
} from "odsc-client/dist/odsc-client";
import {
  Compute,
  isValidBandwidthMbps,
  isValidCompute,
  isValidModelOcid,
  isValidNumberOfInstances,
  validateField,
} from "utils/formUtils";
import ModelDeploymentSelectModelPanel from "../ModelDeploymentSelectModelPanel/ModelDeploymentSelectModelPanel";
import SelectCard from "components/SelectCard/SelectCard";
import { objectEquals } from "utils/dataUtils";
import { ModelDeploymentAdvancedOptions } from "components/ModelDeploymentAdvancedOptions/ModelDeploymentAdvancedOptions";
import {
  createModelDeploymentShapeSeriesToShapes,
  getInstanceCount,
  getInstanceShapeConfig,
  getInstanceShapeName,
  getInstanceShapeSeriesToShow,
  getLogSelectLabel,
  getModelId,
  getUpdateModelDeploymentDetails,
  getCustomOcirModelDeploymentEnvironmentConfigurationDetails,
  ModelDeploymentShapeSeriesToModelDeploymentShapeSummary,
  ModelDeploymentShapeSeriesToShowEnum,
} from "utils/modelDeploymentUtils";
import ModelDeploymentComputePanel, {
  NUMBEROFINST_MAX,
  NUMBEROFINST_MIN,
} from "../ModelDeploymentComputePanel/ModelDeploymentComputePanel";
import { ModelDeploymentLoggingPanel } from "../ModelDeploymentLoggingPanel/ModelDeploymentLoggingPanel";
import {
  MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST,
  MODEL_DEPLOY_BYOC_WHITELIST,
  MODEL_DEPLOY_FLEX_SHAPE_SUPPORT_WHITELIST,
} from "../../pluginConstants";
import {
  BANDWIDTH_FIELD,
  COMPUTE_FIELD,
  COMPARTMENT_ID_FIELD,
  DISPLAY_NAME_FIELD,
  DESCRIPTION_FIELD,
  INSTANCE_COUNT_FIELD,
  LOGGING_FIELD,
  MODEL_OCID_FIELD,
} from "constants/form";
import {
  CONTAINER_CMD,
  CONTAINER_ENTRYPOINT,
  HEALTHCHECK_PORT,
  IMAGE_FIELD_NAME,
  SERVER_PORT,
} from "constants/modelDeployments";
import { DefaultModelDeployConfigDetails } from "components/DefaultModelDeployConfigDetails/DefaultModelDeployConfigDetails";
import { Shape } from "coreservices-api-client";
import { NotebookUtils } from "notebooks/utils/NotebookUtils";
import { ComputeSelectPanel } from "shared/panels/ComputeSelectPanel/ComputeSelectPanel";
import { getDefaultComputeWhitelists } from "utils/shapeUtils";
import {
  ShapeContextProvider,
  ShapePickerSummaryCard,
  CreateFormType,
  isFlexShape,
} from "compute-console-breeze";

interface Props {
  onClose: () => void;
  modelDeploymentId: string;
  refresh: () => void;
}

const ModelDeploymentEditPanel: React.FC<Props> = ({ onClose, refresh, modelDeploymentId }) => {
  const fieldErrors: FormErrors = {};
  const [modelDeployment, setModelDeployment] = React.useState<ModelDeployment>(undefined);
  const [selectedModel, setSelectedModel] = React.useState<Model>(undefined);
  const [instanceCount, setInstanceCount] = React.useState<number>(1);
  const [vmShapeName, setVmShapeName] = React.useState<string>(undefined);
  const [vmShapeType, setVmShapeType] =
    React.useState<ModelDeploymentShapeSeriesToShowEnum>(undefined);
  const [selectedComputeShape, setSelectedComputeShape] = React.useState<Shape>(null);
  const [shapes, setShapes] = React.useState<Shape[]>(undefined);
  const [computeShapesQueryResult, setComputeShapesQueryResult] =
    React.useState<QueryResult<Shape[]>>(undefined);

  const [computeLoading, setComputeLoading] = React.useState<boolean>(true);
  const [computeErrorText, setComputeErrorText] = React.useState<string>(undefined);
  const [modelDeploymentShapeConfigurationDetails, setModelDeploymentShapeConfigurationDetails] =
    React.useState<ModelDeploymentInstanceShapeConfigDetails>(null);

  const [modelDeploymentShapeSeriesToShapesMap, setModelDeploymentShapeSeriesToShapesMap] =
    React.useState<ModelDeploymentShapeSeriesToModelDeploymentShapeSummary>(null);

  const [
    customOcirModelDeploymentEnvironmentConfigurationDetails,
    setCustomOcirModelDeploymentEnvironmentConfigurationDetails,
  ] = React.useState<OcirModelDeploymentEnvironmentConfigurationDetails>(null);

  const [isModelDeployFlexShapeSupportEnabled] = useWhitelist(
    MODEL_DEPLOY_FLEX_SHAPE_SUPPORT_WHITELIST
  );

  const [logDetails, setLogDetails] = React.useState<CategoryLogDetails>(undefined);
  const [isModelSelectDisabled, setIsModelSelectDisabled] = React.useState(true);
  const [isComputeSelectDisabled, setIsComputeSelectDisabled] = React.useState(true);
  const [isSelectModelOpen, openSelectModel, closeSelectModel] = useModalState();
  const [isComputeOpen, openCompute, closeCompute] = useModalState();
  const [isLoggingOpen, openLogging, closeLogging] = useModalState();
  const [logSelectLabel, setLogSelectLabel] = React.useState(
    Messages.modelDeployments.labels.loggingSelect()
  );
  const { activeCompartment, capabilities } = useConsoleState();
  const [compartmentId, setCompartmentId] = React.useState(
    activeCompartment ? activeCompartment.id : undefined
  );
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [error, setError] = React.useState<NormalError>(undefined);

  const [isModelDeployBYOCEnabled] = useWhitelist(MODEL_DEPLOY_BYOC_WHITELIST);
  const [isModelDeployBreezeEnabled] = useWhitelist(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST);

  const whitelist = getDefaultComputeWhitelists(false);

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const modelDeploymentQuery = useQuery({
    method: apiClients.odscApi.getModelDeployment,
    options: {
      args: { modelDeploymentId },
    },
  });

  React.useEffect(() => {
    const newModelDeployment =
      modelDeploymentQuery && !modelDeploymentQuery.error && !modelDeploymentQuery.loading
        ? modelDeploymentQuery.response.data
        : undefined;

    if (!objectEquals(modelDeployment, newModelDeployment)) {
      setModelDeployment(newModelDeployment);
      if (!!newModelDeployment) {
        setInstanceCount(getInstanceCount(newModelDeployment));
        const vmInstanceShapeName = getInstanceShapeName(newModelDeployment);
        setVmShapeName(vmInstanceShapeName);
        setVmShapeType(getInstanceShapeSeriesToShow(vmInstanceShapeName));
        setModelDeploymentShapeConfigurationDetails(getInstanceShapeConfig(newModelDeployment));
        setLogDetails(newModelDeployment.categoryLogDetails);
        setLogSelectLabel(getLogSelectLabel(newModelDeployment.categoryLogDetails));
        setIsModelSelectDisabled(
          newModelDeployment.deploymentMode === "STREAM_ONLY" &&
            newModelDeployment.lifecycleState === "ACTIVE"
        );
        setIsComputeSelectDisabled(
          (newModelDeployment.deploymentMode === "STREAM_ONLY" &&
            newModelDeployment.lifecycleState === "ACTIVE") ||
            (isModelDeployFlexShapeSupportEnabled === false && isFlexShape(vmInstanceShapeName))
        );
        setCustomOcirModelDeploymentEnvironmentConfigurationDetails(
          getCustomOcirModelDeploymentEnvironmentConfigurationDetails(newModelDeployment)
        );
      }
    }
    if (modelDeploymentQuery && modelDeploymentQuery.error) {
      setError(modelDeploymentQuery.error);
    }
    if (newModelDeployment) {
      setCompartmentId(newModelDeployment.compartmentId);
    }
  }, [modelDeploymentQuery]);

  const modelQuery = useQuery({
    wait: !modelDeployment,
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId: getModelId(modelDeployment) },
    },
  });

  const modelDeploymentShapeQuery = useQuery({
    method: apiClients.odscApi.listModelDeploymentShapes,
    options: {
      args: {
        compartmentId,
      },
    },
  });

  const mdShapesListQueryReady =
    modelDeploymentShapeQuery &&
    !modelDeploymentShapeQuery.error &&
    modelDeploymentShapeQuery.response &&
    modelDeploymentShapeQuery.response.data;

  const computeShapesListQuery =
    isModelDeployBreezeEnabled &&
    useQuery({
      wait: !compartmentId,
      method: apiClients.computeApi.listShapes,
      options: {
        args: {
          compartmentId,
        },
        fetchAllPages: true,
      },
    });

  const computeShapesListQueryReady =
    computeShapesListQuery &&
    !computeShapesListQuery.error &&
    computeShapesListQuery.response &&
    computeShapesListQuery.response.data;

  React.useEffect(() => {
    const model =
      modelQuery && !modelQuery.error && !modelQuery.loading ? modelQuery.response.data : undefined;
    if (modelQuery && modelQuery.error) {
      setError(modelQuery.error);
    }
    if (!selectedModel) {
      setSelectedModel(model);
    }
  }, [modelQuery]);

  React.useEffect(() => {
    const computeQuery: QueryResult<Shape[]> = NotebookUtils.getComputeShapesQuery(
      modelDeploymentShapeQuery,
      computeShapesListQuery
    );
    setSelectedComputeShape(computeQuery?.response?.data[0]);
    setComputeShapesQueryResult(computeQuery);
    setShapes(computeQuery?.response?.data);
  }, [mdShapesListQueryReady, computeShapesListQueryReady]);

  React.useEffect(() => {
    ref?.setValue(COMPUTE_FIELD, selectedComputeShape?.shape);
  }, [selectedComputeShape]);

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.updateModelDeployment,
    onSuccess: () => {
      refresh();
      onClose();
    },
  });

  React.useEffect(() => {
    setComputeLoading(modelDeploymentShapeQuery.loading);
    const newShapes =
      modelDeploymentShapeQuery &&
      !modelDeploymentShapeQuery.error &&
      !modelDeploymentShapeQuery.loading
        ? modelDeploymentShapeQuery.response.data
        : [];

    if (modelDeploymentShapeQuery.error) {
      setComputeErrorText(Messages.errors.generic());
    } else if (
      newShapes &&
      newShapes.length > 0 &&
      modelDeploymentShapeSeriesToShapesMap === null // Only first time
    ) {
      const mapToSet: ModelDeploymentShapeSeriesToModelDeploymentShapeSummary =
        createModelDeploymentShapeSeriesToShapes(
          newShapes,
          isModelDeployFlexShapeSupportEnabled as boolean
        );
      setModelDeploymentShapeSeriesToShapesMap(mapToSet);
    }
  }, [modelDeploymentShapeQuery]);

  const onModelDataSubmit = (model: Model) => {
    setSelectedModel(model);
    closeSelectModel();
  };

  const onComputeSubmit = (
    instanceCount: number,
    instanceShape: string,
    instanceShapeType: ModelDeploymentShapeSeriesToShowEnum,
    newShapeConfigurationDetails: ModelDeploymentInstanceShapeConfigDetails
  ) => {
    setInstanceCount(instanceCount);
    setVmShapeName(instanceShape);
    setVmShapeType(instanceShapeType);
    setModelDeploymentShapeConfigurationDetails(newShapeConfigurationDetails);
    closeCompute();
  };

  const onComputeDataSubmit = (
    instanceShape: Shape,
    newShapeConfigurationDetails: ModelDeploymentInstanceShapeConfigDetails
  ) => {
    setSelectedComputeShape(instanceShape);
    setModelDeploymentShapeConfigurationDetails(newShapeConfigurationDetails);
    closeCompute();
  };

  const onInstanceCountChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInstanceCount(event.target.value as unknown as number);

  const onLoggingSubmit = (newLogDetails: CategoryLogDetails) => {
    setLogDetails(newLogDetails);
    setLogSelectLabel(getLogSelectLabel(newLogDetails));
  };

  const loading =
    !(modelDeployment && selectedModel) || (result && result.loading) || computeLoading;

  React.useEffect(() => {
    if (result && result.error) {
      setError(result.error);
    }
  }, [result]);

  const onSubmit = (form: Form): void => {
    const updateModelDeploymentDetailsFormInput = form.getValues();
    reset();
    const updateModelDeploymentDetail = getUpdateModelDeploymentDetails(
      updateModelDeploymentDetailsFormInput,
      selectedModel.id,
      instanceCount,
      vmShapeName,
      logDetails,
      modelDeployment,
      modelDeploymentShapeConfigurationDetails,
      !!isModelDeployBYOCEnabled,
      capabilities["realm"] as string
    );
    invoke({
      modelDeploymentId: modelDeployment.id,
      updateModelDeploymentDetails: updateModelDeploymentDetail,
    });
  };

  React.useEffect(() => {
    if (error) {
      ToastNotification.create({
        title: `${error.body.message}`,
        status: InfoBlockStatus.Critical,
      });
    }
  }, [error]);

  /* validation */

  const modelCheck = isValidModelOcid(selectedModel ? selectedModel.id : "invalid");
  const currentCompute: Compute = {
    instanceCount,
    vmShapeName,
  };
  const computeCheck = isValidCompute(currentCompute);

  const isValidRangeForCMDAndEntrypoint = (
    cmdVal: string,
    entryPointVal: string
  ): { isValid: boolean; errorMessage: string } => {
    const totalSize = (cmdVal ? cmdVal.length : 0) + (entryPointVal ? entryPointVal.length : 0);
    if (totalSize > 2048) {
      return {
        isValid: false,
        errorMessage: Messages.modelDeployments.errorMessages.cmdNEntryPointLimit(),
      };
    } else {
      return { isValid: true, errorMessage: "" };
    }
  };

  const validate = (values: FormValues): FormErrors => {
    fieldErrors[DISPLAY_NAME_FIELD] = validateField({
      value: values.displayName,
      required: false,
      maxLen: 255,
    });
    fieldErrors[DESCRIPTION_FIELD] = validateField({
      value: values.description,
      required: false,
      maxLen: 400,
    });
    fieldErrors[MODEL_OCID_FIELD] = validateField({
      callback: () => modelCheck.isValid,
      callbackMessage: modelCheck.errorMessage,
    });
    fieldErrors[COMPUTE_FIELD] = validateField({
      callback: () => computeCheck.isValid,
      callbackMessage: computeCheck.errorMessage,
    });
    if (isModelDeployBreezeEnabled) {
      fieldErrors[INSTANCE_COUNT_FIELD] = validateField({
        value: instanceCount,
        callback: (value: number) => isValidNumberOfInstances(value).isValid,
        callbackMessage: isValidNumberOfInstances(instanceCount).errorMessage,
      });
    }
    fieldErrors[BANDWIDTH_FIELD] = validateField({
      value: values.bandwidthMbps,
      required: false,
      callback: () => isValidBandwidthMbps(values.bandwidthMbps).isValid,
      callbackMessage: isValidBandwidthMbps(values.bandwidthMbps).errorMessage,
    });
    const isCmdAndEntrypointLimit = isValidRangeForCMDAndEntrypoint(
      values.containerCommand,
      values.containerEntrypoint
    );
    fieldErrors[CONTAINER_CMD] = validateField({
      value: values.containerCommand,
      required: false,
      callback: () => isCmdAndEntrypointLimit.isValid,
      callbackMessage: isCmdAndEntrypointLimit.errorMessage,
    });
    fieldErrors[CONTAINER_ENTRYPOINT] = validateField({
      value: values.containerEntrypoint,
      required: false,
      callback: () => isCmdAndEntrypointLimit.isValid,
      callbackMessage: isCmdAndEntrypointLimit.errorMessage,
    });
    fieldErrors[IMAGE_FIELD_NAME] = validateField({
      value: values.image,
      required: values?.customContainerImageSelected === "customImage" ? true : false,
      maxLen: 300,
    });
    fieldErrors[SERVER_PORT] = validateField({
      value: values.serverPort,
      required: false,
      maxLen: 300,
    });
    fieldErrors[HEALTHCHECK_PORT] = validateField({
      value: values.healthcheckPort,
      required: false,
      maxLen: 300,
    });
    return fieldErrors;
  };
  const getComputeSelectLabel = (): string => {
    if (computeCheck.isValid) {
      const instanceCountInfo =
        Messages.modelDeployments.labels.numberOfInstances() + " " + instanceCount;
      return vmShapeName + ", " + instanceCountInfo;
    } else return Messages.modelDeployments.labels.computeSelect();
  };

  const getModelSelectLabel = (): string =>
    modelCheck.isValid ? selectedModel.displayName : Messages.modelDeployments.labels.modelSelect();

  const defaultValues = {
    displayName: modelDeployment && modelDeployment.displayName,
    description: modelDeployment && modelDeployment.description,
    vmPoolSize: getInstanceCount(modelDeployment),
    shape: getInstanceShapeName(modelDeployment),
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
            <FormRemoteSubmitButton
              formRef={ref}
              key={"form_btn_submit"}
              label={"model-deploy-edit-submit-button"}
              testId={"model-deploy-edit-submit-button"}
            >
              {Messages.actions.submit()}
            </FormRemoteSubmitButton>,
          ]}
          onClose={onClose}
          title={Messages.modelDeployments.editTitle()}
          size={PanelSize.Large}
        >
          <div className="fullscreen-two-thirds-width">
            {loading && <DialogLoader />}
            <CompartmentSelect
              disabled={true}
              value={compartmentId}
              onChange={(compartment) => setCompartmentId(compartment.id)}
              fieldName={COMPARTMENT_ID_FIELD}
              tooltip={Messages.tooltips.compartmentSelect()}
              label={Messages.modelDeployments.labels.compartment()}
              testId="model-deployment-edit-compartment-select"
            />
            <Field
              label={Messages.modelDeployments.labels.name()}
              fieldName={DISPLAY_NAME_FIELD}
              optional={true}
              tooltip={Messages.tooltips.displayName()}
            >
              <TextInput />
            </Field>
            <Field
              label={Messages.modelDeployments.labels.description()}
              fieldName={DESCRIPTION_FIELD}
              optional={true}
            >
              <Textarea />
            </Field>
            {isModelDeployBYOCEnabled && (
              <DefaultModelDeployConfigDetails
                fieldErrors={fieldErrors}
                initialEnvVars={
                  customOcirModelDeploymentEnvironmentConfigurationDetails?.environmentVariables
                }
              />
            )}
            <SelectCard
              fieldName={MODEL_OCID_FIELD}
              fieldValue={selectedModel && selectedModel.id}
              header={Messages.modelDeployments.modelSelectTitle()}
              label={getModelSelectLabel()}
              buttonName={Messages.modelDeployments.actions.select()}
              buttonTestId="selectModelButton"
              onButtonClick={openSelectModel}
              disabled={isModelSelectDisabled}
            />
            {!isModelDeployBreezeEnabled && (
              <SelectCard
                fieldName={INSTANCE_COUNT_FIELD}
                fieldValue={instanceCount.toString()}
                header={Messages.modelDeployments.computeTitle()}
                label={getComputeSelectLabel()}
                buttonName={Messages.modelDeployments.actions.select()}
                buttonTestId="selectComputeButton"
                onButtonClick={openCompute}
                disabled={isComputeSelectDisabled || !!computeErrorText || computeLoading}
              />
            )}
            {isModelDeployBreezeEnabled && (
              <FieldSet legend={Messages.modelDeployments.computeTitle()}>
                <ShapeContextProvider
                  selectedShape={selectedComputeShape}
                  whitelistOverride={whitelist}
                >
                  {computeShapesQueryResult && (
                    <ShapePickerSummaryCard
                      allShapesQuery={computeShapesQueryResult}
                      compatibleShapes={computeShapesQueryResult.response?.data}
                      shape={selectedComputeShape}
                      validationError={
                        (!computeShapesQueryResult.loading &&
                          validateField({
                            value: ref?.getValues()[COMPUTE_FIELD],
                            required: true,
                          })) ||
                        undefined
                      }
                      flexConfig={{
                        ocpus: modelDeploymentShapeConfigurationDetails?.ocpus,
                        memoryInGBs: modelDeploymentShapeConfigurationDetails?.memoryInGBs,
                      }}
                      faultDomainId={""}
                      capacityReservation={undefined}
                      formLoading={computeShapesQueryResult.loading}
                      onClick={openCompute}
                      createFormType={CreateFormType.Instance}
                      disableChangeShapeButton={
                        !!computeShapesQueryResult.error ||
                        computeShapesQueryResult.loading ||
                        computeShapesQueryResult.response?.data?.length === 0
                      }
                    />
                  )}
                </ShapeContextProvider>
                <Field
                  label={Messages.modelDeployments.labels.numberOfInstances()}
                  fieldName={INSTANCE_COUNT_FIELD}
                  tooltip={Messages.tooltips.numberOfInstances()}
                >
                  <NumberInput
                    value={instanceCount}
                    min={NUMBEROFINST_MIN}
                    max={NUMBEROFINST_MAX}
                    step={1}
                    onChange={onInstanceCountChange}
                    testId="test-instanceCount"
                    required={true}
                  />
                </Field>
              </FieldSet>
            )}
            <SelectCard
              fieldName={LOGGING_FIELD}
              fieldValue={""}
              header={Messages.modelDeployments.loggingTitle()}
              label={logSelectLabel}
              buttonName={Messages.modelDeployments.actions.select()}
              onButtonClick={openLogging}
              optional={true}
            />
            <ModelDeploymentAdvancedOptions
              modelDeployment={modelDeployment}
              compartmentId={compartmentId}
              formRef={ref}
              customOcirModelDeploymentEnvironmentConfigurationDetails={
                customOcirModelDeploymentEnvironmentConfigurationDetails
              }
            />
          </div>
        </Panel>
      </Form>
      {isSelectModelOpen && (
        <ModelDeploymentSelectModelPanel
          preselectedModel={selectedModel}
          onClose={closeSelectModel}
          onModelDataSubmit={onModelDataSubmit}
        />
      )}
      {isComputeOpen && !isModelDeployBreezeEnabled && (
        <ModelDeploymentComputePanel
          preselectedInstanceCount={instanceCount}
          preSelectedInstance={vmShapeName}
          preSelectedInstanceType={vmShapeType}
          onClose={closeCompute}
          preSelectedModelDeploymentInstanceShapeConfigDetails={
            modelDeploymentShapeConfigurationDetails
          }
          shapeSeriesToShapesMap={modelDeploymentShapeSeriesToShapesMap}
          onComputeDataSubmit={onComputeSubmit}
        />
      )}
      {isComputeOpen && isModelDeployBreezeEnabled && (
        <ComputeSelectPanel
          onComputeDataSubmit={onComputeDataSubmit}
          closeHandler={closeCompute}
          defaultComputeShape={selectedComputeShape}
          defaultShapeConfigurationDetails={modelDeploymentShapeConfigurationDetails}
          shapeUseQuery={computeShapesQueryResult}
          whitelistOverride={whitelist}
          computeShapes={shapes}
        />
      )}
      {isLoggingOpen && (
        <ModelDeploymentLoggingPanel
          compartmentId={compartmentId}
          onClose={closeLogging}
          onLoggingSubmit={onLoggingSubmit}
          defaultValues={logDetails}
        />
      )}
    </>
  );
};

export default ModelDeploymentEditPanel;
