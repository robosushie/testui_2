import * as React from "react";
import {
  useMutation,
  useQuery,
  useConsoleState,
  FormRemoteSubmitButton,
  CompartmentScopedField,
  ListingContextProvider,
} from "oui-savant";
import {
  Form,
  ErrorText,
  Modal,
  FormRef,
  Field,
  FormValues,
  FormErrors,
  ToastNotification,
  InfoBlockStatus,
  TextInput,
} from "oui-react";

import * as Messages from "@codegen/Messages";
import DialogLoader from "components/DialogLoader/DialogLoader";
import apiClients from "../../apiClients";
import { getDialogBoxHelpLink, MANAGE_MODELS } from "../../utils/docUtils";
import ProjectSelect from "projects/components/ProjectSelect/ProjectSelect";
import { Compartment } from "identity-control-plane-api-client";
import ListModelVersionSetByCompartment from "./ListModelVersionSetByCompartment";
import { validateField } from "../../utils/formUtils";

interface Props {
  closeHandler(): void;
  refresh(): void;
  modelId: string;
  activeProjectId: string;
}

export const ModelMoveToVersionSetDialog: React.FC<Props> = ({
  modelId,
  closeHandler,
  refresh,
  activeProjectId,
}) => {
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const { activeCompartment, compartments } = useConsoleState();
  const [errorText, setErrorText] = React.useState("");
  const [selectedModelVersionSetId, setSelectedModelVersionSetId] =
    React.useState<string>(undefined);
  const [compartmentId, setCompartmentId] = React.useState(activeCompartment.id);
  const [projectId, setProjectId] = React.useState(activeProjectId);
  const portalclass = "oui-dialog-width";
  let compartment = activeCompartment;

  const model = useQuery({
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
    },
  });
  const modelReady = !model.error && model.response && model.response.data;

  const modelMutation = useMutation({
    method: apiClients.odscApi.updateModel,
    onSuccess: () => {
      refresh();
      ToastNotification.create({
        title: `${Messages.models.addModelToVersionSetSuccessMessage()}`,
        status: InfoBlockStatus.Success,
      });
      closeHandler();
    },
  });

  React.useEffect(() => {
    if (modelReady) {
      const { compartmentId } = modelReady;
      compartment = compartments.find((compartment) => compartment.id === compartmentId);
    }
  }, [modelReady]);

  /**
   * Handle the submit event from the form.
   */
  const onSubmit = (form: Form): void => {
    if (!!selectedModelVersionSetId) {
      const values = form.getValues();
      modelMutation.reset();
      modelMutation.invoke({
        modelId,
        updateModelDetails: {
          modelVersionSetId: selectedModelVersionSetId as string,
          versionLabel: !values.versionLabel ? null : values.versionLabel,
        },
      });
    } else {
      setErrorText(
        Messages.models.errorMessages.modelMoveToVersionSetDialog.noModelVersionSelected()
      );
    }
  };

  const defaultValues = {
    modelVersionSetId: modelReady ? modelReady.modelVersionSetId : undefined,
  };

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const fetchInitialCompartmentForProjectSelect = () => {
    return compartment ? compartment : activeCompartment;
  };

  const onCompartmentChange = (compartment: Compartment) => {
    setCompartmentId(compartment.id);
    setProjectId(undefined);
  };

  const onProjectChange = (projectId: string) => {
    setProjectId(projectId);
  };

  const onSelectedModelVersionSetChanged = (value: any) => {
    setSelectedModelVersionSetId(value);
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    versionLabel: validateField({ value: values.versionLabel, maxLen: 255 }),
  });

  return (
    <Modal
      portalClass={portalclass}
      testId="move-model-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.models.addTitle()}
      helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "edit-models")}
      footerContent={
        <FormRemoteSubmitButton formRef={ref}>
          {Messages.models.actions.add()}
        </FormRemoteSubmitButton>
      }
    >
      {/* Loaders */}
      {model.loading && <DialogLoader />}
      {modelMutation.result && modelMutation.result.loading && <DialogLoader />}
      <Form
        onSubmit={onSubmit}
        validator={validate}
        defaultValues={defaultValues}
        formRef={getFormRef}
      >
        {modelReady && (
          <>
            <CompartmentScopedField
              fieldName={"compartmentScopedSelect"}
              label={Messages.models.labels.selectByProject()}
              initialCompartment={fetchInitialCompartmentForProjectSelect()}
              onChange={onCompartmentChange}
            >
              {({ selectedCompartment }) => (
                <ProjectSelect
                  compartmentId={selectedCompartment.id}
                  selectedProjectId={projectId}
                  onChange={onProjectChange}
                  label={""}
                />
              )}
            </CompartmentScopedField>
            <ListingContextProvider paging={{ pageSize: 10 }}>
              <ListModelVersionSetByCompartment
                selectedCompartmentId={compartmentId}
                selectedProjectId={projectId}
                onSelectedModelVersionSetChanged={onSelectedModelVersionSetChanged}
              />
            </ListingContextProvider>
            <br />
            <Field
              label={Messages.models.labels.versionLabel()}
              fieldName="versionLabel"
              optional={true}
            >
              <TextInput />
            </Field>
          </>
        )}
        {/* Error messages */}
        {(model.error || errorText) && (
          <ErrorText testId="model-get-error">
            {!errorText ? model.error.body.message : errorText}
          </ErrorText>
        )}
        {modelMutation.result && modelMutation.result.error && (
          <ErrorText testId="model-edit-error">{modelMutation.result.error.body.message}</ErrorText>
        )}
      </Form>
    </Modal>
  );
};
