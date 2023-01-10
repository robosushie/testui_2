import { ActionDialog } from "./ActionDialog";
import { By } from "selenium-webdriver";

export class NotebookShutdownDialog extends ActionDialog {
  public CONFIRMATION_TEXT_FIELD: By = By.name("confirmedDelete");
  public async delete(): Promise<void> {
    try {
      await this.clickPrimary();
    } catch (error) {
      console.error(
        `Selecting the notebook shutdown dialog button failed with the following error: ${error.message}`
      );
    }
  }
}
