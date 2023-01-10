export const useCaseTypeValues = [
  { label: "", value: "" },
  {
    label: "Binary classification",
    value: "binary_classification",
  },
  {
    label: "Regression",
    value: "regression",
  },
  {
    label: "Multinomial classification",
    value: "multinomial_classification",
  },
  {
    label: "Clustering",
    value: "clustering",
  },
  {
    label: "Recommender",
    value: "recommender",
  },
  {
    label: "Dimensionality reduction/representation",
    value: "dimensionality_reduction/representation",
  },
  {
    label: "Time series forecasting",
    value: "time_series_forecasting",
  },
  {
    label: "Anomaly detection",
    value: "anomaly_detection",
  },
  {
    label: "Topic modeling",
    value: "topic_modeling",
  },
  { label: "Ner", value: "ner" },
  {
    label: "Sentiment analysis",
    value: "sentiment_analysis",
  },
  {
    label: "Image classification",
    value: "image_classification",
  },
  {
    label: "Object localization",
    value: "object_localization",
  },
  { label: "Other", value: "other" },
];

export const frameworkValues = [
  { label: "", value: "" },
  {
    label: "scikit-learn",
    value: "scikit-learn",
  },
  {
    label: "XGBoost",
    value: "xgboost",
  },
  {
    label: "TensorFlow",
    value: "tensorflow",
  },
  {
    label: "PyTorch",
    value: "pytorch",
  },
  {
    label: "MXNet",
    value: "mxnet",
  },
  {
    label: "Keras",
    value: "keras",
  },
  {
    label: "LightGBM",
    value: "lightgbm",
  },
  {
    label: "PyMC3",
    value: "pymc3",
  },
  {
    label: "PyOD",
    value: "pyod",
  },
  {
    label: "spaCy",
    value: "spacy",
  },
  {
    label: "Prophet",
    value: "prophet",
  },
  {
    label: "sktime",
    value: "sktime",
  },
  {
    label: "statsmodels",
    value: "statsmodels",
  },
  {
    label: "cuML",
    value: "cuml",
  },
  {
    label: "Oracle AutoML",
    value: "oracle_automl",
  },
  { label: "H2O", value: "h2o" },
  {
    label: "Transformers",
    value: "transformers",
  },
  {
    label: "NLTK",
    value: "nltk",
  },
  {
    label: "emcee",
    value: "emcee",
  },
  {
    label: "PyStan",
    value: "pystan",
  },
  {
    label: "BERT",
    value: "bert",
  },
  {
    label: "Gensim",
    value: "gensim",
  },
  {
    label: "flairNLP",
    value: "flair",
  },
  {
    label: "Word2Vec",
    value: "word2vec",
  },
  {
    label: "Ensemble",
    value: "ensemble",
  },
  {
    label: "Other",
    value: "other",
  },
  {
    label: "Pyspark",
    value: "pyspark",
  },
];

export const categoryValues = [
  { label: "", value: "" },
  {
    label: "Performance",
    value: "performance",
  },
  {
    label: "Training Profile",
    value: "training profile",
  },
  {
    label: "Training and Validation Datasets",
    value: "training and validation datasets",
  },
  {
    label: "Training Environment",
    value: "training environment",
  },
  {
    label: "Other",
    value: "other",
  },
];

const valuesMap = new Map<string, string>();
[...categoryValues, ...frameworkValues, ...useCaseTypeValues].forEach((element) => {
  valuesMap.set(element.value.toLowerCase().trim(), element.label);
});

export function getLabelForValue(value: string): string {
  if (value) {
    const mappedValue = valuesMap.get(value.toLowerCase().trim());
    return mappedValue ? mappedValue : value;
  }
}
