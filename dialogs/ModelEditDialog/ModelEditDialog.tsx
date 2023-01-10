import * as React from "react";
import { useMutation, useQuery, useConsoleState, FormRemoteSubmitButton } from "oui-savant";
import {
  Field,
  TextInput,
  Textarea,
  Form,
  FormValues,
  FormErrors,
  FieldSet,
  ErrorText,
  MetaItemStatus,
  Modal,
  FormRef,
} from "oui-react";

import * as Messages from "../../../codegen/Messages";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { validateField, trimDisplayName } from "../../utils/formUtils";
import apiClients from "../../apiClients";
import { getDialogBoxHelpLink, MANAGE_MODELS } from "../../utils/docUtils";
import { Examples } from "constants/examples";

interface Props {
  closeHandler(): void;
  modelRefresh(): void;
  provenanceRefresh?(): void;
  modelId: string;
}

export const ModelEditDialog: React.FC<Props> = ({
  modelId,
  closeHandler,
  modelRefresh,
  provenanceRefresh,
}) => {
  const [isProvenanceSectionCollapsed, setProvenanceSectionCollapsed] = React.useState(false);
  const [form, setForm] = React.useState<Form>(null);
  const [ref, setRef] = React.useState<FormRef>(undefined);

  const { compartments } = useConsoleState();

  const model = useQuery({
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
    },
  });
  const modelReady = !model.error && model.response && model.response.data;

  const provenance = useQuery({
    wait: !provenanceRefresh,
    method: apiClients.odscApi.getModelProvenance,
    options: {
      args: { modelId },
    },
  });
  const provenanceReady = !provenance.error && provenance.response && provenance.response.data;

  let compartmentName = MetaItemStatus.Loading as string;
  if (modelReady) {
    const { compartmentId } = modelReady;
    const compartment = compartments.find((compartment) => compartment.id === compartmentId);
    compartmentName = compartment ? compartment.name : compartmentId;
  }

  const modelMutation = useMutation({
    method: apiClients.odscApi.updateModel,
    onSuccess: () => {
      modelRefresh();
      // If provenance is not already created then you can't update also
      // TODO Need to rethink how are we going to handle better this scenario
      if (provenance.error && provenance.error.status.toString() === "400") {
        closeHandler();
      } else {
        callUpdateProvenance();
      }
    },
  });

  const provenanceMutation = useMutation({
    method: apiClients.odscApi.updateModelProvenance,
    onSuccess: () => {
      provenanceRefresh && provenanceRefresh();
      closeHandler();
    },
  });

  /**
   * Handle the submit event from the form.
   */
  const onSubmit = (form: Form): void => {
    setForm(form);
    const values = form.getValues();
    modelMutation.reset();
    modelMutation.invoke({
      modelId,
      updateModelDetails: {
        displayName: trimDisplayName(values.displayName as string),
        description: values.description as string,
      },
    });
  };

  // Update model provenance details call
  const callUpdateProvenance = (): void => {
    // Get provenance values from the form
    // to be updated
    const values = form.getValues();
    provenanceMutation.reset();
    provenanceMutation.invoke({
      modelId,
      updateModelProvenanceDetails: {
        repositoryUrl: values.repositoryUrl as string,
        gitCommit: values.gitCommit as string,
        gitBranch: values.gitBranch as string,
        scriptDir: values.scriptDir as string,
        trainingScript: values.trainingScript as string,
      },
    });
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    displayName: validateField({ value: values.displayName, required: true, maxLen: 255 }),
    description: validateField({ value: values.description, maxLen: 400 }),
    repositoryUrl: validateField({ value: values.repositoryUrl, maxLen: 255 }),
    gitCommit: validateField({ value: values.gitCommit, maxLen: 255 }),
    gitBranch: validateField({ value: values.gitBranch, maxLen: 255 }),
    scriptDir: validateField({ value: values.scriptDir, maxLen: 255 }),
    trainingScript: validateField({ value: values.trainingScript, maxLen: 255 }),
  });

  const defaultValues = {
    compartmentName,
    displayName: modelReady ? modelReady.displayName : undefined,
    description: modelReady ? modelReady.description : undefined,
    repositoryUrl: provenanceReady ? provenanceReady.repositoryUrl : undefined,
    gitCommit: provenanceReady ? provenanceReady.gitCommit : undefined,
    gitBranch: provenanceReady ? provenanceReady.gitBranch : undefined,
    scriptDir: provenanceReady ? provenanceReady.scriptDir : undefined,
    trainingScript: provenanceReady ? provenanceReady.trainingScript : undefined,
  };

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  return (
    <Modal
      testId="edit-model-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.models.editTitle()}
      helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "edit-models")}
      footerContent={
        <FormRemoteSubmitButton formRef={ref}>{Messages.actions.submit()}</FormRemoteSubmitButton>
      }
    >
      {/* Loaders */}
      {model.loading && <DialogLoader />}
      {provenance.loading && <DialogLoader />}
      {modelMutation.result && modelMutation.result.loading && <DialogLoader />}
      {provenanceMutation.result && provenanceMutation.result.loading && <DialogLoader />}
      <Form
        validator={validate}
        onSubmit={onSubmit}
        defaultValues={defaultValues}
        formRef={getFormRef}
      >
        {modelReady && (
          <>
            <Field
              readOnly={true}
              label={Messages.models.labels.compartment()}
              fieldName="compartmentName"
            >
              <TextInput disabled={true} />
            </Field>
            <Field
              label={Messages.models.labels.name()}
              tooltip={Messages.tooltips.editDisplayName()}
              fieldName="displayName"
            >
              <TextInput />
            </Field>
            <Field label={Messages.models.labels.description()} fieldName="description">
              <Textarea />
            </Field>
            <FieldSet
              testId="model-provenance-field-set"
              legend={Messages.models.modelProvenanceTitle()}
              collapse={{
                collapsed: isProvenanceSectionCollapsed,
                onToggle: () => setProvenanceSectionCollapsed(!isProvenanceSectionCollapsed),
              }}
            >
              <div className="oui-margin-medium-bottom">
                {Messages.models.modelProvenanceDesc()}
              </div>
              <Field
                label={Messages.models.labels.repositoryUrl()}
                fieldName="repositoryUrl"
                optional={true}
                hint={Messages.models.hints.example(Examples.REPOSITORY_URL)}
              >
                <TextInput />
              </Field>
              <Field
                label={Messages.models.labels.gitCommit()}
                fieldName="gitCommit"
                optional={true}
                hint={Messages.models.hints.example(Examples.COMMIT_HASH)}
              >
                <TextInput />
              </Field>
              <Field
                label={Messages.models.labels.gitBranch()}
                fieldName="gitBranch"
                optional={true}
                hint={Messages.models.hints.example(Examples.BRANCH_NAME)}
              >
                <TextInput />
              </Field>
              <Field
                label={Messages.models.labels.scriptDir()}
                fieldName="scriptDir"
                optional={true}
                hint={Messages.models.hints.example(Examples.SCRIPT_DIRECTORY)}
              >
                <TextInput />
              </Field>
              <Field
                label={Messages.models.labels.trainingScript()}
                fieldName="trainingScript"
                optional={true}
                hint={Messages.models.hints.example(Examples.TRAINING_SCRIPT)}
              >
                <TextInput />
              </Field>
            </FieldSet>
          </>
        )}
        {/* Error messages */}
        {model.error && <ErrorText testId="model-edit-error">{model.error.body.message}</ErrorText>}
        {modelReady && provenance.error && (
          <ErrorText testId="model-edit-error">{provenance.error.body.message}</ErrorText>
        )}
        {modelMutation.result && modelMutation.result.error && (
          <ErrorText testId="model-edit-error">{modelMutation.result.error.body.message}</ErrorText>
        )}
        {provenanceMutation.result && provenanceMutation.result.error && (
          <ErrorText testId="model-edit-error">
            {provenanceMutation.result.error.body.message}
          </ErrorText>
        )}
      </Form>
    </Modal>
  );
};
