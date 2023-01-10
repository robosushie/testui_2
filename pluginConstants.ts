/**
 * These constants are used for the plugin's runtime. Changing some settings here might require you to modify the
 * webpack.plugin.constants.js file to avoid build issues.
 */

export const PLUGIN_NAME = "data-science";
export const SERVICE_NAME = "datascience";
export const CONTAINER_ID = "data-science-wrapper";
export const ENABLE_PLUGIN_WHITELIST = "console-datascience-whitelist";
export const CONTEXTUAL_SUPPORT_WHITELIST = "plugin-contextual-support";
export const SUPPORT_CONTEXT_SCHEMA_NAME = "odsc";
export const MODEL_DEPLOY_ENABLED_WHITELIST = "model-deploy-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const MODEL_DEPLOY_STREAMING_WHITELIST = "model-deploy-streaming-enabled";
export const MODEL_DEPLOY_MONITORING_WHITELIST = "model-deploy-mon-one-enabled";
export const MODEL_DEPLOY_FLEX_SHAPE_SUPPORT_WHITELIST = "model-deploy-flex-shape-support-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const MODEL_DEPLOY_BREEZE_SUPPORT_WHITELIST = "model-deploy-breeze-support-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const MODEL_DEPLOY_BYOC_WHITELIST = "model-deploy-byoc-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const JOBS_ENABLED_WHITELIST = "jobs-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const JOBS_FAST_LAUNCH_ENABLED_WHITELIST = "jobs-fast-launch-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const JOBS_MONITORING_WHITELIST = "jobs-mon-one-enabled";
export const FS_ENDPOINT = "fs-endpoint";
export const JOBS_NEW_SHAPE_SUPPORT_ENABLED_WHITELIST = "jobs-new-shapes-support-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const JOBS_FLEX_ENABLED_WHITELIST = "jobs-flex-enabled"; // Used to control breeze components
export const JOBS_FLEX_A1_ENABLED_WHITELIST = "jobs-flex-a1-enabled"; // Used to control breeze components
export const MODEL_STORE_V3_ENABLED_WHITELIST = "model-store-v3-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const PIPELINES_ENABLED_WHITELIST = "pipelines-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const NOTEBOOK_MANAGED_EGRESS_ENABLED_WHITELIST = "notebooks-managed-egress-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const NOTEBOOK_FLEX_A1_ENABLED_WHITELIST = "notebooks-flex-a1-enabled"; // Used to control breeze components
export const JOBS_MANAGED_EGRESS_ENABLED_WHITELIST = "jobs-managed-egress-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const JOBS_SERVICE_BLOCK_STORAGE_USAGE = 100; // block storage size used by Data Science service, used in info messages in Jobs
export const DS_NON_PROD_ENDPOINT = "ds-non-prod-endpoint";
export const DS_NON_PROD_TELEMETRY_NAMESPACE = "ds-non-prod-telemetry-namespace";
export const DS_NON_PROD_JOBRUN_TELEMETRY_NAMESPACE = "ds-non-prod-jobrun-telemetry-namespace";
export const NOTEBOOK_RUNTIME_CONFIGURATION_WHITELIST = "notebooks-config-variables-enabled"; // TODO: Remove this when all tenancies are whitelisted
export const LOGGING_OPERATION = "logging-console-operation";
export const JOBS_CLOUD_EDITOR_ENABLED_WHITELIST = "jobs-cloud-editor-enabled";
