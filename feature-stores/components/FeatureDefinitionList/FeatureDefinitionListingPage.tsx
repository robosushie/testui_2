import * as React from "react";
// import {Entity} from "fs-client";
import {
  ListingTemplate,
  ListingNavMenu,
  ListingHeading,
  ScopedResourceTitle,
  useConsoleState,
} from "oui-savant";

import { FeatureDefinitionList } from "./FeatureDefinitionList";
import * as Messages from "@codegen/Messages";

interface Props {
  featureStoreId: string;
}

export const FeatureDefinitionListingPage: React.FC<Props> = ({ featureStoreId }) => {
  const { activeCompartment } = useConsoleState();

  return (
    <ListingTemplate
      heading={
        <ListingHeading
          title={
            <ScopedResourceTitle
              resourceName={Messages.featureStoreFeatureDefinition.linkText()}
              scope={activeCompartment && activeCompartment.name}
            />
          }
        />
      }
      menu={<ListingNavMenu />}
      usesActiveCompartment={true}
      initialContext={{ paging: { pageSize: 10 } }}
    >
      <FeatureDefinitionList featureStoreId={featureStoreId} />
    </ListingTemplate>
  );
};
