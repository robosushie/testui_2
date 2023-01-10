import * as React from "react";
// import {Entity} from "fs-client";
import {
  ListingTemplate,
  ListingNavMenu,
  ListingHeading,
  ScopedResourceTitle,
  useConsoleState,
} from "oui-savant";

import { EntityList } from "./EntityList";
import * as Messages from "@codegen/Messages";

interface Props {
  // featureStore: FeatureStore;
}

export const EntityListingPage: React.FC<Props> = () => {
  const { activeCompartment } = useConsoleState();

  return (
    <ListingTemplate
      heading={
        <ListingHeading
          title={
            <ScopedResourceTitle
              resourceName={Messages.featureStoreEntity.linkText()}
              scope={activeCompartment && activeCompartment.name}
            />
          }
        />
      }
      menu={<ListingNavMenu />}
      usesActiveCompartment={true}
      initialContext={{ paging: { pageSize: 10 } }}
    >
      <EntityList />
    </ListingTemplate>
  );
};
