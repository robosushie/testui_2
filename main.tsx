import * as React from "react";
import * as ReactDOM from "react-dom";
import { Switch, Route, Redirect, withRouter } from "react-router";
import { ConnectedRouter } from "connected-react-router";
import { createBrowserHistory } from "history";
import {
  getPluginRuntime,
  getRouteClient,
  getCapabilityClient,
  getNavigationTreeClient,
  getLoggerClient,
  getContextClient,
} from "loom-plugin-runtime";
import {
  Provider,
  getLoomStartData,
  createStore,
  NavMenuContextProvider,
  PageError,
} from "oui-savant";
import { OuiConfiguration, ToastNotification } from "oui-react";
import { ThemeProvider } from "@oracle-cloud/framework";

// Constants
import { CONTAINER_ID, PLUGIN_NAME, ENABLE_PLUGIN_WHITELIST } from "pluginConstants";
import { ResourceNames } from "constants/resourceNames";
// Pages
import { ProjectDetails } from "projects/pages/ProjectDetails/ProjectDetails";
import { ProjectListingPage } from "projects/pages/ProjectList/ProjectListingPage";
import { NotebookDetails } from "notebooks/pages/NotebookDetails/NotebookDetails";
// Models
import apiClients from "apiClients";
import { AppState, getReducers } from "models/state";
// Import styles
import "assets/less/styles.less";

import getMiddleware from "models/getMiddleware";
// Localization
import * as Messages from "../codegen/Messages";
import {
  initCallback,
  changeLanguageCallback,
  missingKeyCallback,
} from "./utils/localizationUtils";
import { ModelDetails } from "./pages/ModelDetails/ModelDetails";
import { JobDetails } from "./pages/JobDetails/JobDetails";
import { JobRunDetails } from "./pages/JobRunDetails/JobRunDetails";

import { initChartPlugin } from "console-telemetry-chart";
import { ModelDeploymentDetails } from "pages/ModelDeploymentDetails/ModelDeploymentDetails";
import { WorkRequestDetails } from "pages/WorkRequestDetails/WorkRequestDetails";
import { PipelineDetails } from "./pipelines/pages/PipelineDetails/PipelineDetails";
import { PipelineRunDetails } from "./pipelines/components/PipelineRunDetails/PipelineRunDetails";
import { PipelineStepRunDetails } from "./pipelines/pages/PipelineStepRunDetails/PipelineStepRunDetails";
import { ModelVersionSetDetails } from "./pages/ModelVersionSetDetails/ModelVersionSetDetails";
import { PipelineStepDetails } from "./pipelines/components/PipelineStepDetails/PipelineStepDetails";
import { initLoggingPlugin } from "log-component";
import { ILauncher } from "cloudshell-session/build/session/launcher";
import { setupLauncher, Plugin } from "cloudshell-session";
import { ThemeNameProp } from "oui-configuration/dist/configuration/types";
import { FeatureStoreListingPage } from "./feature-stores/components/FeatureStoreList/FeatureStoreListingPage";
import { DataSourceListingPage } from "./feature-stores/components/DataSourceList/DataSourceListingPage";
import { FeatureStoreDetails } from "./feature-stores/pages/FeatureStoreDetails/FeatureStoreDetails";
import { FeatureDefinitionDetails } from "./feature-stores/pages/FeatureDefinitionDetails/FeatureDefinitionDetails";

import { initSaveAsStack } from "rms-stack-component";

export let launcher: ILauncher;

/**
 * Render the plugin.
 */
const render = (
  store: any,
  loomStartData: any,
  history: any,
  navTree: any,
  pluginUrl: any,
  isDataScienceEnabled: boolean,
  activeTheme: ThemeNameProp
) => {
  if (isDataScienceEnabled) {
    ReactDOM.render(
      <OuiConfiguration
        value={{ language: loomStartData.initialContext.locale, themeName: activeTheme }}
        themeProvider={ThemeProvider}
      >
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <NavMenuContextProvider navigation={navTree}>
              <Switch>
                <Route
                  exact={true}
                  path={`/${ResourceNames.projects}`}
                  component={ProjectListingPage}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.projects}/:projectId`}
                  component={ProjectDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.projects}/:projectId/:activeResourceName`}
                  component={ProjectDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.notebooks}/:notebookId/:activeResourceName?`}
                  component={NotebookDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.featureStore}/:featureStoreId/:activeResourceName`}
                  component={FeatureStoreDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.models}/:modelId`}
                  component={ModelDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.models}/:modelId/:activeResourceName`}
                  component={ModelDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.modelDeployments}/:modelDeploymentId/:activeResourceName?`}
                  component={ModelDeploymentDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.jobs}/:jobId/:activeResourceName?`}
                  component={withRouter((props) => (
                    <JobDetails {...props} launcher={launcher} />
                  ))}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.pipelines}/:pipelineId/:activeResourceName?`}
                  component={PipelineDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.pipelines}/:pipelineId/${ResourceNames.pipelineSteps}/:stepName`}
                  component={PipelineStepDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.pipelineRuns}/:pipelineRunId/:activeResourceName?`}
                  component={PipelineRunDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.jobRuns}/:jobRunId/:activeResourceName?`}
                  component={JobRunDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.pipelineRuns}/:pipelineRunId/${ResourceNames.pipelineStepRuns}/:stepName`}
                  component={PipelineStepRunDetails}
                />
                <Route
                  path={`/${ResourceNames.workRequests}/:workRequestId/:activeResourceName?`}
                  component={WorkRequestDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.modelVersionSets}/:modelVersionSetId`}
                  component={ModelVersionSetDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.modelVersionSets}/:modelVersionSetId/:activeResourceName?`}
                  component={ModelVersionSetDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.featureStore}`}
                  component={FeatureStoreListingPage}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.featureStore}/:featureStoreId`}
                  component={FeatureStoreDetails}
                />
                <Route
                  exact={true}
                  path={`/${ResourceNames.featureStoreFeatureDefinition}/:featureDefinitionId/:activeResourceName?`}
                  component={FeatureDefinitionDetails}
                />
                {/*<Route*/}
                {/*  exact={true}*/}
                {/*  path={`/${ResourceNames.featureStoreFeatureDefinition}/:featureDefinitionId`}*/}
                {/*  component={FeatureDefinitionDetails}*/}
                {/*/>*/}
                <Route
                  exact={true}
                  path={`/${ResourceNames.datasources}`}
                  component={DataSourceListingPage}
                />
                <Redirect from="/*" to={pluginUrl(ResourceNames.projects)} exact={true} />
              </Switch>
            </NavMenuContextProvider>
          </ConnectedRouter>
          <ToastNotification />
        </Provider>
      </OuiConfiguration>,
      document.getElementById(CONTAINER_ID)
    );
  } else {
    ReactDOM.render(
      <PageError error={Messages.errors.regionUnavailable()} />,
      document.getElementById(CONTAINER_ID)
    );
  }
};

/**
 * Initialize the plugin.
 */
const init = async () => {
  const history = createBrowserHistory();

  launcher = setupLauncher(Plugin.DATA_SCIENCE, getPluginRuntime);

  const runtime = getPluginRuntime();
  await runtime.start({ history, listeners: launcher.getListeners() });

  const middleware = getMiddleware(history);
  const loomStartData = await getLoomStartData();

  Messages.onInit(initCallback);
  await Messages.init(loomStartData.initialContext.locale);
  Messages.onLanguageChanged(changeLanguageCallback);
  Messages.onMissingKey(missingKeyCallback);

  const store = createStore<AppState>({
    apiClients,
    middleware,
    loomStartData,
    reducers: getReducers(history),
    pluginName: PLUGIN_NAME,
  }) as any;

  await initChartPlugin({
    pluginRuntime: runtime,
    changeRoute: (route: string) => getRouteClient().changeRoute(route),
    initialLocale: loomStartData.initialContext.locale,
  });

  await initLoggingPlugin({
    initialLocale: loomStartData.initialContext.locale,
    pluginRuntime: runtime,
    pluginContext: getContextClient(),
    loggerClient: getLoggerClient,
    routeClient: getRouteClient,
  });

  await initSaveAsStack({
    store,
    pluginRuntime: runtime,
    initialLocale: loomStartData.initialContext.locale,
    pluginContext: getContextClient(),
  });

  const pluginUrl = (path: string) => {
    return new URL(getRouteClient().makePluginUrl(path));
  };

  // Fetching plugin navigation from Loom
  const navTree = await getNavigationTreeClient().getSelfNavigationTree();
  const activeTheme = store.getState().globalState.capabilities["active-theme"];

  const capabilities = getCapabilityClient();
  const consoleCapabilities = await capabilities.getCapability();
  let isDataScienceEnabled = !!consoleCapabilities[ENABLE_PLUGIN_WHITELIST];

  capabilities.onCapabilityChange(async () => {
    const newCapabilities = await capabilities.getCapability();
    isDataScienceEnabled = !!newCapabilities[ENABLE_PLUGIN_WHITELIST];
    render(store, loomStartData, history, navTree, pluginUrl, isDataScienceEnabled, activeTheme);
  });

  render(store, loomStartData, history, navTree, pluginUrl, isDataScienceEnabled, activeTheme);
};

init();
