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
  ErrorText,
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
import { getRouteClient } from "loom-plugin-runtime";
import { ResourceNames } from "constants/resourceNames";
import { useDispatch } from "redux-react-hook";
import { push } from "connected-react-router";
import { ModelDeploymentAdvancedOptions } from "components/ModelDeploymentAdvancedOptions/ModelDeploymentAdvancedOptions";
import ModelDeploymentComputePanel, {
  NUMBEROFINST_MAX,
  NUMBEROFINST_MIN,
} from "../ModelDeploymentComputePanel/ModelDeploymentComputePanel";
import { ModelDeploymentLoggingPanel } from "../ModelDeploymentLoggingPanel/ModelDeploymentLoggingPanel";
import {
  createModelDeploymentShapeSeriesToShapes,
  defaultFlexShapeDetails,
  getCreateModelDeploymentDetails,
  getInstanceShapeSeriesToShow,
  getLogSelectLabel,
  ModelDeploymentShapeSeriesToModelDeploymentShapeSummary,
  ModelDeploymentShapeSeriesToShowEnum,
} from "utils/modelDeploymentUtils";
import {
  MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST,
  MODEL_DEPLOY_BYOC_WHITELIST,
  MODEL_DEPLOY_FLEX_SHAPE_SUPPORT_WHITELIST,
} from "../../pluginConstants";
import {
  COMPUTE_FIELD,
  DISPLAY_NAME_FIELD,
  DESCRIPTION_FIELD,
  BANDWIDTH_FIELD,
  MODEL_OCID_FIELD,
  LOGGING_FIELD,
  INSTANCE_COUNT_FIELD,
} from "constants/form";
import {
  IMAGE_FIELD_NAME,
  CONTAINER_CMD,
  CONTAINER_ENTRYPOINT,
  SERVER_PORT,
  HEALTHCHECK_PORT,
} from "constants/modelDeployments";
import { DefaultModelDeployConfigDetails } from "components/DefaultModelDeployConfigDetails/DefaultModelDeployConfigDetails";
import {
  ShapeContextProvider,
  ShapePickerSummaryCard,
  CreateFormType,
} from "compute-console-breeze";
import { getDefaultComputeWhitelists } from "utils/shapeUtils";
import { Shape } from "coreservices-api-client";
import { NotebookUtils } from "notebooks/utils/NotebookUtils";
import { ComputeSelectPanel } from "shared/panels/ComputeSelectPanel/ComputeSelectPanel";

interface Props {
  onClose: () => void;
  projectId: string;
  modelId?: string;
}

const ModelDeploymentCreatePanel: React.FC<Props> = ({ onClose, projectId, modelId }) => {
  const [selectedModel, setSelectedModel] = React.useState<Model>(undefined);
  const [instanceCount, setInstanceCount] = React.useState<number>(1);
  const [selectedComputeShape, setSelectedComputeShape] = React.useState<Shape>(null);
  const [shapes, setShapes] = React.useState<Shape[]>(undefined);
  const [computeShapesQueryResult, setComputeShapesQueryResult] =
    React.useState<QueryResult<Shape[]>>(undefined);
  const [vmShapeName, setVmShapeName] = React.useState<string>(undefined);
  const [vmShapeType, setVmShapeType] =
    React.useState<ModelDeploymentShapeSeriesToShowEnum>(undefined);
  const [logDetails, setLogDetails] = React.useState<CategoryLogDetails>(undefined);
  const [logSelectLabel, setLogSelectLabel] = React.useState(
    Messages.modelDeployments.labels.loggingSelect()
  );
  const [isSelectModelOpen, openSelectModel, closeSelectModel] = useModalState();
  const [isComputeOpen, openCompute, closeCompute] = useModalState();
  const [isLoggingOpen, openLogging, closeLogging] = useModalState();
  const { activeCompartment, capabilities } = useConsoleState();
  const [compartmentId, setCompartmentId] = React.useState(
    activeCompartment ? activeCompartment.id : undefined
  );

  const [computeLoading, setComputeLoading] = React.useState<boolean>(true);
  const [computeErrorText, setComputeErrorText] = React.useState<string>(undefined);

  const [modelDeploymentShapeConfigurationDetails, setModelDeploymentShapeConfigurationDetails] =
    React.useState<ModelDeploymentInstanceShapeConfigDetails>(defaultFlexShapeDetails);

  const [modelDeploymentShapeSeriesToShapesMap, setModelDeploymentShapeSeriesToShapesMap] =
    React.useState<ModelDeploymentShapeSeriesToModelDeploymentShapeSummary>(null);

  const [isModelDeployFlexShapeSupportEnabled] = useWhitelist(
    MODEL_DEPLOY_FLEX_SHAPE_SUPPORT_WHITELIST
  );
  const [isModelDeployBYOCEnabled] = useWhitelist(MODEL_DEPLOY_BYOC_WHITELIST);
  const [isModelDeployBreezeEnabled] = useWhitelist(MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST);

  const defaultVmInstanceShapeName = "VM.Standard2.1";
  const whitelist = getDefaultComputeWhitelists(false);
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [error, setError] = React.useState<NormalError>(undefined);
  const fieldErrors: FormErrors = {};

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  /* get Model Data */

  const wait = !modelId;
  const modelQuery = useQuery({
    wait,
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
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
    if (modelQuery && !selectedModel) {
      setSelectedModel(model);
    }
  }, [modelQuery]);

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
      vmShapeName === undefined // Only first time
    ) {
      if (isModelDeployFlexShapeSupportEnabled) {
        setVmShapeName(newShapes[0].name);
        setVmShapeType(getInstanceShapeSeriesToShow(newShapes[0].name));
      } else {
        setVmShapeName(defaultVmInstanceShapeName);
        setVmShapeType(ModelDeploymentShapeSeriesToShowEnum.PREV_GEN);
      }

      const mapToSet: ModelDeploymentShapeSeriesToModelDeploymentShapeSummary =
        createModelDeploymentShapeSeriesToShapes(
          newShapes,
          isModelDeployFlexShapeSupportEnabled as boolean
        );
      setModelDeploymentShapeSeriesToShapesMap(mapToSet);
    }
  }, [modelDeploymentShapeQuery, computeShapesListQuery]);

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

  /* Create Model Deployment */

  const dispatch = useDispatch();

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.createModelDeployment,
    onSuccess: () => {
      onClose();
    },
  });

  const loading = (result && result.loading) || (modelId && !selectedModel);

  React.useEffect(() => {
    if (result) {
      if (result.error) {
        setError(result.error);
      } else if (result.response) {
        const modelDeployment: ModelDeployment = result.response.data;
        const url = getRouteClient().makePluginUrl(
          `/${ResourceNames.modelDeployments}/${modelDeployment.id}`
        );
        dispatch(push(url));
      }
    }
  }, [result]);

  const onSubmit = (form: Form): void => {
    const createModelDeploymentDetailsFormInput = form.getValues();
    reset();
    const createModelDeploymentDetails = getCreateModelDeploymentDetails(
      createModelDeploymentDetailsFormInput,
      projectId,
      selectedModel.id,
      instanceCount,
      vmShapeName,
      logDetails,
      modelDeploymentShapeConfigurationDetails,
      !!isModelDeployBYOCEnabled,
      capabilities["realm"] as string
    );
    invoke({
      createModelDeploymentDetails,
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
  const computeCheck = isValidCompute(currentCompute);
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

  const getModelSelectLabel = (): string =>
    modelCheck.isValid ? selectedModel.displayName : Messages.modelDeployments.labels.modelSelect();

  const getComputeSelectLabel = (): string => {
    if (computeCheck.isValid) {
      const instanceCountInfo =
        Messages.modelDeployments.labels.numberOfInstances() + " " + instanceCount;
      return vmShapeName + ", " + instanceCountInfo;
    } else return Messages.modelDeployments.labels.computeSelect();
  };

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
          title={Messages.modelDeployments.createTitle()}
          size={PanelSize.Large}
        >
          <div className="fullscreen-two-thirds-width">
            {loading && <DialogLoader />}
            <CompartmentSelect
              value={compartmentId}
              onChange={(compartment) => setCompartmentId(compartment.id)}
              fieldName="compartmentId"
              tooltip={Messages.tooltips.compartmentSelect()}
              label={Messages.modelDeployments.labels.compartment()}
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
              <DefaultModelDeployConfigDetails fieldErrors={fieldErrors} />
            )}
            <SelectCard
              fieldName={MODEL_OCID_FIELD}
              fieldValue={selectedModel && selectedModel.id}
              header={Messages.modelDeployments.modelSelectTitle()}
              label={getModelSelectLabel()}
              buttonName={Messages.modelDeployments.actions.select()}
              onButtonClick={openSelectModel}
            />
            {!isModelDeployBreezeEnabled && (
              <SelectCard
                fieldName={COMPUTE_FIELD}
                fieldValue={instanceCount && instanceCount.toString() + vmShapeName}
                header={Messages.modelDeployments.computeTitle()}
                label={getComputeSelectLabel()}
                disabled={!!computeErrorText || computeLoading}
                buttonName={Messages.modelDeployments.actions.select()}
                onButtonClick={openCompute}
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
            <ModelDeploymentAdvancedOptions compartmentId={compartmentId} formRef={ref} />
            {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
          </div>
        </Panel>
      </Form>
      {isSelectModelOpen && (
        <ModelDeploymentSelectModelPanel
          activeProjectId={projectId}
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

export default ModelDeploymentCreatePanel;
