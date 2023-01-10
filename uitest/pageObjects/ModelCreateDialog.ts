import { By } from "selenium-webdriver";

import { ActionDialog } from "./ActionDialog";
import { CreateModelDetails, ModelProvenance } from "odsc-client";
import { getDriver, Wait } from "ui-testing-core";

const fs = require("fs");
const path = require("path");

export class ModelCreateDialog extends ActionDialog {
  /* Create Model Form Locators */
  private static NAME_FIELD: By = By.name("displayName");
  private static DESCRIPTION_FIELD: By = By.name("description");
  private static MODEL_ARTIFACT_FIELD: By = By.xpath(`//input[@type="file"]`);
  public static FILE_CONTAINER: By = By.xpath(`//div[contains(@class, "files-container")]`);
  private static PROVENANCE_REPO_URL_FIELD: By = By.name("repositoryUrl");
  private static PROVENANCE_GIT_COMMIT_FIELD: By = By.name("gitCommit");
  private static PROVENANCE_GIT_BRANCH_FIELD: By = By.name("gitBranch");
  private static PROVENANCE_SCRIPT_DIR_FIELD: By = By.name("scriptDir");
  private static PROVENANCE_TRAINING_SCRIPT_FIELD: By = By.name("trainingScript");

  private testDir: string = path.dirname(module.parent.filename);
  // Provide your local file path, which you want to upload as artifact.
  public MODEL_ARTIFACT_FILE_PATH: string =
    process.env.MODEL_ARTIFACT_FILE_PATH || `${this.testDir}/utils.ts`;

  /* Create Model Dialog Methods */

  public async createModel(
    modelDetails: CreateModelDetails,
    provenanceDetails: ModelProvenance
  ): Promise<void> {
    try {
      /* Enter model details*/
      await this.enterText(ModelCreateDialog.NAME_FIELD, modelDetails.displayName);
      await this.enterTextArea(ModelCreateDialog.DESCRIPTION_FIELD, modelDetails.description);

      /* Enter model artifact */
      const fileInput = await getDriver().findElement(ModelCreateDialog.MODEL_ARTIFACT_FIELD);
      await fileInput.sendKeys(this.MODEL_ARTIFACT_FILE_PATH);
      await Wait.waitForPresent(ModelCreateDialog.FILE_CONTAINER);

      /* Enter provenance details*/
      await this.enterText(
        ModelCreateDialog.PROVENANCE_REPO_URL_FIELD,
        provenanceDetails.repositoryUrl
      );
      await this.enterText(
        ModelCreateDialog.PROVENANCE_GIT_COMMIT_FIELD,
        provenanceDetails.gitCommit
      );
      await this.enterText(
        ModelCreateDialog.PROVENANCE_GIT_BRANCH_FIELD,
        provenanceDetails.gitBranch
      );
      await this.enterText(
        ModelCreateDialog.PROVENANCE_SCRIPT_DIR_FIELD,
        provenanceDetails.scriptDir
      );
      await this.enterText(
        ModelCreateDialog.PROVENANCE_TRAINING_SCRIPT_FIELD,
        provenanceDetails.trainingScript
      );

      await this.clickPrimary();
    } catch (error) {
      console.error(`Creating a model failed with the following error: ${error.message}`);
    }
  }

  public async isFileExist(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        return true;
      }
      console.error(`Given model artifact file path: ${filePath} is not exist`);
      return false;
    } catch (err) {
      console.error(`Checking model artifact file path: ${err.message}`);
    }
  }
}
