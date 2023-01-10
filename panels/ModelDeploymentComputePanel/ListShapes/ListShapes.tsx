import * as React from "react";
import { useListingContextClientConsumer } from "oui-savant";
import { SingleSelectListTable, TCellWidth, TSortDirection, ExpandableRow, Table } from "oui-react";
import * as Messages from "../../../../codegen/Messages";
import {
  ModelDeploymentInstanceShapeConfigDetails,
  ModelDeploymentShapeSummary,
} from "odsc-client/dist/odsc-client";
import { isFlexShape } from "../../../utils/flexShapeUtil";
import { FlexShapeSlider } from "../FlexShapeSlider/FlexShapeSlider";
import {
  getInstanceShapeSeriesToShow,
  ModelDeploymentShapeSeriesToModelDeploymentShapeSummary,
  ModelDeploymentShapeSeriesToShowEnum,
} from "../../../utils/modelDeploymentUtils";

interface Props {
  selectedComputeShape: string;
  flexShapeConfigDetails: ModelDeploymentInstanceShapeConfigDetails;
  shapeSeriesToShapesMap: ModelDeploymentShapeSeriesToModelDeploymentShapeSummary;
  onShapeSelectionUpdate: (
    newComputeShapeName: string,
    newComputeShapeType: ModelDeploymentShapeSeriesToShowEnum
  ) => void;
  onShapeConfigurationDetailsUpdate: (
    newShapeDetails: ModelDeploymentInstanceShapeConfigDetails,
    computeShape: string
  ) => void;
  selectedShapeSeries: ModelDeploymentShapeSeriesToShowEnum;
}

const ListShapes: React.FC<Props> = ({
  selectedComputeShape,
  flexShapeConfigDetails,
  shapeSeriesToShapesMap,
  onShapeSelectionUpdate,
  onShapeConfigurationDetailsUpdate,
  selectedShapeSeries,
}) => {
  const [shapes, setShapes] = React.useState<ModelDeploymentShapeSummary[]>(
    shapeSeriesToShapesMap[selectedShapeSeries]
  );

  const [tableSelection, setTableSelection] = React.useState(
    !!selectedComputeShape ? [selectedComputeShape] : []
  );

  const [expandedStates, setExpandedStates] = React.useState<{ [id: string]: boolean }>({});

  // Effect to update expanded states
  React.useEffect(() => {
    if (!!selectedComputeShape && isFlexShape(selectedComputeShape)) {
      setExpandedStates({ ...expandedStates, [selectedComputeShape]: true });
    }
  }, [tableSelection]);

  React.useEffect(() => {
    let isMounted: boolean = true;
    if (isMounted) {
      const newShapes = shapeSeriesToShapesMap[selectedShapeSeries];
      setShapes(shapeSeriesToShapesMap[selectedShapeSeries]);
      const existingSelectedShape = newShapes.find((shape) => shape.name === selectedComputeShape);

      /* Check if the current table has the existing shape there, then no need to update with first entry of the table */
      if (existingSelectedShape) {
        setTableSelection([existingSelectedShape.name]);
      } else if (newShapes && newShapes.length > 0) {
        onShapeSelectionUpdate(newShapes[0].name, getInstanceShapeSeriesToShow(newShapes[0].name));
      }
    }

    return () => (isMounted = false);
  }, [selectedShapeSeries]);

  const onSelectedShapeChanged = (selectedShapes: string[]) => {
    // Not shape is selected
    if (selectedShapes && selectedShapes.length < 1) {
      return;
    }
    const selectedShapeName: string = selectedShapes[0];
    const selectedShape: ModelDeploymentShapeSummary = shapes.find(
      (shape) => shape.name === selectedShapeName
    );

    setTableSelection([selectedShape.name]);
    onShapeSelectionUpdate(selectedShape.name, getInstanceShapeSeriesToShow(selectedShape.name));
  };

  const onShapeConfigurationDetailsChange = (
    ocpus: number,
    memory: number,
    computeShape: string
  ) => {
    onShapeConfigurationDetailsUpdate(
      {
        ocpus,
        memoryInGBs: memory,
      },
      computeShape
    );

    setTableSelection([computeShape]);
  };

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(shapes, {
    sorting: { enable: true },
  });

  const getShapeName = (row: ModelDeploymentShapeSummary) => row.name;
  const getNumberOCPUs = (row: ModelDeploymentShapeSummary) => row.coreCount;
  const getMemoryInGBs = (row: ModelDeploymentShapeSummary) => row.memoryInGBs;

  const currentShapeConfigurationDetails = (
    row: ModelDeploymentShapeSummary
  ): ModelDeploymentInstanceShapeConfigDetails => {
    return { ocpus: row.coreCount, memoryInGBs: row.memoryInGBs };
  };

  const getColumnsList = () => {
    return [
      {
        header: Messages.modelDeployments.labels.shapeName(),
        id: "shapeName",
        cell: getShapeName,
        width: TCellWidth.OneThird,
        defaultSortDirection: TSortDirection.Asc,
      },
      {
        header: Messages.modelDeployments.labels.numberOCPUs(),
        id: "coreCount",
        cell: getNumberOCPUs,
        width: TCellWidth.OneThird,
      },
      {
        header: Messages.modelDeployments.labels.memoryInGBs(),
        id: "memoryInGBs",
        cell: getMemoryInGBs,
        width: TCellWidth.OneThird,
      },
    ];
  };

  return isFlexShape(selectedComputeShape) ? (
    <>
      <SingleSelectListTable
        testId="list-flex-vm-shapes"
        data={page}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList()}
        rowId={(row: ModelDeploymentShapeSummary) => row.name}
        selectedIds={tableSelection}
        onSelectionChanged={onSelectedShapeChanged}
        numberShowingText={(numberShowing) =>
          Messages.modelDeployments.selectPanes.computeSelect.customAttributes.numberShowingText(
            numberShowing
          )
        }
        renderRow={(
          row: ModelDeploymentShapeSummary,
          table: Table<ModelDeploymentShapeSummary>
        ) => (
          <ExpandableRow
            key={row.name}
            row={row}
            table={table}
            expanded={expandedStates[row.name]}
            onToggle={(newState, row) =>
              setExpandedStates({ ...expandedStates, [row.name]: newState })
            }
            renderExpansionContent={() => (
              <>
                <FlexShapeSlider
                  computeShape={row.name}
                  shapeConfigurationDetails={flexShapeConfigDetails}
                  shapeDetails={currentShapeConfigurationDetails(row)}
                  onChange={onShapeConfigurationDetailsChange}
                />
              </>
            )}
          />
        )}
      />
    </>
  ) : (
    <>
      <SingleSelectListTable
        testId="list-vm-shapes"
        data={page}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList()}
        rowId={(row: ModelDeploymentShapeSummary) => row.name}
        selectedIds={tableSelection}
        onSelectionChanged={onSelectedShapeChanged}
        numberShowingText={(numberShowing) =>
          Messages.modelDeployments.selectPanes.computeSelect.customAttributes.numberShowingText(
            numberShowing
          )
        }
      />
    </>
  );
};

export default ListShapes;
