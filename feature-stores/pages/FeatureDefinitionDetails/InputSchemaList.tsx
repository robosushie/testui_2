import * as React from "react";
import { ListTable, Tag, TCellWidth } from "oui-react";

import { useListingContextClientConsumer } from "oui-savant";

import { FeatureDetails } from "fs-client";
import * as Messages from "@codegen/Messages";

interface Props {
  inputFeatures: FeatureDetails[];
}
export const FeatureStoreList: React.FC<Props> = ({ inputFeatures }) => {
  // const [userResults, setUserResults] = React.useState([]);
  // const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);

  // const {
  //   paging: { pageSize, pageNumber }
  // } = useListingContext();

  // const wait = !(featureStores.response && featureStores.response.data);
  // const args = wait ? [] : getUniqueUsersArg(featureStores, pageSize, pageNumber);

  // const userBulkQueryResult = useBulkQuery({
  //   wait,
  //   method: apiClients.identityApi.getUser,
  //   options: { args },
  // });

  // React.useEffect(() => {
  //   if (!userBulkQueryResult.aggregatedResults.loading) {
  //     setIsLoadingUsers(userBulkQueryResult.aggregatedResults.loading);
  //     setUserResults(userBulkQueryResult.results);
  //   }
  // }, [userBulkQueryResult]);

  // Table column render functions

  const getNameCell = (row: FeatureDetails) => (
    <div>
      {row.name}
      {row.isEventTimestamp ? <Tag>{"Timestamp (" + row.eventTimestampFormat + ")"}</Tag> : null}
    </div>
  );
  const getTypeCell = (row: FeatureDetails) => row.type?.valueOf();

  const getDefaultValueCell = (row: FeatureDetails) => (row.defaultValue ? row.defaultValue : "-");

  const getNullableCell = (row: FeatureDetails) => (row.isNullable ? "true" : "false");

  const getRowId = (row: FeatureDetails) => row.name;

  // Table columns
  const columns = [
    {
      header: Messages.featureStoreFeatureDefinition.labels.name(),
      id: "name",
      cell: getNameCell,
      width: TCellWidth.OneQuarter,
      // Presence of this property is what enables the carets on the column header
      // Default when clicking for the first time will be A-Z
    },
    {
      header: Messages.featureStoreFeatureDefinition.labels.type(),
      id: "type",
      cell: getTypeCell,
      width: TCellWidth.OneQuarter,
    },
    {
      header: Messages.featureStoreFeatureDefinition.labels.defaultValue(),
      id: "defaultValue",
      cell: getDefaultValueCell,
      width: TCellWidth.OneQuarter,
    },
    {
      header: Messages.featureStoreFeatureDefinition.labels.nullable(),
      id: "nullable",
      cell: getNullableCell,
      width: TCellWidth.OneQuarter,
      // Presence of this property is what enables the carets on the column header
    },
    // {
    //   header: Messages.featureStoreFeatureDefinition.labels.orderNumber(),
    //   id: "Order Number",
    //   cell: (row:FeatureDetails)=>row.orderNumber,
    //   width: TCellWidth.OneQuarter,
    //   defaultSortDirection: TSortDirection.Desc,
    // }
  ];

  // Render actions
  // @ts-ignore

  const { page, pagination, sortOrder, setSortOrder } = useListingContextClientConsumer(
    inputFeatures,
    {
      sorting: { enable: true },
    }
  );

  return (
    <>
      <ListTable
        data={page}
        columns={columns}
        rowId={getRowId}
        paginationProps={pagination}
        sortOrder={sortOrder}
        updateSortOrder={setSortOrder}
        numberShowingText={(numberShowing) =>
          Messages.projects.labels.numberShowingText(numberShowing)
        }
        caption={Messages.captions.columns()}
      />
    </>
  );
};

export default FeatureStoreList;
