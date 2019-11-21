import { tsquery } from '@phenomnomnominal/tsquery';

import { ParserInterface } from './parser.interface';
import { TranslationCollection } from '../utils/translation.collection';
import { findClassDeclarations, findClassPropertyByType, findMethodCallExpressions, getStringsFromExpression } from '../utils/ast-helpers';

const TRANSLATE_SERVICE_TYPE_REFERENCE = 'TranslateService';
const TRANSLATE_SERVICE_METHOD_NAMES = ['get', 'instant', 'stream'];

export class ServiceParser implements ParserInterface {
	public extract(source: string, filePath: string, custServiceName?: string, custMethodName?: string): TranslationCollection | null {
		const sourceFile = tsquery.ast(source, filePath);
		const serviceName = custServiceName ? custServiceName : TRANSLATE_SERVICE_TYPE_REFERENCE;
		if(custMethodName) TRANSLATE_SERVICE_METHOD_NAMES.push(custMethodName);

		const classDeclarations = findClassDeclarations(sourceFile);
		if (!classDeclarations) {
			return null;
		}

		let collection: TranslationCollection = new TranslationCollection();

		classDeclarations.forEach(classDeclaration => {
			const propName: string = findClassPropertyByType(classDeclaration, serviceName);
			if (!propName) {
				return;
			}

			const callExpressions = findMethodCallExpressions(classDeclaration, propName, TRANSLATE_SERVICE_METHOD_NAMES);
			callExpressions.forEach(callExpression => {
				const [firstArg] = callExpression.arguments;
				if (!firstArg) {
					return;
				}
				const strings = getStringsFromExpression(firstArg);
				collection = collection.addKeys(strings);
			});
		});
		return collection;
	}
}
