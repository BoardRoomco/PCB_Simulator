import {
  ADD_TEXT_ANNOTATION,
  UPDATE_TEXT_ANNOTATION,
  REMOVE_TEXT_ANNOTATION,
  LOAD_CIRCUIT
} from '../actions';

const initialState = [];

export default function textAnnotationsReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TEXT_ANNOTATION:
      return [...state, {
        id: action.payload.id,
        text: action.payload.text,
        position: action.payload.position,
        fontSize: 24 // default font size
      }];

    case UPDATE_TEXT_ANNOTATION:
      return state.map(annotation =>
        annotation.id === action.payload.id
          ? { ...annotation, ...action.payload }
          : annotation
      );

    case REMOVE_TEXT_ANNOTATION:
      return state.filter(annotation => annotation.id !== action.payload.id);

    case LOAD_CIRCUIT:
      // If the loaded circuit has text annotations, use those, otherwise keep current
      return action.circuit.textAnnotations || state;

    default:
      return state;
  }
} 