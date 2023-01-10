import { TimeInterval } from "oui-savant";

import { LifecycleState } from "../src/constants/lifecycleStates";
import { clickResourceLink, init, isActionButtonEnabled } from "./helpers/utils";
import { ModelDetails } from "./pageObjects/ModelDetails";
import { CreateModelDetails, ModelProvenance, UpdateModelDetails } from "odsc-client";
import { ModelList } from "./pageObjects/ModelList";
import { ModelEditDialog } from "./pageObjects/ModelEditDialog";
import { ListActionMenu } from "./pageObjects/ListActionMenu";
import { ModelDeactivateDialog } from "./pageObjects/ModelDeactivateDialog";
import { ModelActivateDialog } from "./pageObjects/ModelActivateDialog";
import { ModelDownloadArtifactDialog } from "./pageObjects/ModelDownloadArtifactDialog";
import { LOGGED_IN_USER, PROJECT_ID_FOR_NOTEBOOK_AND_MODEL } from "./helpers/constants";
import { deleteModel, createModel } from "./helpers/actions";

beforeAll(init);

describe.skip("Models UI Tests", () => {
  // Currently skipping these tests for ci: https://jira.oci.oraclecorp.com/browse/ODSC-7469
  let newModelOcid: string = undefined;
  const username = LOGGED_IN_USER;
  const projectOcid = PROJECT_ID_FOR_NOTEBOOK_AND_MODEL;
  const modelName = `model${Date.now()}`;

  /*Model Details*/
  const modelDetails = {} as CreateModelDetails;
  modelDetails.displayName = modelName;
  modelDetails.description = "UI Testing Model Desc";

  /*Model Provenance Details*/
  const provenanceDetails = {} as ModelProvenance;
  provenanceDetails.repositoryUrl = "http://github.com/my-org/my-repo";
  provenanceDetails.gitCommit = "265ggf4";
  provenanceDetails.gitBranch = "master";
  provenanceDetails.scriptDir = "oss://my-bucket/attrition/scripts/my-model.tar";
  provenanceDetails.trainingScript = "my-favorite-notebook.ipynb";

  describe("Create Model Tests", () => {
    it(
      "User can visit model list on project detail page that contains enabled Create Model button",
      async () => {
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();
        expect(await isActionButtonEnabled(modelListPage.CREATE_MODEL_BUTTON)).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can create a model & be redirected to newly created model's detail page",
      async () => {
        newModelOcid = await createModel(projectOcid, modelDetails, provenanceDetails, username);
      },
      TimeInterval.xl
    );
  });

  describe("Dependent On Create Model Tests", () => {
    it(
      "Check actions for ACTIVE model in model list",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();

        // Open Action menu in List view
        const listActionMenu = new ListActionMenu();
        await listActionMenu.openActionMenu(newModelOcid);

        // Check all actions are enabled for Active model in Model List
        expect(await listActionMenu.isMenuActionEnabled("View Details")).toBeTruthy();

        expect(await listActionMenu.isMenuActionEnabled("Edit")).toBeTruthy();

        expect(
          await listActionMenu.isMenuActionEnabled("DownloadStepArtifact Model Artifact")
        ).toBeTruthy();

        expect(await listActionMenu.isMenuActionEnabled("Deactivate")).toBeTruthy();

        expect(await listActionMenu.isMenuActionEnabled("Delete")).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can click on a model link from the list page and navigate to the details page",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();

        await clickResourceLink(newModelOcid);

        const modelDetailsPage = new ModelDetails();
        await modelDetailsPage.waitForPresent();
        expect(await modelDetailsPage.isPageLoaded()).toBeTruthy();
        expect(await modelDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.NAME)).toBe(
          modelDetails.displayName
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.MODEL_DETAILS_DESC)).toBe(
          modelDetails.description
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_REPO_URL)).toBe(
          provenanceDetails.repositoryUrl
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_GIT_COMMIT)).toBe(
          provenanceDetails.gitCommit
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_GIT_BRANCH)).toBe(
          provenanceDetails.gitBranch
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_SCRIPT_DIR)).toBe(
          provenanceDetails.scriptDir
        );
        expect(
          await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_TRAINING_SCRIPT)
        ).toBe(provenanceDetails.trainingScript);
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.CREATED_BY)).toBe(username);

        expect(await isActionButtonEnabled(modelDetailsPage.EDIT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DEACTIVATE_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.APPLY_TAGS_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DELETE_BUTTON)).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can click on a view details button in action menu from the list page and navigate to the details page",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();

        const listActionMenu = new ListActionMenu();
        await listActionMenu.openActionMenu(newModelOcid);

        // Check action is enabled or not before click on it
        expect(await listActionMenu.isMenuActionEnabled("View Details")).toBeTruthy();
        await listActionMenu.clickMenuAction("View Details");

        const modelDetailsPage = new ModelDetails();
        await modelDetailsPage.waitForPresent();
        expect(await modelDetailsPage.isPageLoaded()).toBeTruthy();
        expect(await modelDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.NAME)).toBe(
          modelDetails.displayName
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.MODEL_DETAILS_DESC)).toBe(
          modelDetails.description
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_REPO_URL)).toBe(
          provenanceDetails.repositoryUrl
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_GIT_COMMIT)).toBe(
          provenanceDetails.gitCommit
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_GIT_BRANCH)).toBe(
          provenanceDetails.gitBranch
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_SCRIPT_DIR)).toBe(
          provenanceDetails.scriptDir
        );
        expect(
          await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_TRAINING_SCRIPT)
        ).toBe(provenanceDetails.trainingScript);
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.CREATED_BY)).toBe(username);

        expect(await isActionButtonEnabled(modelDetailsPage.EDIT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DEACTIVATE_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.APPLY_TAGS_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DELETE_BUTTON)).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can Deactivate model from the model list page",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();

        const listActionMenu = new ListActionMenu();
        await listActionMenu.openActionMenu(newModelOcid);

        // Check Deactivate btn is enabled or not before click on it
        expect(await listActionMenu.isMenuActionEnabled("Deactivate")).toBeTruthy();
        await listActionMenu.clickMenuAction("Deactivate");

        const modelDeactivateDialog = new ModelDeactivateDialog();
        expect(await modelDeactivateDialog.isOpen()).toBeTruthy();
        await modelDeactivateDialog.deActivateModel();
        expect(await modelDeactivateDialog.isClosed()).toBeTruthy();

        expect(await modelListPage.isPageLoaded()).toBeTruthy();
        expect(await modelListPage.waitForColumnText(newModelOcid, 2, "Inactive")).toBeTruthy();

        expect(await listActionMenu.isMenuActionEnabled("View Details")).toBeTruthy();
        expect(await listActionMenu.isMenuActionEnabled("Edit")).toBeTruthy();
        expect(
          await listActionMenu.isMenuActionEnabled("DownloadStepArtifact Model Artifact")
        ).toBeTruthy();
        expect(await listActionMenu.isMenuActionEnabled("Activate")).toBeTruthy();
        expect(await listActionMenu.isMenuActionEnabled("Delete")).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can Activate model from the model list page",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();

        const listActionMenu = new ListActionMenu();
        await listActionMenu.openActionMenu(newModelOcid);

        // Check Deactivate btn is enabled or not before click on it
        expect(await listActionMenu.isMenuActionEnabled("Activate")).toBeTruthy();
        await listActionMenu.clickMenuAction("Activate");

        const modelActivateDialog = new ModelActivateDialog();
        expect(await modelActivateDialog.isOpen()).toBeTruthy();
        await modelActivateDialog.activateModel();
        expect(await modelActivateDialog.isClosed()).toBeTruthy();

        expect(await modelListPage.isPageLoaded()).toBeTruthy();
        expect(await modelListPage.waitForColumnText(newModelOcid, 2, "Active")).toBeTruthy();

        expect(await listActionMenu.isMenuActionEnabled("View Details")).toBeTruthy();
        expect(await listActionMenu.isMenuActionEnabled("Edit")).toBeTruthy();
        expect(
          await listActionMenu.isMenuActionEnabled("DownloadStepArtifact Model Artifact")
        ).toBeTruthy();
        expect(await listActionMenu.isMenuActionEnabled("Deactivate")).toBeTruthy();
        expect(await listActionMenu.isMenuActionEnabled("Delete")).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can DownloadStepArtifact model artifact from the model list page",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();

        const listActionMenu = new ListActionMenu();
        await listActionMenu.openActionMenu(newModelOcid);

        const modelDownloadArtifactDialog = new ModelDownloadArtifactDialog();
        // Check DownloadStepArtifact btn is enabled or not before click on it
        expect(
          await listActionMenu.isMenuActionEnabled("DownloadStepArtifact Model Artifact")
        ).toBeTruthy();
        await listActionMenu.clickMenuAction("DownloadStepArtifact Model Artifact");

        expect(await modelDownloadArtifactDialog.isOpen()).toBeTruthy();
        expect(await modelDownloadArtifactDialog.isClosed()).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can DownloadStepArtifact model artifact from the model Details page",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelDetailsPage = new ModelDetails(newModelOcid);
        await modelDetailsPage.navigate();
        expect(await modelDetailsPage.isPageLoaded()).toBeTruthy();
        expect(await modelDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();

        const modelDownloadArtifactDialog = new ModelDownloadArtifactDialog();
        // Check DownloadStepArtifact btn is enabled or not before click on it
        expect(await isActionButtonEnabled(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON)).toBeTruthy();

        await modelDetailsPage.clickActionButton(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON);
        expect(await modelDownloadArtifactDialog.isOpen()).toBeTruthy();
        expect(await modelDownloadArtifactDialog.isClosed()).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can update model and provenance from model detail page",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelDetailsPage = new ModelDetails(newModelOcid);
        await modelDetailsPage.navigate();
        await modelDetailsPage.waitForPresent();
        expect(await modelDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();

        expect(await isActionButtonEnabled(modelDetailsPage.EDIT_BUTTON)).toBeTruthy();

        modelDetails.description = "Update Model Description";
        provenanceDetails.gitCommit = "76rte6734";

        provenanceDetails.gitBranch = "origin/master";

        await modelDetailsPage.clickActionButton(modelDetailsPage.EDIT_BUTTON);

        const modelEditPage = new ModelEditDialog();
        expect(await modelEditPage.isOpen()).toBeTruthy();

        await modelEditPage.updateModel(modelDetails as UpdateModelDetails, provenanceDetails);
        expect(await modelEditPage.isClosed()).toBeTruthy();

        await modelDetailsPage.navigate();
        await modelDetailsPage.waitForPresent();
        expect(await modelDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();

        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.NAME)).toBe(
          modelDetails.displayName
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.MODEL_DETAILS_DESC)).toBe(
          modelDetails.description
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_REPO_URL)).toBe(
          provenanceDetails.repositoryUrl
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_GIT_COMMIT)).toBe(
          provenanceDetails.gitCommit
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_GIT_BRANCH)).toBe(
          provenanceDetails.gitBranch
        );
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_SCRIPT_DIR)).toBe(
          provenanceDetails.scriptDir
        );
        expect(
          await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_TRAINING_SCRIPT)
        ).toBe(provenanceDetails.trainingScript);
        expect(await modelDetailsPage.getFieldValue(modelDetailsPage.CREATED_BY)).toBe(username);
      },
      TimeInterval.xl
    );

    it(
      "User can Deactivate a model from Model Details page",
      async () => {
        expect(newModelOcid).toBeDefined();
        // navigate to model details page
        const modelDetailsPage = new ModelDetails(newModelOcid);

        await modelDetailsPage.navigate();
        expect(await modelDetailsPage.isPageLoaded()).toBeTruthy();
        await modelDetailsPage.clickActionButton(modelDetailsPage.DEACTIVATE_BUTTON);

        const modelDeactivateDialog = new ModelDeactivateDialog();
        expect(await modelDeactivateDialog.isOpen()).toBeTruthy();
        await modelDeactivateDialog.deActivateModel();
        expect(await modelDeactivateDialog.isClosed()).toBeTruthy();

        expect(await modelDetailsPage.waitForState(LifecycleState.INACTIVE)).toBeTruthy();

        expect(await isActionButtonEnabled(modelDetailsPage.EDIT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.ACTIVATE_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DELETE_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.APPLY_TAGS_BUTTON)).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can Activate a model from Model Details page",
      async () => {
        expect(newModelOcid).toBeDefined();
        // navigate to model details page
        const modelDetailsPage = new ModelDetails(newModelOcid);

        await modelDetailsPage.navigate();
        expect(await modelDetailsPage.isPageLoaded()).toBeTruthy();
        await modelDetailsPage.clickActionButton(modelDetailsPage.ACTIVATE_BUTTON);

        const modelActivateDialog = new ModelActivateDialog();
        expect(await modelActivateDialog.isOpen()).toBeTruthy();
        await modelActivateDialog.activateModel();
        expect(await modelActivateDialog.isClosed()).toBeTruthy();

        expect(await modelDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();

        expect(await isActionButtonEnabled(modelDetailsPage.EDIT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DEACTIVATE_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.DELETE_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(modelDetailsPage.APPLY_TAGS_BUTTON)).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can delete a model",
      async () => {
        await deleteModel(newModelOcid);
      },
      TimeInterval.xl
    );

    it(
      "Check actions for DELETED model in model list",
      async () => {
        expect(newModelOcid).toBeDefined();
        const modelListPage = new ModelList(projectOcid);
        await modelListPage.navigate();
        expect(await modelListPage.isPageLoaded()).toBeTruthy();

        const listActionMenu = new ListActionMenu();
        // Open Action menu in List view
        await listActionMenu.openActionMenu(newModelOcid);

        // Check all actions are enabled for Active model in Model List
        expect(await listActionMenu.isMenuActionEnabled("View Details")).toBeTruthy();

        expect(await listActionMenu.isMenuActionEnabled("Activate")).toBeFalsy();

        expect(await listActionMenu.isMenuActionEnabled("Edit")).toBeFalsy();

        expect(
          await listActionMenu.isMenuActionEnabled("DownloadStepArtifact Model Artifact")
        ).toBeFalsy();

        expect(await listActionMenu.isMenuActionEnabled("Delete")).toBeFalsy();
      },
      TimeInterval.xl
    );
  });
});
