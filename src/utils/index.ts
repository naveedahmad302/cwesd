import { Dimensions } from "react-native";

export const windowWidth = Dimensions.get('window').width;
export const windowHeight = Dimensions.get('window').height;

export * from './toast';
export * from './logout';
export { transformSubmissionData } from './moodle';
export type { TransformedSubmissionData } from './moodle';