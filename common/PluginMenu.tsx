import { VerticalNav, VerticalNavItem } from "oui-react";
import * as Messages from "@codegen/Messages";
import { getRouteClient } from "loom-plugin-runtime";
import * as React from "react";
import { ResourceNames } from "constants/resourceNames";
import { MenuOptions } from "./MenuOptions";

interface Props {
  selectedMenuItem?: string;
}

const PluginMenu: React.FC<Props> = (props) => {
  const { selectedMenuItem = MenuOptions.PROJECTS } = props;
  const pluginUrl = (path: string) => {
    return new URL(getRouteClient().makePluginUrl(path)).toString();
  };
  return (
    <>
      <div className="oui-savant-lt-listing__sidebar__nav marginBottom_15px">
        <VerticalNav>
          <h2>{Messages.breadcrumb.dataScience()}</h2>
          <VerticalNavItem
            label={Messages.breadcrumb.projects()}
            href={pluginUrl(`/${ResourceNames.projects}`)}
            isDefault={selectedMenuItem === MenuOptions.PROJECTS}
          />
        </VerticalNav>
      </div>
      <div className="oui-savant-lt-listing__sidebar__nav marginBottom_15px">
        {
          <VerticalNav>
            <h2>{Messages.breadcrumb.featureStore()}</h2>
            <VerticalNavItem
              label={Messages.breadcrumb.featureStores()}
              href={pluginUrl(`${ResourceNames.featureStore}`)}
              isDefault={selectedMenuItem === MenuOptions.FEATURESTORES}
            />
            <VerticalNavItem
              label={Messages.breadcrumb.datasources()}
              href={pluginUrl(`/${ResourceNames.datasources}`)}
              isDefault={selectedMenuItem === MenuOptions.DATASOURCES}
            />
          </VerticalNav>
        }
      </div>
    </>
  );
};

export default PluginMenu;
