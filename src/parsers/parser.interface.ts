import { TranslationCollection } from '../utils/translation.collection';

export interface ParserInterface {
	extract(source: string, filePath: string, custServiceName?: string, custMethodName?: string): TranslationCollection | null;
}
