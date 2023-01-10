import * as React from "react";
import {
  DropFileSelector,
  FormValues,
  FormErrors,
  Modal,
  Field,
  Form,
  TextInput,
  Textarea,
  FieldSet,
  ErrorText,
  CheckBox,
  FormRef,
} from "oui-react";
import * as Messages from "@codegen/Messages";
import {
  ActiveCompartmentSelect,
  FormRemoteSubmitButton,
  TagsSubForm,
  useConsoleState,
  useMutation,
} from "oui-savant";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { validateField, trimDisplayName } from "../../utils/formUtils";
import { EventEmitter } from "events";
import { useDispatch } from "redux-react-hook";
import apiClients from "../../apiClients";
import { ResourceNames } from "../../constants/resourceNames";
import { push } from "connected-react-router";
import { getRouteClient } from "loom-plugin-runtime";
import { SelectedFile } from "../../components/uploads/SelectedFile";
import { Model } from "odsc-client";
import { ArtifactSize } from "../../constants/artifact";
import { getHelpLink } from "../../utils/docUtils";
import { Examples } from "constants/examples";
import { BackendResourceNames } from "constants/backendResourceNames";

interface Props {
  closeHandler(): void;
  refresh(): void;
  projectId: string;
  isError: boolean;
}

export const UPLOAD_EVENT = "UPLOAD_ARTIFACT";

function createEventEmitter(): EventEmitter {
  const eventEmitter = new EventEmitter();
  eventEmitter.setMaxListeners(0);
  return eventEmitter;
}

export const eventEmitter = createEventEmitter();

export const ModelCreateDialog: React.FC<Props> = ({
  closeHandler,
  refresh,
  projectId,
  isError,
}) => {
  const [redirectOnCreate, setRedirectOnCreate] = React.useState(true);
  const [isProvenanceSectionCollapsed, setProvenanceSectionCollapsed] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(undefined);
  const [form, setForm] = React.useState<Form>(undefined);
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [isArtifactMutationComplete, setArtifactMutationComplete] = React.useState(false);
  const [isProvenanceMutationComplete, setProvenanceMutationComplete] = React.useState(false);
  const [areMutationsInFlight, setMutationsInFlight] = React.useState(false);

  const dispatch = useDispatch();
  const { activeCompartment } = useConsoleState();

  const callCreateProvenance = (modelId: string): void => {
    const values = form.getValues();
    provenanceMutation.invoke({
      modelId,
      createModelProvenanceDetails: {
        repositoryUrl: values.repositoryUrl,
        gitCommit: values.gitCommit,
        gitBranch: values.gitBranch,
        scriptDir: values.scriptDir,
        trainingScript: values.trainingScript,
      },
    });
  };

  /**
   * The SECOND and THIRD mutations.
   */
  const provenanceMutation = useMutation({
    method: apiClients.odscApi.createModelProvenance,
    onSuccess: () => setProvenanceMutationComplete(true),
  });
  const callCreateArtifact = (modelId: string): void => {
    eventEmitter.emit(UPLOAD_EVENT, modelId, BackendResourceNames.models);
  };

  /**
   * The FIRST mutation.
   */
  const modelMutation = useMutation({
    method: apiClients.odscApi.createModel,
    onSuccess: (result) => {
      callCreateProvenance(result.response.data.id);
      callCreateArtifact(result.response.data.id);
    },
  });

  /**
   * Even if the provenance mutation fails, track the fact that it's completed in state.
   */
  const provenanceMutationError = provenanceMutation.result && provenanceMutation.result.error;
  React.useEffect(() => {
    // When artifact mutation AND the provenance mutation have both completed (regardless of success or error)...
    // ...either redirect the user or close the dialog.
    if (isArtifactMutationComplete && (isProvenanceMutationComplete || provenanceMutationError)) {
      setMutationsInFlight(false);
      if (redirectOnCreate) {
        const model = modelMutation.result && (modelMutation.result.response.data as Model);
        const url = getRouteClient().makePluginUrl(`/${ResourceNames.models}/${model.id}`);
        dispatch(push(url));
      } else {
        refresh();
        closeHandler();
      }
    }
  }, [isArtifactMutationComplete, isProvenanceMutationComplete, provenanceMutationError]);

  /**
   * Handle the submit event from the form.
   * This is where the first of THREE mutations gets triggered.
   * See modelMutation's onSuccess callback for other two mutations.
   */
  const onSubmit = (form: Form): void => {
    setMutationsInFlight(true);
    setForm(form);
    const values = form.getValues();
    modelMutation.reset();
    modelMutation.invoke({
      createModelDetails: {
        projectId,
        compartmentId: activeCompartment && activeCompartment.id,
        displayName: trimDisplayName(values.displayName),
        description: values.description,
        freeformTags: values.tags.freeformTags,
        definedTags: values.tags.definedTags,
      },
    });
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    displayName: validateField({ value: values.displayName, maxLen: 255 }),
    description: validateField({ value: values.description, maxLen: 400 }),
    modelArtifact: validateField({
      value: values.modelArtifact,
      required: true,
      callback: (value: File) => value.size <= ArtifactSize.maxSizeBytes,
    }),
    repositoryUrl: validateField({ value: values.repositoryUrl, maxLen: 255 }),
    gitCommit: validateField({ value: values.gitCommit, maxLen: 255 }),
    gitBranch: validateField({ value: values.gitBranch, maxLen: 255 }),
    scriptDir: validateField({ value: values.scriptDir, maxLen: 255 }),
    trainingScript: validateField({ value: values.trainingScript, maxLen: 255 }),
  });

  const modelMutationError = modelMutation.result && modelMutation.result.error;

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  return (
    <Modal
      testId="create-model-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.models.createTitle()}
      helpLink={getHelpLink("/create-models.htm")}
      footerContent={
        <FormRemoteSubmitButton formRef={ref} disabled={isError}>
          {Messages.actions.create()}
        </FormRemoteSubmitButton>
      }
    >
      <Form validator={validate} onSubmit={onSubmit} formRef={getFormRef}>
        {areMutationsInFlight && !modelMutationError && <DialogLoader />}
        <ActiveCompartmentSelect />
        <Field
          label={Messages.models.labels.name()}
          tooltip={Messages.tooltips.displayName()}
          optional={true}
          fieldName="displayName"
        >
          <TextInput />
        </Field>
        <Field label={Messages.models.labels.description()} optional={true} fieldName="description">
          <Textarea />
        </Field>
        <Field
          label={Messages.models.labels.modelArtifact()}
          tooltip={Messages.tooltips.modelArtifact()}
          fieldName="modelArtifact"
          hint={Messages.models.hints.modelArtifact(ArtifactSize.maxSizeMiB)}
        >
          <DropFileSelector
            testId="uploadFileSelector"
            text={Messages.models.labels.fileSelectorText()}
            browseLinkText={Messages.models.labels.fileSelectorBrowseLinkText()}
            onFilesSelected={setSelectedFile}
          />
        </Field>
        {selectedFile && (
          <SelectedFile
            selectedFile={selectedFile}
            onUploadFinished={() => setArtifactMutationComplete(true)}
          />
        )}
        <FieldSet
          testId="model-provenance-field-set"
          legend={Messages.models.modelProvenanceTitle()}
          collapse={{
            collapsed: isProvenanceSectionCollapsed,
            onToggle: () => setProvenanceSectionCollapsed(!isProvenanceSectionCollapsed),
          }}
        >
          <div className="oui-margin-medium-bottom">{Messages.models.modelProvenanceDesc()}</div>
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

        <TagsSubForm showLabel={true} compartmentId={activeCompartment.id} />

        <Field label={Messages.labels.redirectOnCreate()} fieldName="redirectOnCreate">
          <CheckBox
            checked={redirectOnCreate}
            onChange={() => setRedirectOnCreate(!redirectOnCreate)}
          />
        </Field>
        {modelMutation.result && modelMutation.result.error && (
          <ErrorText testId="model-create-error">
            {modelMutation.result.error.body.message}
          </ErrorText>
        )}
      </Form>
    </Modal>
  );
};
