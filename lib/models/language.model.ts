export enum Language {
  Italienisch = 'I',
  Englisch = 'E',
  Deutsch = 'D',
  Spanisch = 'S',
  Französisch = 'F',
  Niederländisch = 'N',
  Chinesisch = 'Chin.',
  Japanisch = 'Jap',
  Russisch = 'R',
}

const abbreviationToNameMap = new Map<Language, string>();
const nameToAbbreviationMap = new Map<string, Language>();

for (const name in Language) {
  const abbreviation = Language[name as keyof typeof Language];
  abbreviationToNameMap.set(abbreviation, name);
  nameToAbbreviationMap.set(name, abbreviation as Language);
}

export function languagesToStringArray(languages: Language[]): string[] {
  return languages.map(abbreviation => abbreviationToNameMap.get(abbreviation) || '');
}

export function languagesToLanguageArray(languageNames: string[]): Language[] {
  return languageNames
    .map(name => nameToAbbreviationMap.get(name))
    .filter((abbreviation): abbreviation is Language => abbreviation !== undefined);
}
