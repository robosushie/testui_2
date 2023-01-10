import { By } from "selenium-webdriver";

import { ActionDialog } from "./ActionDialog";
import { ModelProvenance, UpdateModelDetails } from "odsc-client";

export class ModelEditDialog extends ActionDialog {
  /* Create Model Form Locators */
  public NAME_FIELD: By = By.name("displayName");
  public DESCRIPTION_FIELD: By = By.name("description");
  public PROVENANCE_REPO_URL_FIELD: By = By.name("repositoryUrl");
  public PROVENANCE_GIT_COMMIT_FIELD: By = By.name("gitCommit");
  public PROVENANCE_GIT_BRANCH_FIELD: By = By.name("gitBranch");
  public PROVENANCE_SCRIPT_DIR_FIELD: By = By.name("scriptDir");
  public PROVENANCE_TRAINING_SCRIPT_FIELD: By = By.name("trainingScript");

  /* Update Model Dialog Methods */

  public async updateModel(
    modelDetails: UpdateModelDetails,
    provenanceDetails: ModelProvenance
  ): Promise<void> {
    try {
      /* Enter model details*/
      await this.enterText(this.NAME_FIELD, modelDetails.displayName);
      await this.enterTextArea(this.DESCRIPTION_FIELD, modelDetails.description);

      /* Enter provenance details*/
      await this.enterText(this.PROVENANCE_REPO_URL_FIELD, provenanceDetails.repositoryUrl);
      await this.enterText(this.PROVENANCE_GIT_COMMIT_FIELD, provenanceDetails.gitCommit);
      await this.enterText(this.PROVENANCE_GIT_BRANCH_FIELD, provenanceDetails.gitBranch);
      await this.enterText(this.PROVENANCE_SCRIPT_DIR_FIELD, provenanceDetails.scriptDir);
      await this.enterText(this.PROVENANCE_TRAINING_SCRIPT_FIELD, provenanceDetails.trainingScript);

      await this.clickPrimary();
    } catch (error) {
      console.error(`Updating a model failed with the following error: ${error.message}`);
    }
  }
}
