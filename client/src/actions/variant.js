import * as actions from './type';


export const fetchSchema = () => ({
  type: actions.VARIANT_SCHEMA_REQUESTED,
});

export const selectQuery = key => ({
  type: actions.PATIENT_VARIANT_QUERY_SELECTION,
  payload: {
    key,
  },
});

export const replaceQuery = query => ({
  type: actions.PATIENT_VARIANT_QUERY_REPLACEMENT,
  payload: {
    query,
  },
});

export const replaceQueries = queries => ({
  type: actions.PATIENT_VARIANT_QUERIES_REPLACEMENT,
  payload: {
    queries,
  },
});

export const removeQuery = keys => ({
  type: actions.PATIENT_VARIANT_QUERY_REMOVAL,
  payload: {
    keys,
  },
});

export const duplicateQuery = (query, index) => ({
  type: actions.PATIENT_VARIANT_QUERY_DUPLICATION,
  payload: {
    query,
    index,
  },
});

export const sortStatement = statement => ({
  type: actions.PATIENT_VARIANT_STATEMENT_SORT,
  payload: {
    statement,
  },
});

export const searchVariants = (patient, statement, query, group = null, index = 0, limit = 25) => ({
  type: actions.PATIENT_VARIANT_SEARCH_REQUESTED,
  payload: {
    patient,
    statement,
    query,
    group,
    index,
    limit,
  },
});

export const countVariants = (patient, statement, queries) => ({
  type: actions.PATIENT_VARIANT_COUNT_REQUESTED,
  payload: {
    patient,
    statement,
    queries,
  },
});

export const commitHistory = version => ({
  type: actions.PATIENT_VARIANT_COMMIT_HISTORY,
  payload: {
    version,
  },
});

export const undo = () => ({
  type: actions.PATIENT_VARIANT_UNDO,
});


export const getStatements = () => ({
  type: actions.PATIENT_VARIANT_GET_STATEMENTS_REQUESTED,
});

export const createDraftStatement = statement => ({
  type: actions.PATIENT_VARIANT_CREATE_DRAFT_STATEMENT,
  payload: {
    statement,
  },
});

export const updateStatement = (id, title, description, queries, isDefault = false) => ({
  type: actions.PATIENT_VARIANT_UPDATE_STATEMENT_REQUESTED,
  payload: {
    id,
    title,
    description,
    queries,
    isDefault,
  },
});

export const createStatement = (id, title, description, queries, isDefault = false) => ({
  type: actions.PATIENT_VARIANT_CREATE_STATEMENT_REQUESTED,
  payload: {
    id,
    title,
    description,
    queries,
    isDefault,
  },
});

export const deleteStatement = id => ({
  type: actions.PATIENT_VARIANT_DELETE_STATEMENT_REQUESTED,
  payload: {
    id,
  },
});

export const selectStatement = id => ({
  type: actions.PATIENT_VARIANT_SELECT_STATEMENT_REQUESTED,
  payload: {
    id,
  },
});

export const duplicateStatement = id => ({
  type: actions.PATIENT_VARIANT_DUPLICATE_STATEMENT_REQUESTED,
  payload: {
    id,
  },
});
