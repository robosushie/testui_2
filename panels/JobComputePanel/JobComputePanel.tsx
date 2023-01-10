import { JobShapeConfigDetails, JobShapeSummary } from "odsc-client/dist/odsc-client";
import { Shape } from "coreservices-api-client";
import { Form, FormErrors, FormRef } from "oui-react";
import { FormRemoteSubmitButton, Panel, PanelSize } from "oui-savant";
import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import { getHelpLink } from "utils/docUtils";
import {
  isValidMemoryForFlexShape,
  isValidOcpuForFlexShape,
  isValidShape,
  validateField,
} from "utils/formUtils";
import {
  defaultFlexShapeDetails,
  fieldNameMap,
  FLEX_SLIDER_MEMORY_FIELD_NAME,
  FLEX_SLIDER_OCPUS_FIELD_NAME,
  MIN_MEMORY_FLEX,
  MIN_OCPU_FLEX,
} from "utils/flexShapeUtil";
import {
  InstanceTypePicker,
  SeriesOption,
  InstanceType,
  ShapeTable,
  DescriptionOfShapes,
  SHAPE_CATEGORIES,
  CreateFormType,
  ShapeWhitelistEnablement,
  COLUMN_CATEGORIES,
  ShapeContextProvider,
  isFlexShape,
  isBMShape,
} from "compute-console-breeze";
import { getShapeCategory, getShapeFieldName, toComputeShape } from "utils/shapeUtils";

interface Props {
  preselectedVmShape: JobShapeSummary;
  defaultShapeConfigurationDetails: JobShapeConfigDetails;
  shapes: JobShapeSummary[];
  onComputeDataSubmit: (compute: JobShapeSummary, flexShapeDetails: JobShapeConfigDetails) => void;
  onClose: () => void;
  shapeUseQuery: any;
  whitelistOverride?: Partial<ShapeWhitelistEnablement>;
  isPipelineCompute?: boolean;
}

export const JobComputePanel: React.FC<Props> = ({
  preselectedVmShape,
  defaultShapeConfigurationDetails,
  shapes,
  onComputeDataSubmit,
  onClose,
  shapeUseQuery,
  whitelistOverride,
  isPipelineCompute,
}) => {
  const [selectedShape, setSelectedShape] = React.useState<JobShapeSummary>(preselectedVmShape);
  const [shapeConfigurationDetails, setShapeConfigurationDetails] =
    React.useState<JobShapeConfigDetails>(undefined);
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [hasBareMetalShape, setHasBareMetalShape] = React.useState<boolean>(false);
  const [instanceType, setInstanceType] = React.useState<InstanceType>(
    InstanceType.VIRTUAL_MACHINE
  );
  const [shapeCategory, setShapeCategory] = React.useState<SHAPE_CATEGORIES>(undefined);
  const [computeShapes, setComputeShapes] = React.useState<Shape[]>([]);

  React.useEffect(() => {
    if (!shapeConfigurationDetails && defaultShapeConfigurationDetails) {
      setShapeConfigurationDetails(defaultShapeConfigurationDetails);
    }
  }, [defaultShapeConfigurationDetails]);

  // When submitting compute shapes to shapes table, selected shape must have the job ocpu/memory
  React.useEffect(() => {
    if (!!shapes && !preselectedVmShape) {
      setComputeShapes(
        shapes.map((element: JobShapeSummary) => toComputeShape(element, defaultFlexShapeDetails))
      );
    }
    if (!shapeCategory && !preselectedVmShape && isPipelineCompute) {
      setShapeCategory(getShapeCategory(shapes[0].name));
    }

    if (!!shapes && preselectedVmShape) {
      setComputeShapes(
        shapes.map((element: JobShapeSummary) => toComputeShape(element, defaultFlexShapeDetails))
      );
    }
    if (!shapeCategory && preselectedVmShape) {
      setShapeCategory(getShapeCategory(preselectedVmShape.name));
    }
    if (!hasBareMetalShape && shapes) {
      const bmShape = shapes.find((shape) => isBMShape({ shape: shape.name }));
      if (bmShape) {
        setHasBareMetalShape(true);
      } else {
        setHasBareMetalShape(false);
      }
    }
  }, [shapes, preselectedVmShape]);

  React.useEffect(() => {
    syncShape(selectedShape, shapeConfigurationDetails);
  }, [shapeConfigurationDetails]);

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const onSubmit = (form: Form): void => {
    if (form.isValid()) {
      setShape(toComputeShape(selectedShape));
      if (isFlexShape(selectedShape?.name)) {
        const ocpu = form.getValue(
          getShapeFieldName(selectedShape && selectedShape.name, FLEX_SLIDER_OCPUS_FIELD_NAME)
        );
        const memory = form.getValue(
          getShapeFieldName(selectedShape && selectedShape.name, FLEX_SLIDER_MEMORY_FIELD_NAME)
        );
        const jobShapeConfig: JobShapeConfigDetails = {
          ocpus: ocpu,
          memoryInGBs: memory,
        };
        setShapeConfigurationDetails(jobShapeConfig);
        return onComputeDataSubmit(selectedShape, jobShapeConfig);
      }
      onComputeDataSubmit(selectedShape, shapeConfigurationDetails);
    }
  };

  const getComputeShapes = (): Shape[] => {
    return computeShapes;
  };

  const setShape = (shape: Shape) => {
    if (shape) {
      const jobShape = shapes.find((element: JobShapeSummary) => element.name === shape.shape);
      if (jobShape) {
        setSelectedShape(jobShape);
      }

      if (isFlexShape(shape?.shape)) {
        const values = ref.getValues();
        const ocpu =
          values[
            getShapeFieldName(selectedShape && selectedShape.name, FLEX_SLIDER_OCPUS_FIELD_NAME)
          ];
        const memory =
          values[
            getShapeFieldName(selectedShape && selectedShape.name, FLEX_SLIDER_MEMORY_FIELD_NAME)
          ];
        const jobShapeConfig: JobShapeConfigDetails = {
          ocpus: ocpu,
          memoryInGBs: memory,
        };
        setShapeConfigurationDetails(jobShapeConfig);
      }
    } else if (!shape) {
      setSelectedShape(undefined);
    }
  };

  const flexCoreFieldName = getShapeFieldName(
    selectedShape && selectedShape.name,
    FLEX_SLIDER_OCPUS_FIELD_NAME
  );
  const flexMemoryFieldName = getShapeFieldName(
    selectedShape && selectedShape.name,
    FLEX_SLIDER_MEMORY_FIELD_NAME
  );

  // Helper to sync Form
  const syncShape = (
    shapeSync: JobShapeSummary | undefined,
    shapeConfig: JobShapeConfigDetails
  ) => {
    if (ref && shapeSync) {
      if (isFlexShape(shapeSync.name)) {
        const formChanges = ref;
        formChanges.setValue(flexCoreFieldName, shapeConfig.ocpus);
        formChanges.setValue(flexMemoryFieldName, shapeConfig.memoryInGBs);
        setRef(formChanges);
      }
    }
  };

  const createFormType: CreateFormType = CreateFormType.Instance;

  const onInstanceTypeChange = (selection: InstanceType) => {
    setInstanceType(selection);
  };

  const onSeriesChange = (selection: SHAPE_CATEGORIES) => {
    setShapeCategory(selection);
  };

  const validate = () => {
    const errors: FormErrors = {};

    if (!ref) {
      return errors;
    }

    if (!selectedShape && isPipelineCompute) {
      return {};
    }

    errors["shape"] = validateField({
      value: selectedShape && selectedShape.name,
      required: !isPipelineCompute,
      callback: (value: string) => isValidShape(value).isValid,
      callbackMessage: isValidShape(selectedShape && selectedShape.name).errorMessage,
    });

    if (!selectedShape && !isPipelineCompute) {
      return errors;
    }

    if (isFlexShape(selectedShape?.name)) {
      const values = ref.getValues();
      const ocpu =
        values[
          getShapeFieldName(selectedShape && selectedShape.name, FLEX_SLIDER_OCPUS_FIELD_NAME)
        ];
      const memory =
        values[
          getShapeFieldName(selectedShape && selectedShape.name, FLEX_SLIDER_MEMORY_FIELD_NAME)
        ];

      errors[FLEX_SLIDER_OCPUS_FIELD_NAME] = validateField({
        required: true,
        value: ocpu,
        callback: (value: number) =>
          isValidOcpuForFlexShape(value, MIN_OCPU_FLEX, selectedShape.coreCount).isValid,
        callbackMessage: isValidOcpuForFlexShape(ocpu, MIN_OCPU_FLEX, selectedShape.coreCount)
          .errorMessage,
      });

      errors[FLEX_SLIDER_MEMORY_FIELD_NAME] = validateField({
        required: true,
        value: memory,
        callback: (value: number) =>
          isValidMemoryForFlexShape(value, ocpu, MIN_MEMORY_FLEX, selectedShape.memoryInGBs)
            .isValid,
        callbackMessage: isValidMemoryForFlexShape(
          memory,
          ocpu,
          MIN_MEMORY_FLEX,
          selectedShape.memoryInGBs
        ).errorMessage,
      });
    }
    return errors;
  };

  const computeBreezeShapesComponents = (
    <ShapeContextProvider
      selectedShape={toComputeShape(selectedShape)}
      whitelistOverride={whitelistOverride}
    >
      <DescriptionOfShapes />

      {/* Product ask to make bare metal option dynamic see: https://dyn.slack.com/archives/C03DQPGNWVC/p1661878721965799 */}
      {hasBareMetalShape && (
        <InstanceTypePicker
          fieldName="instanceTypePicker"
          dvmh={undefined}
          initialType={instanceType}
          onChange={onInstanceTypeChange}
        />
      )}

      <SeriesOption
        fieldName="seriesOption"
        compatibleShapes={getComputeShapes()}
        instanceType={instanceType}
        initialCategory={shapeCategory}
        onChange={onSeriesChange}
      />

      <ShapeTable
        instanceType={instanceType}
        initialShape={toComputeShape(selectedShape, shapeConfigurationDetails)}
        allShapes={getComputeShapes()}
        compatibleShapes={getComputeShapes()}
        onShapeChange={setShape}
        image={undefined}
        faultDomainId={undefined}
        availabilityDomain={undefined}
        dvmh={undefined}
        shapesCompatibleWithDvmh={undefined}
        capacityReservation={undefined}
        shapeLimits={undefined}
        capacityPickType={undefined}
        initialBaselineOcpu={undefined}
        shapeCategory={shapeCategory}
        query={shapeUseQuery}
        getShapeFieldName={(shape, fieldName) =>
          getShapeFieldName(shape?.shape, fieldNameMap[fieldName as keyof typeof fieldNameMap])
        }
        createFormType={createFormType}
        columnCategory={COLUMN_CATEGORIES.SHAPE_OCPU_MEMORY}
      />
    </ShapeContextProvider>
  );

  return (
    <Form formRef={getFormRef} onSubmit={onSubmit} validator={validate}>
      <Panel
        actions={[
          <FormRemoteSubmitButton
            formRef={ref}
            key={"form_btn_submit"}
            testId={"job-compute-panel-submit-button"}
            disabled={isPipelineCompute ? false : !selectedShape}
          >
            {Messages.actions.selectShape()}
          </FormRemoteSubmitButton>,
        ]}
        size={PanelSize.Medium}
        onClose={onClose}
        title={Messages.jobs.selectPanes.computeSelect()}
        testId={"job-compute-panel"}
        helpLink={getHelpLink("/jobs-create.htm")}
      >
        {computeBreezeShapesComponents}
      </Panel>
    </Form>
  );
};
