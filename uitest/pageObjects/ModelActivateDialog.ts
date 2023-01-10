import { ActionDialog } from "./ActionDialog";

export class ModelActivateDialog extends ActionDialog {
  public async activateModel(): Promise<void> {
    try {
      await this.clickPrimary();
    } catch (error) {
      console.error(`Activating the model failed with the following error: ${error.message}`);
    }
  }
}
