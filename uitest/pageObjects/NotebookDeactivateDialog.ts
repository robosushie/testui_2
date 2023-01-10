import { ActionDialog } from "./ActionDialog";

export class NotebookDeactivateDialog extends ActionDialog {
  public async deactivateNotebook(): Promise<void> {
    try {
      await this.clickPrimary();
    } catch (error) {
      console.error(`Deactivating the notebook failed with the following error: ${error.message}`);
    }
  }
}
