import { FormattedString, useListingContextClientConsumer } from "oui-savant";
import * as React from "react";
import * as Messages from "../../../../codegen/Messages";
import {
  Button,
  Icon,
  SingleSelectListTable,
  TCellWidth,
  Tooltip,
  TSortDirection,
} from "oui-react";
import {
  JobShapeSummary,
  JobShapeSummaryShapeSeriesEnum,
  NotebookSessionShapeSummary,
} from "odsc-client/dist/odsc-client";
import { JobShapeSeriesToJobShapeSummary } from "utils/JobUtils";

interface Props {
  selectedComputeShape: JobShapeSummary;
  shapeSeriesToShapesMap: JobShapeSeriesToJobShapeSummary;
  onShapeSelectionUpdate: (newComputeShape: JobShapeSummary) => void;
  selectedShapeSeries: JobShapeSummaryShapeSeriesEnum;
  isPipelineCompute?: boolean;
}

export const ShapesTable: React.FC<Props> = ({
  selectedComputeShape,
  shapeSeriesToShapesMap,
  onShapeSelectionUpdate,
  selectedShapeSeries,
  isPipelineCompute,
}) => {
  const [shapes, setShapes] = React.useState<JobShapeSummary[]>(
    shapeSeriesToShapesMap[selectedShapeSeries]
  );
  const [tableSelection, setTableSelection] = React.useState(
    !!selectedComputeShape && !!selectedComputeShape.name ? [selectedComputeShape.name] : []
  );

  React.useEffect(() => {
    // Get the list of shapes to display for the selected shape series
    const newShapes = shapeSeriesToShapesMap[selectedShapeSeries];
    setShapes(shapeSeriesToShapesMap[selectedShapeSeries]);
    const existingSelectedShape =
      newShapes &&
      selectedComputeShape &&
      newShapes.find((shape) => shape.name === selectedComputeShape.name);

    if (isPipelineCompute && !selectedComputeShape) {
      setTableSelection([]);
    } else if (existingSelectedShape) {
      setTableSelection([existingSelectedShape.name]);
    } else if (newShapes && newShapes.length > 0) {
      setTableSelection([newShapes[0].name]);
      onShapeSelectionUpdate(newShapes[0]);
    }
  }, [selectedShapeSeries]);

  const onSelectedShapeChanged = (selectedShapes: string[]) => {
    if (selectedShapes && selectedShapes.length < 1) {
      onShapeSelectionUpdate(undefined);
      return;
    }
    const selectedShapeName: string = selectedShapes[0];
    const selectedShape: JobShapeSummary = shapes.find((shape) => shape.name === selectedShapeName);
    setTableSelection([selectedShape.name]);
    onShapeSelectionUpdate(selectedShape);
  };

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(shapes, {
    sorting: { enable: true },
  });

  const getShapeName = (row: NotebookSessionShapeSummary) => {
    return (
      <>
        {row.name}{" "}
        {row.name.toLowerCase().includes("bm") && (
          <>
            <Button buttonIcon={Icon.Info} />
            <Tooltip>
              <FormattedString
                inputText={Messages.tooltips.bareMetal(
                  "https://docs.oracle.com/en-us/iaas/releasenotes/changes/20facdce-34bf-4648-a0a7-de5db73657ce/"
                )}
              />
            </Tooltip>
          </>
        )}
      </>
    );
  };
  const getNumberOCPUs = (row: JobShapeSummary) => row.coreCount;
  const getMemoryInGBs = (row: JobShapeSummary) => row.memoryInGBs;

  const getColumnsList = () => {
    return [
      {
        header: Messages.jobs.labels.shapeName(),
        id: "shapeName",
        cell: getShapeName,
        width: TCellWidth.OneThird,
        defaultSortDirection: TSortDirection.Asc,
      },
      {
        header: Messages.jobs.labels.numberOCPUs(),
        id: "coreCount",
        cell: getNumberOCPUs,
        width: TCellWidth.OneThird,
      },
      {
        header: Messages.jobs.labels.memoryInGBs(),
        id: "memoryInGBs",
        cell: getMemoryInGBs,
        width: TCellWidth.OneThird,
      },
    ];
  };

  return (
    <>
      <SingleSelectListTable
        testId="compute-shapes-table"
        data={page}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        columns={getColumnsList()}
        rowId={(row: JobShapeSummary) => row.name}
        selectedIds={tableSelection}
        onSelectionChanged={onSelectedShapeChanged}
      />
    </>
  );
};
