import { By } from "selenium-webdriver";

import { ActionDialog } from "./ActionDialog";

export class NotebookEditDialog extends ActionDialog {
  /* Edit Notebook Form Locators */
  public static NAME_FIELD: By = By.name("displayName");

  /* Update Notebook Dialog Methods */

  public async updateNotebook(displayName: string): Promise<void> {
    try {
      /* Enter Notebook details*/
      await this.enterText(NotebookEditDialog.NAME_FIELD, displayName);

      await this.clickPrimary();
    } catch (error) {
      console.error(`Updating a Notebook failed with the following error: ${error.message}`);
    }
  }
}
