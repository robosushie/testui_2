import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import {
  ModelDeployment,
  ModelDeploymentInstanceShapeConfigDetails,
  ModelDeploymentShapeSummary,
} from "odsc-client/dist/odsc-client";
import {
  ListingContextProvider,
  Panel,
  PanelSize,
  CardRadioGroup,
  FormRemoteSubmitButton,
} from "oui-savant";
import {
  Form,
  Field,
  NumberInput,
  FormErrors,
  FormContextConsumer,
  OptionInterface,
  FormRef,
} from "oui-react";
import { COMPUTE_HELP_LINK } from "utils/docUtils";
import {
  isValidMemoryForFlexShapeForMD,
  isValidNumberOfInstances,
  isValidOcpuForFlexShape,
  isValidShape,
  validateField,
} from "utils/formUtils";
import Label from "components/Label/Label";

import ListShapes from "./ListShapes/ListShapes";
import { ProcessorLogoUtils, ServiceType } from "../../utils/ProcessorLogoUtils";
import {
  isFlexShape,
  MIN_MEMORY_FLEX_SHAPE_MD,
  MIN_OCPU_FLEX_SHAPE,
  FLEX_SLIDER_MEMORY_FIELD_NAME,
  FLEX_SLIDER_OCPUS_FIELD_NAME,
} from "../../utils/flexShapeUtil";
import {
  defaultFlexShapeDetails,
  ModelDeploymentShapeSeriesToModelDeploymentShapeSummary,
  ModelDeploymentShapeSeriesToShowEnum,
} from "../../utils/modelDeploymentUtils";

interface Props {
  preselectedInstanceCount?: number;
  preSelectedInstance?: string;
  preSelectedInstanceType: ModelDeploymentShapeSeriesToShowEnum;
  modelDeployment?: ModelDeployment;
  onClose: () => void;
  preSelectedModelDeploymentInstanceShapeConfigDetails: ModelDeploymentInstanceShapeConfigDetails;
  shapeSeriesToShapesMap: ModelDeploymentShapeSeriesToModelDeploymentShapeSummary;
  onComputeDataSubmit: (
    instanceCount: number,
    instanceShape: string,
    instanceShapeType: ModelDeploymentShapeSeriesToShowEnum,
    flexShapeDetails: ModelDeploymentInstanceShapeConfigDetails
  ) => void;
}

export const NUMBEROFINST_MIN = 1;
export const NUMBEROFINST_MAX = 10;
const NUMBEROFINST_STEP = 1;

const ModelDeploymentComputePanel: React.FC<Props> = ({
  preselectedInstanceCount,
  preSelectedInstance,
  preSelectedInstanceType,
  onClose,
  preSelectedModelDeploymentInstanceShapeConfigDetails,
  shapeSeriesToShapesMap,
  onComputeDataSubmit,
}) => {
  const [instanceCount, setInstanceCount] = React.useState(preselectedInstanceCount);
  const [vmShapeName, setVmShapeName] = React.useState<string>(preSelectedInstance);
  const [vmShapeType, setVmShapeType] =
    React.useState<ModelDeploymentShapeSeriesToShowEnum>(preSelectedInstanceType);

  const [modelDeploymentInstanceShapeConfigDetails, setModelDeploymentInstanceShapeConfigDetails] =
    React.useState<ModelDeploymentInstanceShapeConfigDetails>(
      preSelectedModelDeploymentInstanceShapeConfigDetails
    );
  const [radioValue, setRadioValue] = React.useState<ModelDeploymentShapeSeriesToShowEnum>(
    preSelectedInstanceType ? preSelectedInstanceType : undefined
  );

  const [ref, setRef] = React.useState<FormRef>(undefined);
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const computeShapeSeriesRadioGroupOptions = (): OptionInterface[] =>
    ProcessorLogoUtils.getComputeRadioButtonOptions(
      Object.keys(shapeSeriesToShapesMap),
      ServiceType.ModelDeployment
    );

  const onShapeSelectionUpdate = (
    newComputeShapeName: string,
    newComputeShapeType: ModelDeploymentShapeSeriesToShowEnum
  ) => {
    setVmShapeName(newComputeShapeName);
    setVmShapeType(newComputeShapeType);
    if (isFlexShape(newComputeShapeName) && modelDeploymentInstanceShapeConfigDetails === null) {
      setModelDeploymentInstanceShapeConfigDetails(defaultFlexShapeDetails);
    }
  };

  const onShapeConfigurationDetailsUpdate = (
    newModelDeploymentInstanceShapeConfigDetails: ModelDeploymentInstanceShapeConfigDetails,
    computeShape: string
  ) => {
    setModelDeploymentInstanceShapeConfigDetails(newModelDeploymentInstanceShapeConfigDetails);
    setVmShapeName(computeShape);
  };

  const validate = () => {
    const errors: FormErrors = {};

    if (!ref) {
      return errors;
    }

    errors["instanceCount"] = validateField({
      value: instanceCount,
      callback: (value: number) => isValidNumberOfInstances(value).isValid,
      callbackMessage: isValidNumberOfInstances(instanceCount).errorMessage,
    });

    if (isFlexShape(vmShapeName)) {
      const values = ref.getValues();
      const ocpu = parseFloat(values[FLEX_SLIDER_OCPUS_FIELD_NAME]);
      const memory = parseFloat(values[FLEX_SLIDER_MEMORY_FIELD_NAME]);

      const currentShapeConfigDetails: ModelDeploymentShapeSummary = shapeSeriesToShapesMap[
        vmShapeType
      ].find((shape) => shape.name === vmShapeName);

      errors[FLEX_SLIDER_OCPUS_FIELD_NAME] = validateField({
        required: true,
        value: ocpu,
        callback: (value: number) =>
          isValidOcpuForFlexShape(value, MIN_OCPU_FLEX_SHAPE, currentShapeConfigDetails.coreCount)
            .isValid,
        callbackMessage: isValidOcpuForFlexShape(
          ocpu,
          MIN_OCPU_FLEX_SHAPE,
          currentShapeConfigDetails.coreCount
        ).errorMessage,
      });

      errors[FLEX_SLIDER_MEMORY_FIELD_NAME] = validateField({
        required: true,
        value: memory,
        callback: (value: number) =>
          isValidMemoryForFlexShapeForMD(
            value,
            ocpu,
            MIN_MEMORY_FLEX_SHAPE_MD,
            currentShapeConfigDetails.memoryInGBs
          ).isValid,
        callbackMessage: isValidMemoryForFlexShapeForMD(
          memory,
          ocpu,
          MIN_MEMORY_FLEX_SHAPE_MD,
          currentShapeConfigDetails.memoryInGBs
        ).errorMessage,
      });
    } else {
      errors[vmShapeName] = validateField({
        value: vmShapeName,
        callback: (value: string) => isValidShape(value).isValid,
        callbackMessage: isValidShape(vmShapeName).errorMessage,
      });
    }
    return errors;
  };

  const onSubmit = () => {
    onComputeDataSubmit(
      instanceCount,
      vmShapeName,
      vmShapeType,
      modelDeploymentInstanceShapeConfigDetails
    );
  };

  const onInstanceCountChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInstanceCount(event.target.value as unknown as number);

  return (
    <Form formRef={getFormRef} validator={validate} onSubmit={onSubmit}>
      <FormContextConsumer>
        {({ form }) => (
          <Panel
            actions={[
              <FormRemoteSubmitButton
                formRef={ref}
                key={"form_btn_submit"}
                disabled={!form.isValid()}
                testId="submitButton"
              >
                {Messages.actions.submit()}
              </FormRemoteSubmitButton>,
            ]}
            size={PanelSize.Medium}
            title={Messages.modelDeployments.selectPanes.computeSelect.title()}
            onClose={onClose}
            helpLink={COMPUTE_HELP_LINK}
          >
            <Label>{Messages.modelDeployments.labels.vmShape()}</Label>
            <CardRadioGroup
              testId="vmShape-radio-group"
              columns={ProcessorLogoUtils.getColumns(
                Object.keys(shapeSeriesToShapesMap),
                ServiceType.ModelDeployment
              )}
              onSelectionChange={(value) =>
                setRadioValue(value as ModelDeploymentShapeSeriesToShowEnum)
              }
              fieldName="vmShapeRadioGroup"
              options={computeShapeSeriesRadioGroupOptions()}
              value={radioValue}
            />
            <Field
              label={Messages.modelDeployments.labels.numberOfInstances()}
              fieldName="instanceCount"
              tooltip={Messages.tooltips.numberOfInstances()}
            >
              <NumberInput
                value={instanceCount}
                min={NUMBEROFINST_MIN}
                max={NUMBEROFINST_MAX}
                step={NUMBEROFINST_STEP}
                onChange={onInstanceCountChange}
                testId="test-instanceCount"
                required={true}
              />
            </Field>
            <ListingContextProvider>
              <ListShapes
                selectedComputeShape={vmShapeName}
                flexShapeConfigDetails={modelDeploymentInstanceShapeConfigDetails}
                shapeSeriesToShapesMap={shapeSeriesToShapesMap}
                onShapeSelectionUpdate={onShapeSelectionUpdate}
                selectedShapeSeries={radioValue}
                onShapeConfigurationDetailsUpdate={onShapeConfigurationDetailsUpdate}
              />
            </ListingContextProvider>
          </Panel>
        )}
      </FormContextConsumer>
    </Form>
  );
};

export default ModelDeploymentComputePanel;
