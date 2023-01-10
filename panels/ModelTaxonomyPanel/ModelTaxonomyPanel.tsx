import { FormRemoteSubmitButton, Panel, PanelSize } from "oui-savant";
import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import { getHelpLink, MODELS_SAVING } from "utils/docUtils";

import {
  Field,
  Form,
  Textarea,
  TextInput,
  FormContextConsumer,
  FormValues,
  FormErrors,
  Select,
  FormRef,
  FieldSet,
} from "oui-react";
import { isJsonString, validateField } from "utils/formUtils";
import "./ModelTaxonomyPanel.less";
import { CustomAttributesSelect } from "./CustomAttributesSelect/CustomAttributesSelect";
import { frameworkValues, useCaseTypeValues } from "../../constants/modelTaxonomy";
import { sortBy } from "oui-react/dist/utils/util";

export interface ModelDefinedMetadata {
  useCaseType?: string;
  frameworkName?: string;
  frameworkVersion?: string;
  algorithm?: string;
  hyperparameters?: string;
  artifactTestResults?: string;
}

export interface CustomAttribute {
  id?: string;
  key: string;
  value: string;
  category?: string;
  description?: string;
}

export interface ModelTaxonomy {
  modelDefinedMetadata: ModelDefinedMetadata;
  customAttributes: CustomAttribute[];
}

interface Props {
  onClose: () => void;
  preSelectedModelTaxonomy: ModelTaxonomy;
  onModelTaxonomySubmit: (modelTaxonomy: ModelTaxonomy) => void;
}

export enum SelectOptions {
  SelectModelTaxonomy = "Model Taxonomy",
  SelectCustomAttributes = "Add Custom Attributes",
}

export const ModelTaxonomyPanel: React.FC<Props> = ({
  onClose,
  preSelectedModelTaxonomy,
  onModelTaxonomySubmit,
}) => {
  const [groupCustomAttributes, setGroupCustomAttributes] = React.useState(
    preSelectedModelTaxonomy ? preSelectedModelTaxonomy.customAttributes : []
  );
  const modelDefinedMetadata = preSelectedModelTaxonomy
    ? preSelectedModelTaxonomy.modelDefinedMetadata
    : {};
  const fieldErrors: FormErrors = {};
  const [ref, setRef] = React.useState<FormRef>(undefined);

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const validate = (values: FormValues): FormErrors => {
    fieldErrors["frameworkVersion"] = validateField({
      value: values.frameworkVersion,
      minLen: 0,
      maxLen: 255,
    });
    fieldErrors["algorithm"] = validateField({
      value: values.algorithm,
      minLen: 0,
      maxLen: 255,
    });
    fieldErrors["hyperparameters"] = validateField({
      value: values.hyperparameters,
      callback: (value: string) =>
        isJsonString(value).isValid || value === "" || value === undefined,
      callbackMessage: isJsonString(
        values.hyperparameters,
        Messages.models.selectPanes.modelTaxonomySelect.labels.hyperParameters()
      ).errorMessage,
    });
    fieldErrors["artifactTestResults"] = validateField({
      value: values.artifactTestResults,
      callback: (value: string) =>
        isJsonString(value).isValid || value === "" || value === undefined,
      callbackMessage: isJsonString(
        values.artifactTestResults,
        Messages.models.selectPanes.modelTaxonomySelect.labels.artifactTestResults()
      ).errorMessage,
    });
    return fieldErrors;
  };

  const onSubmit = (form: Form): void => {
    const formValues = form.getValues();
    const filteredGroupCustomAttributes = groupCustomAttributes.filter(
      (customAttribute) =>
        customAttribute.key !== "" ||
        customAttribute.value !== "" ||
        customAttribute.category !== "" ||
        customAttribute.description !== ""
    );
    const newGroupCustomAttributes = filteredGroupCustomAttributes.map((customAttribute) => {
      return customAttribute.category === ""
        ? { ...customAttribute, category: null }
        : customAttribute;
    });
    const modelDefinedMetadataDetails = {
      useCaseType: formValues.useCaseType,
      frameworkName: formValues.frameworkName,
      frameworkVersion: formValues.frameworkVersion,
      algorithm: formValues.algorithm,
      hyperparameters: formValues.hyperparameters,
      artifactTestResults: formValues.artifactTestResults,
    };
    onModelTaxonomySubmit({
      modelDefinedMetadata: modelDefinedMetadataDetails,
      customAttributes: newGroupCustomAttributes,
    });
  };

  const defaultValues = {
    useCaseType: modelDefinedMetadata.useCaseType,
    frameworkName: modelDefinedMetadata.frameworkName,
    frameworkVersion: modelDefinedMetadata.frameworkVersion,
    algorithm: modelDefinedMetadata.algorithm,
    hyperparameters: modelDefinedMetadata.hyperparameters,
    artifactTestResults: modelDefinedMetadata.artifactTestResults,
  };

  return (
    <>
      <Form
        formRef={getFormRef}
        onSubmit={onSubmit}
        validator={validate}
        defaultValues={defaultValues}
      >
        <FormContextConsumer>
          {() => (
            <Panel
              size={PanelSize.Medium}
              title={Messages.models.selectPanes.modelTaxonomySelect.title()}
              actions={[
                <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"}>
                  {Messages.actions.select()}
                </FormRemoteSubmitButton>,
              ]}
              onClose={onClose}
              helpLink={getHelpLink(MODELS_SAVING)}
            >
              <p>{Messages.models.selectPanes.modelTaxonomySelect.message()}</p>
              <br />
              <FieldSet
                legend={Messages.models.selectPanes.modelTaxonomySelect.modelTaxonomy.label()}
              >
                <p>{Messages.models.selectPanes.modelTaxonomySelect.modelTaxonomy.description()}</p>
                <Field
                  label={Messages.models.selectPanes.modelTaxonomySelect.labels.useCase()}
                  fieldName="useCaseType"
                  tooltip={Messages.models.selectPanes.modelTaxonomySelect.tooltips.useCaseType()}
                >
                  <Select options={sortBy(useCaseTypeValues, "label")} />
                </Field>
                <div className={"field-row"}>
                  <Field
                    label={Messages.models.selectPanes.modelTaxonomySelect.labels.frameworkName()}
                    fieldName="frameworkName"
                    tooltip={Messages.models.selectPanes.modelTaxonomySelect.tooltips.frameworkName()}
                  >
                    <Select options={sortBy(frameworkValues, "label")} />
                  </Field>
                  <Field
                    label={Messages.models.selectPanes.modelTaxonomySelect.labels.frameworkVersion()}
                    fieldName="frameworkVersion"
                    tooltip={Messages.models.selectPanes.modelTaxonomySelect.tooltips.frameworkVersion()}
                  >
                    <TextInput />
                  </Field>
                </div>
                <Field
                  label={Messages.models.selectPanes.modelTaxonomySelect.labels.algorithm()}
                  fieldName="algorithm"
                  tooltip={Messages.models.selectPanes.modelTaxonomySelect.tooltips.algorithm()}
                >
                  <TextInput />
                </Field>
                <Field
                  label={Messages.models.selectPanes.modelTaxonomySelect.labels.hyperParameters()}
                  fieldName="hyperparameters"
                  tooltip={Messages.models.selectPanes.modelTaxonomySelect.tooltips.hyperParameters()}
                >
                  <Textarea rows={4} />
                </Field>
                <Field
                  label={Messages.models.selectPanes.modelTaxonomySelect.labels.artifactTestResults()}
                  fieldName="artifactTestResults"
                  tooltip={Messages.models.selectPanes.modelTaxonomySelect.tooltips.artifactTestResults()}
                >
                  <Textarea rows={4} />
                </Field>
              </FieldSet>
              <CustomAttributesSelect
                groupCustomAttributes={groupCustomAttributes}
                setGroupCustomAttributes={setGroupCustomAttributes}
                fieldErrors={fieldErrors}
              />
            </Panel>
          )}
        </FormContextConsumer>
      </Form>
    </>
  );
};
