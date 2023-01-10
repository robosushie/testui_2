import * as React from "react";
import { ListingHeading, ListingTemplate, ScopedResourceTitle, useConsoleState } from "oui-savant";

import * as Messages from "@codegen/Messages";
import { DsPrereqInfoBlock } from "../../../components/DsPrereqInfoBlock/DsPrereqInfoBlock";
import PluginMenu from "../../../common/PluginMenu";
import { MenuOptions } from "../../../common/MenuOptions";
import FeatureStoreList from "./FeatureStoreList";

export const FeatureStoreListingPage: React.FC<{}> = () => {
  const { activeCompartment } = useConsoleState();

  return (
    <ListingTemplate
      usesActiveCompartment={true}
      heading={
        <ListingHeading
          title={
            <ScopedResourceTitle
              resourceName={Messages.featureStore.linkText()}
              scope={activeCompartment && activeCompartment.name}
            />
          }
        />
      }
      initialContext={{ paging: { pageSize: 10 } }}
      menu={<PluginMenu selectedMenuItem={MenuOptions.FEATURESTORES} />}
    >
      <DsPrereqInfoBlock />
      <FeatureStoreList />
    </ListingTemplate>
  );
};
