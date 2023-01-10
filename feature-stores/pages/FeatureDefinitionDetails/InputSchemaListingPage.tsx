import * as React from "react";
import { ListingHeading, ListingTemplate, ScopedResourceTitle, useConsoleState } from "oui-savant";

import * as Messages from "@codegen/Messages";
import { DsPrereqInfoBlock } from "../../../components/DsPrereqInfoBlock/DsPrereqInfoBlock";
import PluginMenu from "../../../common/PluginMenu";
import { MenuOptions } from "../../../common/MenuOptions";
import InputSchemaList from "./InputSchemaList";
import { FeatureDetails } from "fs-client";

interface Props {
  inputFeatures: FeatureDetails[];
}
export const InputSchemaListingPage: React.FC<Props> = ({ inputFeatures }) => {
  const { activeCompartment } = useConsoleState();

  return (
    <ListingTemplate
      heading={
        <ListingHeading
          title={
            <ScopedResourceTitle
              resourceName={Messages.projects.linkText()}
              scope={activeCompartment && activeCompartment.name}
            />
          }
        />
      }
      initialContext={{ paging: { pageSize: 10 } }}
      menu={<PluginMenu selectedMenuItem={MenuOptions.FEATURESTORES} />}
    >
      <DsPrereqInfoBlock />
      <InputSchemaList inputFeatures={inputFeatures} />
    </ListingTemplate>
  );
};
