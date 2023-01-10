import * as React from "react";
import { Card, FormContext } from "oui-react";
import "./FlexShapeSlider.less";
import {
  DEFAULT_MEMORY_PER_OCPU_MD,
  FLEX_SLIDER_MEMORY_FIELD_NAME,
  FLEX_SLIDER_OCPUS_FIELD_NAME,
  getMaximumMemoryByOpcus,
  getMinimumMemoryByOpcus,
  Marks,
  MIN_MEMORY_FLEX_SHAPE_MD,
  MIN_OCPU_FLEX_SHAPE,
} from "utils/flexShapeUtil";
import SliderField from "utils/SliderField/SliderField";
import { ModelDeploymentInstanceShapeConfigDetails } from "odsc-client/dist/odsc-client";
import * as Messages from "@codegen/Messages";
import { FormattedString } from "oui-savant";
import { FLEX_SHAPE_MORE_INFO_LINK } from "utils/docUtils";
import { objectEquals } from "../../../utils/dataUtils";
import { defaultFlexShapeDetails } from "../../../utils/modelDeploymentUtils";

interface Props {
  computeShape: string;
  shapeConfigurationDetails: ModelDeploymentInstanceShapeConfigDetails;
  shapeDetails: ModelDeploymentInstanceShapeConfigDetails;
  onChange: (ocpus: number, memory: number, computeShape: string) => void;
}

export const FlexShapeSlider: React.FC<Props> = ({
  computeShape,
  shapeConfigurationDetails,
  shapeDetails,
  onChange,
}) => {
  const MIN_OCPU: number = MIN_OCPU_FLEX_SHAPE;
  const MAX_OCPU: number = shapeDetails.ocpus;

  const MIN_MEMORY: number = MIN_MEMORY_FLEX_SHAPE_MD;
  const MAX_MEMORY: number = shapeDetails.memoryInGBs;

  const { form } = React.useContext(FormContext);

  const dotsStyle: React.CSSProperties[] | React.CSSProperties = {
    marginTop: "4px",
    cursor: "default",
  };
  const originalOcpuDots: Marks = {};
  originalOcpuDots[MIN_OCPU] = { style: dotsStyle, label: `${MIN_OCPU}` };
  originalOcpuDots[MAX_OCPU] = { style: dotsStyle, label: `${MAX_OCPU}` };

  const originalMemoryDots: Marks = {};
  originalMemoryDots[MIN_MEMORY] = { style: dotsStyle, label: `${MIN_MEMORY}` };
  originalMemoryDots[MAX_MEMORY] = { style: dotsStyle, label: `${MAX_MEMORY}` };

  const [ocpuDots, setOcpuDots] = React.useState<Marks>(originalOcpuDots);
  const [memoryDots, setMemoryDots] = React.useState<Marks>(originalMemoryDots);

  const [currentComputeShape, setCurrentComputeShape] = React.useState<string>(computeShape);

  const [hasManuallyChangedMemory, setHasManuallyChangedMemory] = React.useState<boolean>(false);
  const [minOcpuRangeValue, setMinOcpuRangeValue] = React.useState([
    MIN_OCPU,
    shapeConfigurationDetails ? shapeConfigurationDetails.ocpus : defaultFlexShapeDetails.ocpus,
    MAX_OCPU,
  ]);

  const [minMemoryRangeValue, setMinMemoryRangeValue] = React.useState([
    MIN_MEMORY,
    shapeConfigurationDetails
      ? shapeConfigurationDetails.memoryInGBs
      : defaultFlexShapeDetails.memoryInGBs,
    getMaximumMemoryByOpcus(
      shapeConfigurationDetails ? shapeConfigurationDetails.ocpus : defaultFlexShapeDetails.ocpus,
      MAX_MEMORY
    ),
  ]);

  React.useEffect(() => {
    let isMounted: boolean = true;
    if (isMounted && computeShape && !objectEquals(currentComputeShape, computeShape)) {
      setMemoryDots(originalMemoryDots);
      setOcpuDots(originalOcpuDots);
      setCurrentComputeShape(computeShape);
      setMinOcpuRangeValue([
        MIN_OCPU,
        shapeConfigurationDetails ? shapeConfigurationDetails.ocpus : defaultFlexShapeDetails.ocpus,
        MAX_OCPU,
      ]);
      setMinMemoryRangeValue([
        MIN_MEMORY,
        shapeConfigurationDetails
          ? shapeConfigurationDetails.memoryInGBs
          : defaultFlexShapeDetails.memoryInGBs,
        getMaximumMemoryByOpcus(
          shapeConfigurationDetails
            ? shapeConfigurationDetails.ocpus
            : defaultFlexShapeDetails.ocpus,
          MAX_MEMORY
        ),
      ]);
    }

    return () => (isMounted = false);
  }, [computeShape, currentComputeShape]);

  const onFlexChanges = (ocpus: number, memory: number) => {
    setMinOcpuRangeValue([MIN_OCPU, ocpus, MAX_OCPU]);
    const minMemory = getMinimumMemoryByOpcus(ocpus, MIN_MEMORY);
    const maxMemory = getMaximumMemoryByOpcus(ocpus, MAX_MEMORY);
    let newMemoryValue = memory;
    if (memory > maxMemory) {
      newMemoryValue = maxMemory;
    }
    if (memory < minMemory) {
      newMemoryValue = minMemory;
    }
    setMinMemoryRangeValue([minMemory, newMemoryValue, maxMemory]);

    const newOcpuDots: Marks = originalOcpuDots;
    newOcpuDots[ocpus] = { style: dotsStyle, label: `${ocpus}` };
    setOcpuDots(newOcpuDots);

    const newMemoryDots: Marks = originalMemoryDots;
    newMemoryDots[newMemoryValue] = { style: dotsStyle, label: `${newMemoryValue}` };
    setMemoryDots(newMemoryDots);

    form && form.setValue(FLEX_SLIDER_OCPUS_FIELD_NAME, ocpus);
    form && form.setValue(FLEX_SLIDER_MEMORY_FIELD_NAME, newMemoryValue);
    form && form.triggerValidation();
    setCurrentComputeShape(computeShape);
    onChange(ocpus, newMemoryValue, computeShape);
  };

  return (
    <>
      <div className="md-flex-slider-wrapper">
        <Card>
          <div style={{ margin: "20px" }}>
            <p>
              <FormattedString
                inputText={Messages.computePanels.flexSliderHint(FLEX_SHAPE_MORE_INFO_LINK)}
              />
            </p>
          </div>
          <SliderField
            min={MIN_OCPU}
            max={MAX_OCPU}
            marks={ocpuDots}
            initialValue={minOcpuRangeValue}
            onChange={(value: number[]) => {
              if (hasManuallyChangedMemory) {
                onFlexChanges(value[1], form && form.getValue(FLEX_SLIDER_MEMORY_FIELD_NAME));
              } else {
                onFlexChanges(value[1], DEFAULT_MEMORY_PER_OCPU_MD * value[1]);
              }
            }}
            fieldName={FLEX_SLIDER_OCPUS_FIELD_NAME}
            fieldLabel={Messages.computePanels.ocpuSliderLabel()}
            disabled={false}
          />
          <SliderField
            min={MIN_MEMORY}
            max={MAX_MEMORY}
            marks={memoryDots}
            initialValue={minMemoryRangeValue}
            onChange={(value: number[]) => {
              setHasManuallyChangedMemory(true);
              const ocpus = minOcpuRangeValue[1];
              onFlexChanges(ocpus, value[1]);
            }}
            fieldName={FLEX_SLIDER_MEMORY_FIELD_NAME}
            fieldLabel={Messages.computePanels.memorySliderLabel()}
            disabled={false}
          />
        </Card>
      </div>
    </>
  );
};
