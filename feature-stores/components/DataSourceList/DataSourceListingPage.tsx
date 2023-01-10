import * as React from "react";
import { ListingHeading, ListingTemplate, ScopedResourceTitle, useConsoleState } from "oui-savant";

import * as Messages from "@codegen/Messages";
import { DsPrereqInfoBlock } from "../../../components/DsPrereqInfoBlock/DsPrereqInfoBlock";
import PluginMenu from "../../../common/PluginMenu";
import { MenuOptions } from "../../../common/MenuOptions";
import DataSourceList from "./DataSourceList";

export const DataSourceListingPage: React.FC<{}> = () => {
  const { activeCompartment } = useConsoleState();

  return (
    <ListingTemplate
      usesActiveCompartment={true}
      // filters={<ListingFilters items={filterItems} />}
      heading={
        <ListingHeading
          title={
            <ScopedResourceTitle
              resourceName={Messages.dataSource.linkText()}
              scope={activeCompartment && activeCompartment.name}
            />
          }
        />
      }
      initialContext={{ paging: { pageSize: 10 } }}
      menu={<PluginMenu selectedMenuItem={MenuOptions.DATASOURCES} />}
    >
      <DsPrereqInfoBlock />
      <DataSourceList />
    </ListingTemplate>
  );
};
