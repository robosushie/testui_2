import * as React from "react";
import { useDispatch } from "redux-react-hook";
import { StatusShape, LabelMetaItem, ShowCopyText } from "oui-react";
import {
  useConsoleState,
  setActiveCompartment,
  TimeInterval,
  useQuery,
  DetailContent,
  DetailTemplate,
  SubresourcesWrapper,
  DetailHeading,
  useUpdateContextualSupport,
  useWhitelist,
} from "oui-savant";
import { getRouteClient } from "loom-plugin-runtime";

import apiClients from "../../../apiClients";
import { getDateTimeFormat } from "../../../utils/timeUtils";
import { ResourceNames } from "../../../constants/resourceNames";
import * as Messages from "../../../../codegen/Messages";
import { StatusTypeForLifecycleState } from "../../../constants/lifecycleStates";

import { ErrorPage } from "../../../components/ErrorPage/ErrorPage";

import { EntityListingPage } from "feature-stores/components/EntityList/EntityListingPage";
import { DatasetListingPage } from "feature-stores/components/DatasetList/DatasetListingPage";

import PageLoader from "../../../components/PageLoader/PageLoader";
import {
  PLUGIN_NAME,
  CONTEXTUAL_SUPPORT_WHITELIST,
  SUPPORT_CONTEXT_SCHEMA_NAME,
} from "../../../pluginConstants";
import { NullableMetaItem } from "../../../components/NullableMetaItem/NullableMetaItem";
import { DetailsPrettyLifecycleState } from "../../../utils/lifecycleStatesUtils";
import { RouteComponentProps } from "react-router";
import { FeatureDefinitionListingPage } from "../../components/FeatureDefinitionList/FeatureDefinitionListingPage";

type Props = RouteComponentProps<{ featureStoreId: string; activeResourceName?: string }>;



export const FeatureStoreDetails: React.FC<Props> = ({
  match: {
    params: { featureStoreId, activeResourceName },
  },
}) => {
  const dispatch = useDispatch();
  const { activeCompartment } = useConsoleState();
  const [contextualSupportEnabled] = useWhitelist(CONTEXTUAL_SUPPORT_WHITELIST);

//   const featureStore = useQuery({
//     method: apiClients.fsApi.getFeatureStore,
//     options: {
//       args: { featureStoreId },
//       caching: { type: "polling", pollingInterval: TimeInterval.md },
//     },
//   });
  const featureStoreReady = true;
    // !featureStore.error && featureStore.response && featureStore.response.data;


  // const user = useQuery({
  //   wait: !featureStoreReady,
  //   method: apiClients.identityApi.getUser,
  //   options: { args: featureStoreReady && { userId: featureStore.response.data.createdBy } },
  // });
  // const userReady = !user.error && user.response && user.response.data;

  // This addresses the case when a user visits a featureStore without having already...
  // ...selected a compartment. Default to the compartmentId that is associated with the featureStore.
  React.useEffect(() => {
    // if (!activeCompartment && featureStoreReady) {
    //   dispatch(setActiveCompartment(featureStore.response.data.compartmentId));
    // }
  }, [activeCompartment, featureStore]);

  // Prepare base bread crumb items
  const breadcrumbItems = [
    {
      label: Messages.breadcrumb.dataScience(),
    },
    {
      label: Messages.breadcrumb.featureStores(),
      href: getRouteClient().makePluginUrl(ResourceNames.featureStore),
    },
  ];

//   if (featureStore.error) {
//     return (
//       <ErrorPage
//         breadcrumbItems={breadcrumbItems}
//         resourceType={Messages.projects.detailText()}
//         error={featureStore.error}
//       />
//     );
//   }

//   if (featureStore.loading) {
//     return <PageLoader />;
//   }

  const { id, displayName, lifecycleState, description, timeCreated } = featureStoreReady;

  // Add the featureStore's display name as the list item.
  breadcrumbItems.push({
    label: `${Messages.breadcrumb.featureStoreDetails()}`,
  });

  const getResourceLabel = (activeResourceName: string) => {
    switch (activeResourceName) {
      case ResourceNames.featureStoreEntity:
        return Messages.breadcrumb.entities();
      case ResourceNames.featureStoreDataset:
        return Messages.breadcrumb.datasets();
      case ResourceNames.featureStoreFeatureDefinition:
        return Messages.breadcrumb.featureDefinitions();
    }
    return Messages.breadcrumb.featureStoreDetails();
  };

  if (activeResourceName) {
    breadcrumbItems.push({ label: getResourceLabel(activeResourceName), href: "" });
  }

  const actions = [<></>];

  const supportRequestPayload = {
    origin: PLUGIN_NAME,
    ocid: featureStoreId,
    path: `/${PLUGIN_NAME}/${ResourceNames.featureStore}/${ResourceNames.scratchpad}`,
    resourceType: ResourceNames.scratchpad,
    details: {
      schema: SUPPORT_CONTEXT_SCHEMA_NAME,
      version: "1.0",
      payload: {},
    },
  };



  const ContextualSupport =
    contextualSupportEnabled && useUpdateContextualSupport(supportRequestPayload);
  if (ContextualSupport) {
    console.log("successfully submitted contextual data");
  } else {
    console.log("still pending/error submitting contextual data");
  }

  return (
    <>
        <h1>Scratchpad Component mounted Successfully</h1>
    </>
  );
};
