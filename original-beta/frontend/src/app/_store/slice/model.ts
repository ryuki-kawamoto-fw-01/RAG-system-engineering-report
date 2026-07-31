import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DEFAULT_MODEL,
  MODEL_VALUES,
  ModelValue,
  SEARCH_METHOD_SEMANTIC_HYBRID,
  SEARCH_METHOD_VALUES,
  SearchMethodValue,
} from '../../../../config';

export interface ModelState {
  chat_selectedModel: string;
  rag_selectedModel: string;
  rag_selectedSearchMethod: string;
}

export const initialState: ModelState = {
  chat_selectedModel: DEFAULT_MODEL,
  rag_selectedModel: DEFAULT_MODEL,
  rag_selectedSearchMethod: SEARCH_METHOD_SEMANTIC_HYBRID,
};

export const chat = createAsyncThunk('chat_selectedModel', async () => {
  let model = localStorage.getItem('chat_selectedModel');
  if (model && !MODEL_VALUES.includes(model as ModelValue)) {
    localStorage.setItem('chat_selectedModel', DEFAULT_MODEL);
    model = DEFAULT_MODEL;
  }
  return model;
});

export const rag = createAsyncThunk('rag_selectedModel', async () => {
  let model = localStorage.getItem('rag_selectedModel');
  let method = localStorage.getItem('rag_selectedSearchMethod');
  if (model && !MODEL_VALUES.includes(model as ModelValue)) {
    localStorage.setItem('rag_selectedModel', DEFAULT_MODEL);
    model = DEFAULT_MODEL;
  }
  if (!method || !SEARCH_METHOD_VALUES.includes(method as SearchMethodValue)) {
    localStorage.setItem('rag_selectedSearchMethod', SEARCH_METHOD_SEMANTIC_HYBRID);
    method = SEARCH_METHOD_SEMANTIC_HYBRID;
  }
  return { model, method };
});

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setChatSelectedModel: (state, action: PayloadAction<string>) => {
      const selectedModel = action.payload;
      localStorage.setItem('chat_selectedModel', selectedModel);
      return {
        ...state,
        chat_selectedModel: selectedModel,
      };
    },
    setRagSelectedModel: (state, action: PayloadAction<string>) => {
      const selectedModel = action.payload;
      localStorage.setItem('rag_selectedModel', selectedModel);
      return {
        ...state,
        rag_selectedModel: selectedModel,
      };
    },
    setRagSelectedSarchMethod: (state, action: PayloadAction<string>) => {
      const method = action.payload;
      localStorage.setItem('rag_selectedSearchMethod', method);
      return {
        ...state,
        rag_selectedSearchMethod: method,
      };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(chat.fulfilled, (state, action) => {
      return {
        ...state,
        chat_selectedModel: action.payload ?? DEFAULT_MODEL,
      };
    });
    builder.addCase(rag.fulfilled, (state, action) => {
      return {
        ...state,
        rag_selectedModel: action.payload.model ?? DEFAULT_MODEL,
        rag_selectedSearchMethod: action.payload.method ?? SEARCH_METHOD_SEMANTIC_HYBRID,
      };
    });
  },
});

export const { setChatSelectedModel, setRagSelectedModel, setRagSelectedSarchMethod } =
  modelSlice.actions;
export const modelReducer = modelSlice.reducer;
