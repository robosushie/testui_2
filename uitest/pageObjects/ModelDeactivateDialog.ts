import { ActionDialog } from "./ActionDialog";

export class ModelDeactivateDialog extends ActionDialog {
  public async deActivateModel(): Promise<void> {
    try {
      await this.clickPrimary();
    } catch (error) {
      console.error(`Deactivating the model failed with the following error: ${error.message}`);
    }
  }
}
