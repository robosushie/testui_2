import * as React from "react";
import { useDispatch } from "redux-react-hook";
import { LabelMetaItem, Link, MetaItemStatus, ShowCopyText, StatusShape } from "oui-react";
import {
  DetailContent,
  DetailHeading,
  DetailTemplate,
  setActiveCompartment,
  SubresourcesWrapper,
  TimeInterval,
  useConsoleState,
  useQuery,
  useUpdateContextualSupport,
  useWhitelist
} from "oui-savant";
import { getRouteClient } from "loom-plugin-runtime";

import apiClients from "../../../apiClients";
import { getDateTimeFormat } from "../../../utils/timeUtils";
import { ResourceNames } from "../../../constants/resourceNames";
import * as Messages from "../../../../codegen/Messages";
import { StatusTypeForLifecycleState } from "../../../constants/lifecycleStates";
import { ErrorPage } from "../../../components/ErrorPage/ErrorPage";
import PageLoader from "../../../components/PageLoader/PageLoader";
import { CONTEXTUAL_SUPPORT_WHITELIST, PLUGIN_NAME, SUPPORT_CONTEXT_SCHEMA_NAME } from "../../../pluginConstants";
import { NullableMetaItem } from "../../../components/NullableMetaItem/NullableMetaItem";
import { DetailsPrettyLifecycleState } from "../../../utils/lifecycleStatesUtils";
import { RouteComponentProps } from "react-router";
import { FeatureSchema } from "./FeatureSchema";

type Props = RouteComponentProps<{
  featureDefinitionId: string;
  activeResourceName?: string;
}>;

export const FeatureDefinitionDetails: React.FC<Props> = ({
  match: {
    params: { featureDefinitionId, activeResourceName },
  },
}) => {
  const dispatch = useDispatch();
  const { activeCompartment } = useConsoleState();
  const [contextualSupportEnabled] = useWhitelist(CONTEXTUAL_SUPPORT_WHITELIST);

  const featureDefinition = useQuery({
    method: apiClients.fsApi.getFeatureDefinition,
    options: {
      args: { featureDefinitionId },
      caching: { type: "polling", pollingInterval: TimeInterval.md },
    },
  });
  const featureDefinitionReady =
    !featureDefinition.error && featureDefinition.response && featureDefinition.response.data;

  const entity = useQuery(
    {
      method: apiClients.fsApi.getEntity,
      wait: !featureDefinitionReady,
      options: {
        args: { entityId: featureDefinitionReady?.entityId },
        caching: {type: "polling", pollingInterval: TimeInterval.md }
      }
    }
  )
  const entityReady =  !entity.error && entity.response && entity.response.data;
  // const user = useQuery({
  //   wait: !featureStoreReady,
  //   method: apiClients.identityApi.getUser,
  //   options: { args: featureStoreReady && { userId: featureStore.response.data.createdBy } },
  // });
  // const userReady = !user.error && user.response && user.response.data;

  // This addresses the case when a user visits a featureStore without having already...
  // ...selected a compartment. Default to the compartmentId that is associated with the featureStore.
  React.useEffect(() => {
    if (!activeCompartment && featureDefinitionReady) {
      dispatch(setActiveCompartment(featureDefinition.response.data.compartmentId));
    }
  }, [activeCompartment, featureDefinition]);

  // Prepare base bread crumb items
  const breadcrumbItems = [
    {
      label: Messages.breadcrumb.dataScience(),
    },
    {
      label: Messages.breadcrumb.featureStores(),
      href: getRouteClient().makePluginUrl(ResourceNames.featureStore),
    }
  ];

  if (featureDefinition.error) {
    return (
      <ErrorPage
        breadcrumbItems={breadcrumbItems}
        resourceType={Messages.projects.detailText()}
        error={featureDefinition.error}
      />
    );
  }

  if (featureDefinition.loading) {
    return <PageLoader />;
  }

  featureDefinitionReady && breadcrumbItems.push( {
      label: Messages.breadcrumb.featureStoreDetails(),
      href: getRouteClient().makePluginUrl(
        `/${ResourceNames.featureStore}/${featureDefinitionReady.featureStoreId}/${ResourceNames.featureStoreFeatureDefinition}`
      ),
    }
  )

  breadcrumbItems.push({ label: Messages.breadcrumb.featureDefinitionDetails() });


  const { id, displayName, lifecycleState, description, timeCreated } = featureDefinitionReady;

  // Add the featureStore's display name as the list item.

  const getResourceLabel = (activeResourceName: string) => {
    switch (activeResourceName) {
      case ResourceNames.featureStoreFeatureSchema:
        return Messages.breadcrumb.featureStoreFeatureSchema();
      case ResourceNames.featureStoreTransformation:
        return Messages.breadcrumb.featureStoreFeatureTransformation();
    }
    return Messages.breadcrumb.featureStoreFeatureSchema();
  };
  if (activeResourceName) {
    breadcrumbItems.push({ label: getResourceLabel(activeResourceName) });
  }

  const actions = [<></>];

  const supportRequestPayload = {
    origin: PLUGIN_NAME,
    ocid: featureDefinitionId,
    path: `/${PLUGIN_NAME}/${ResourceNames.featureStore}`,
    resourceType: ResourceNames.featureStore,
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
      <DetailTemplate
        heading={<DetailHeading title={displayName} />}
        breadcrumbItems={breadcrumbItems}
        status={{
          type: StatusTypeForLifecycleState[lifecycleState],
          shape: StatusShape.Circle,
          text: DetailsPrettyLifecycleState(lifecycleState),
          shapeText: Messages.featureStoreFeatureDefinition.shapeText(),
        }}
        actions={actions}
        subresourceContent={
          <SubresourcesWrapper
            resourceNavigation={{
              items: [
                {
                  label: Messages.featureStoreFeatureSchema.linkText(),
                  appendPath: ResourceNames.featureStoreFeatureSchema,
                  component: <FeatureSchema featureDefinition={featureDefinition.response.data} />,
                },
                // {
                //   label: Messages.featureStoreFeatureTransformation.linkText(),
                //   appendPath: ResourceNames.featureStoreTransformation,
                //   component: <
                // }
                // {
                //   label: "Feature Definition Runs",
                //   appendPath: ResourceNames.featureStoreFeatureRun,
                //   component: <FeatureStoreJobLuis
                //
                // }
              ],
            }}
          />
        }
      >
        <DetailContent
          details={[
            {
              label: Messages.detailTemplate.detailsLabel(Messages.featureStoreFeatureDefinition.detailText()),
              content: [
                <NullableMetaItem
                  key="fstore-details-meta-desc"
                  testId="fstore-details-meta-desc"
                  label={Messages.featureStoreFeatureDefinition.labels.description()}
                >
                  {description}
                </NullableMetaItem>,
                <LabelMetaItem
                  key="fstore-details-meta-ocid"
                  testId="fstore-details-meta-ocid"
                  label={Messages.detailTemplate.ocid()}
                >
                  <ShowCopyText fullText={id} charactersToShow={8} />
                </LabelMetaItem>,
                <LabelMetaItem
                  key="fstore-details-meta-time-created"
                  testId="fstore-details-meta-time-created"
                  label={Messages.featureStores.labels.timeCreated()}
                >
                  {getDateTimeFormat(timeCreated)}
                </LabelMetaItem>,
                <LabelMetaItem
                  key="entity"
                  testId="entity-id"
                  label={Messages.featureStoreFeatureDefinition.labels.entity()}
                  status={entity.loading ? MetaItemStatus.Loading : MetaItemStatus.Normal}
                >
                  <Link> {entityReady?.displayName} </Link>
                </LabelMetaItem>,
              ],
            },
          ]}
        />
      </DetailTemplate>
    </>
  );
};
