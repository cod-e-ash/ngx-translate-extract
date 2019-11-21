import * as fs from 'fs';
import * as yargs from 'yargs';

import { ExtractTask } from './tasks/extract.task';
import { ParserInterface } from '../parsers/parser.interface';
import { PipeParser } from '../parsers/pipe.parser';
import { DirectiveParser } from '../parsers/directive.parser';
import { ServiceParser } from '../parsers/service.parser';
import { MarkerParser } from '../parsers/marker.parser';
import { PostProcessorInterface } from '../post-processors/post-processor.interface';
import { SortByKeyPostProcessor } from '../post-processors/sort-by-key.post-processor';
import { KeyAsDefaultValuePostProcessor } from '../post-processors/key-as-default-value.post-processor';
import { NullAsDefaultValuePostProcessor } from '../post-processors/null-as-default-value.post-processor';
import { PurgeObsoleteKeysPostProcessor } from '../post-processors/purge-obsolete-keys.post-processor';
import { CompilerInterface } from '../compilers/compiler.interface';
import { CompilerFactory } from '../compilers/compiler.factory';
import { donateMessage } from '../utils/donate';

export const cli = yargs
	.usage('Extract strings from files for translation.\nUsage: $0 [options]')
	.version(require(__dirname + '/../../package.json').version)
	.alias('version', 'v')
	.help('help')
	.alias('help', 'h')
	.option('input', {
		alias: 'i',
		describe: 'Paths you would like to extract strings from. You can use path expansion, glob patterns and multiple paths',
		default: [process.env.PWD],
		type: 'array',
		normalize: true,
		required: true
	})
	.check(options => {
		options.input.forEach((dir: string) => {
			if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
				throw new Error(`The path you supplied was not found: '${dir}'`);
			}
		});
		return true;
	})
	.option('patterns', {
		alias: 'p',
		describe: 'Extract strings from the following file patterns',
		type: 'array',
		default: ['/**/*.html', '/**/*.ts']
	})
	.option('output', {
		alias: 'o',
		describe: 'Paths where you would like to save extracted strings. You can use path expansion, glob patterns and multiple paths',
		type: 'array',
		normalize: true,
		required: true
	})
	.option('format', {
		alias: 'f',
		describe: 'Output format',
		default: 'json',
		type: 'string',
		choices: ['json', 'namespaced-json', 'pot']
	})
	.option('format-indentation', {
		alias: 'fi',
		describe: 'Output format indentation',
		default: '\t',
		type: 'string'
	})
	.option('replace', {
		alias: 'r',
		describe: 'Replace the contents of output file if it exists (Merges by default)',
		type: 'boolean'
	})
	.option('sort', {
		alias: 's',
		describe: 'Sort strings in alphabetical order when saving',
		type: 'boolean'
	})
	.option('clean', {
		alias: 'c',
		describe: 'Remove obsolete strings when merging',
		type: 'boolean'
	})
	.option('key-as-default-value', {
		alias: 'k',
		describe: 'Use key as default value for translations',
		type: 'boolean'
	})
	.option('null-as-default-value', {
		alias: 'n',
		describe: 'Use null as default value for translations',
		type: 'boolean'
	})
	.option('servicename', {
		alias: 'sn',
		describe: 'Translate service name to be used',
		type: 'string'
	})
	.option('methodname', {
		alias: 'mn',
		describe: 'Translate function name to be used',
		type: 'string'
	})
	.conflicts('key-as-default-value', 'null-as-default-value')
	.exitProcess(true)
	.parse(process.argv);

const extractTask = new ExtractTask(cli.input, cli.output, {
	replace: cli.replace,
	patterns: cli.patterns,
	custService: cli.servicename,
	custMethod: cli.methodname
});

// Parsers
const parsers: ParserInterface[] = [new PipeParser(), new DirectiveParser(), new ServiceParser(), new MarkerParser()];
extractTask.setParsers(parsers);

// Post processors
const postProcessors: PostProcessorInterface[] = [];
if (cli.clean) {
	postProcessors.push(new PurgeObsoleteKeysPostProcessor());
}
if (cli.keyAsDefaultValue) {
	postProcessors.push(new KeyAsDefaultValuePostProcessor());
} else if (cli.nullAsDefaultValue) {
	postProcessors.push(new NullAsDefaultValuePostProcessor());
}
if (cli.sort) {
	postProcessors.push(new SortByKeyPostProcessor());
}
extractTask.setPostProcessors(postProcessors);

// Compiler
const compiler: CompilerInterface = CompilerFactory.create(cli.format, {
	indentation: cli.formatIndentation
});
extractTask.setCompiler(compiler);

extractTask.execute();

console.log(donateMessage);
