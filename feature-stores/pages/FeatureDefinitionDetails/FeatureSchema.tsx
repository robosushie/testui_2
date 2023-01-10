import * as React from "react";

import * as Messages from "@codegen/Messages";
import { ListingHeading, ListingNavMenu, ListingTemplate } from "oui-savant";
import { Tab, Tabs } from "oui-react";
import { FeatureDefinition, FeatureDetails } from "fs-client";
import InputSchemaList from "./InputSchemaList";

interface Props {
  featureDefinition: FeatureDefinition;
}
export const FeatureSchema: React.FC<Props> = ({ featureDefinition }) => {
  // tslint:disable-next-line:no-unused
  const inputFeatureDetails: FeatureDetails[] = featureDefinition.inputFeatureDetails;

  return (
    <>
      <ListingTemplate
        heading={
          <ListingHeading
            title={Messages.models.schemaDefinitionTitle()}
            description={
              "The input schema is the sequence of features to accepted as an input to feature definition group while materialising. The Output schema specifies the schema that is seen after the transformation is done"
            }
          />
        }
        initialContext={{ paging: { pageSize: 10 } }}
        menu={<ListingNavMenu />}
        usesActiveCompartment={false}
      >
        <Tabs>
          <Tab label={Messages.modelSchema.inputSchema()}>
            <InputSchemaList inputFeatures={featureDefinition.inputFeatureDetails} />
          </Tab>

          <Tab label={Messages.modelSchema.outputSchema()} disabled={true} />
        </Tabs>
      </ListingTemplate>
    </>
  );
};
