import { isActionButtonEnabled } from "./utils";
import { LifecycleState } from "constants/lifecycleStates";
import { ModelDeleteDialog } from "../pageObjects/ModelDeleteDialog";
import { ModelDetails } from "../pageObjects/ModelDetails";
import { BrowserUtils } from "ui-testing-core";
import { CreateModelDetails, ModelProvenance } from "odsc-client/dist/odsc-client";
import { LOGGED_IN_USER } from "./constants";
import { ModelList } from "../pageObjects/ModelList";
import { ModelCreateDialog } from "../pageObjects/ModelCreateDialog";

const createModel = async (
  projectOcid: string,
  modelDetails: CreateModelDetails,
  provenanceDetails: ModelProvenance = {
    repositoryUrl: "http://github.com/my-org/my-repo",
    gitCommit: "265ggf4",
    gitBranch: "master",
    scriptDir: "oss://my-bucket/attrition/scripts/my-model.tar",
    trainingScript: "my-favorite-notebook.ipynb",
  },
  username: string = LOGGED_IN_USER
): Promise<string> => {
  const modelListPage = new ModelList(projectOcid);

  await modelListPage.navigate();
  expect(await modelListPage.isPageLoaded()).toBeTruthy();
  await modelListPage.clickCreateModelButton();

  const modelCreateDialog = new ModelCreateDialog();
  expect(await modelCreateDialog.isOpen()).toBeTruthy();

  // check if MODEL_ARTIFACT_FILE_PATH constant has a valid value
  expect(
    await modelCreateDialog.isFileExist(modelCreateDialog.MODEL_ARTIFACT_FILE_PATH)
  ).toBeTruthy();

  await modelCreateDialog.createModel(modelDetails, provenanceDetails);
  expect(await modelCreateDialog.isClosed()).toBeTruthy();

  const modelDetailsPage = new ModelDetails();
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
  expect(await modelDetailsPage.getFieldValue(modelDetailsPage.PROVENANCE_TRAINING_SCRIPT)).toBe(
    provenanceDetails.trainingScript
  );
  expect(await modelDetailsPage.getFieldValue(modelDetailsPage.CREATED_BY)).toBe(username);

  expect(await isActionButtonEnabled(modelDetailsPage.EDIT_BUTTON)).toBeTruthy();
  expect(await isActionButtonEnabled(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON)).toBeTruthy();
  expect(await isActionButtonEnabled(modelDetailsPage.DEACTIVATE_BUTTON)).toBeTruthy();
  expect(await isActionButtonEnabled(modelDetailsPage.APPLY_TAGS_BUTTON)).toBeTruthy();
  expect(await isActionButtonEnabled(modelDetailsPage.DELETE_BUTTON)).toBeTruthy();

  const url = await BrowserUtils.getCurrentURL();
  const newModelOcid = url.split("/models/")[1].split("?")[0];
  expect(newModelOcid.includes("ocid1.")).toBeTruthy();
  expect(await modelDetailsPage.getModelIdValue()).toContain(newModelOcid);
  return newModelOcid;
};

const deleteModel = async (newModelOcid: string) => {
  expect(newModelOcid).toBeDefined();
  // setup page objects and vars

  // navigate to model details page
  const modelDetailsPage = new ModelDetails(newModelOcid);

  await modelDetailsPage.navigate();
  expect(await modelDetailsPage.isPageLoaded()).toBeTruthy();
  await modelDetailsPage.clickActionButton(modelDetailsPage.DELETE_BUTTON);

  const modelDeleteDialog = new ModelDeleteDialog();
  expect(await modelDeleteDialog.isOpen()).toBeTruthy();
  await modelDeleteDialog.enterText(modelDeleteDialog.CONFIRMATION_TEXT_FIELD, "delete");
  await modelDeleteDialog.deleteModel();

  expect(await modelDeleteDialog.isClosed()).toBeTruthy();

  expect(await modelDetailsPage.waitForState(LifecycleState.DELETED)).toBeTruthy();

  expect(await isActionButtonEnabled(modelDetailsPage.EDIT_BUTTON)).toBeFalsy();
  expect(await isActionButtonEnabled(modelDetailsPage.DOWNLOAD_ARTIFACT_BUTTON)).toBeFalsy();
  expect(await isActionButtonEnabled(modelDetailsPage.ACTIVATE_BUTTON)).toBeFalsy();
  expect(await isActionButtonEnabled(modelDetailsPage.DELETE_BUTTON)).toBeFalsy();
  expect(await isActionButtonEnabled(modelDetailsPage.APPLY_TAGS_BUTTON)).toBeFalsy();
};

export { createModel, deleteModel };
