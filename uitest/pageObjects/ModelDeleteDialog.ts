import { ActionDialog } from "./ActionDialog";
import { By } from "selenium-webdriver";

export class ModelDeleteDialog extends ActionDialog {
  public CONFIRMATION_TEXT_FIELD: By = By.name("confirmedDelete");

  public async deleteModel(): Promise<void> {
    try {
      await this.clickPrimary();
    } catch (error) {
      console.error(`Deleting the model failed with the following error: ${error.message}`);
    }
  }
}
