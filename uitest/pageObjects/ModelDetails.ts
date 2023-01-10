import { TimeInterval } from "oui-savant";
import { BasePluginPage, Actions, Wait, getConfig } from "ui-testing-core";
import { By } from "selenium-webdriver";

import { byPageXpath, byTestIdXPath } from "../helpers/utils";

export class ModelDetails extends BasePluginPage<ModelDetails> {
  protected pageUrl: string = "";
  protected pageLoadedElement: By = ModelDetails.MODEL_NAME_BREADCRUMB;
  protected isLegacyPlugin: boolean = false;

  constructor(ocid?: string) {
    super();
    this.pageUrl = this.pageUrl = `${getConfig("driverInfo").pluginName}models/${ocid}?${
      getConfig("driverInfo").pluginOverride
    }`;
  }

  /* Model Details Page Locators */
  private static MODEL_NAME_BREADCRUMB: By = byPageXpath(
    "//ul[contains(@class, 'oui-breadcrumb')]/li[4]"
  );

  public NAME: By = byPageXpath("//h1");
  public DELETE_BUTTON: By = By.xpath('//button[text()="Delete"]');
  public EDIT_BUTTON: By = By.xpath('//button[text()="Edit"]');
  public ACTIVATE_BUTTON: By = By.xpath('//button[text()="Activate"]');
  public DEACTIVATE_BUTTON: By = By.xpath('//button[text()="Deactivate"]');
  public DOWNLOAD_ARTIFACT_BUTTON: By = By.xpath(
    '//button[text()="DownloadStepArtifact Model Artifact"]'
  );
  public APPLY_TAGS_BUTTON: By = By.xpath('//button[text()="Add tags"]');
  public MODEL_ID: By = byTestIdXPath("model-detail-id", "/span");
  public SHOW_OCID_LINK: By = byTestIdXPath("model-detail-id", "/span/span/span[1]");
  public CREATED_BY: By = byTestIdXPath("model-detail-created-by", "/span");
  public MODEL_DETAILS_DESC: By = byTestIdXPath("model-detail-desc", "/span");
  public PROVENANCE_REPO_URL: By = byTestIdXPath("provenance-repo-url", "/span");
  public PROVENANCE_GIT_COMMIT: By = byTestIdXPath("provenance-git-commit", "/span");
  public PROVENANCE_GIT_BRANCH: By = byTestIdXPath("provenance-git-branch", "/span");
  public PROVENANCE_SCRIPT_DIR: By = byTestIdXPath("provenance-script-dir", "/span");
  public PROVENANCE_TRAINING_SCRIPT: By = byTestIdXPath("provenance-training-script", "/span");
  protected static STATE: By = byPageXpath("//p[contains(@class, 'oui-status-badge')]");

  public async waitForPresent(): Promise<any> {
    // Use the breadcrumb as the definitive element for testing when the page is present.
    // This is more dependable than using the title / h1 element, as both the project
    // details page to model details page have this element.
    return Wait.waitForPresent(ModelDetails.MODEL_NAME_BREADCRUMB, TimeInterval.md);
  }

  public async getFieldValue(by: By): Promise<string> {
    try {
      return await Actions.getText(by);
    } catch (error) {
      console.error(
        `Getting the ${by.toString()} value failed with the following error: ${error.message}`
      );
    }
  }

  public async getModelIdValue(): Promise<string> {
    try {
      await Actions.doClick(this.SHOW_OCID_LINK);
      return await Actions.getText(this.MODEL_ID);
    } catch (error) {
      console.error(`Getting the model id value failed with the following error: ${error.message}`);
    }
  }

  public async waitForState(state: string): Promise<boolean> {
    try {
      await Wait.waitForText(ModelDetails.STATE, state, true, TimeInterval.xl);
      return true;
    } catch (error) {
      console.error(
        `Waiting for model detail page to reach ${state} state failed: ${error.message}`
      );
    }
  }

  public async clickActionButton(by: By): Promise<void> {
    try {
      await Actions.doClick(by);
    } catch (error) {
      console.error(
        `Click the  ${by.toString()} button failed with the following error: ${error.message}`
      );
    }
  }
}
