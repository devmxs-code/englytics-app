import { useState, useEffect, useCallback } from 'react';
import './index.css';

type DictionaryResponse = {
  word: string;
  phonetic?: string;
  phonetics: {
    text?: string;
    audio?: string;
  }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }[];
    synonyms: string[];
    antonyms: string[];
  }[];
  sourceUrls?: string[];
  license?: {
    name: string;
    url: string;
  };
  origin?: string;
};

type RelatedWord = {
  word: string;
  score: number;
};

type Language = 'en' | 'pt-BR';

type TranslationCache = {
  [key: string]: {
    text: string;
    timestamp: number;
  };
};

export default function DictionaryApp() {
  // States
  const [word, setWord] = useState('');
  const [definitions, setDefinitions] = useState<DictionaryResponse[]>([]);
  const [relatedWords, setRelatedWords] = useState<RelatedWord[]>([]);
  const [translation, setTranslation] = useState<{text: string, source: string} | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'definitions' | 'thesaurus' | 'examples'>('definitions');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [definitionTranslations, setDefinitionTranslations] = useState<{[key: string]: string}>({});
  const [exampleTranslations, setExampleTranslations] = useState<{[key: string]: string}>({});

  // Texts
  const texts = {
    en: {
      searchPlaceholder: 'Search for a word...',
      welcome: 'Welcome to Englytics',
      welcomeDesc: 'Search for any English word to get detailed definitions, examples, pronunciations, and translations.',
      tryWords: 'Try these words:',
      definitions: 'Definitions',
      thesaurus: 'Thesaurus',
      examples: 'Examples',
      wordNetwork: 'Word Network',
      semanticSimilarity: 'Semantic Similarity',
      usageExamples: 'Usage Examples',
      recentSearches: 'Recent Searches',
      savedWords: 'Saved Words',
      noHistory: 'No search history yet',
      noFavorites: 'No favorites yet',
      clear: 'Clear',
      origin: 'Origin',
      definition: 'Definition',
      example: 'Example',
      synonyms: 'Synonyms',
      antonyms: 'Antonyms',
      meaning: 'Meaning',
      pronunciation: 'Pronunciation',
      translation: 'Translation',
      audio: 'Audio',
      speak: 'Speak',
      addToFavorites: 'Add to favorites',
      removeFromFavorites: 'Remove from favorites',
      playPronunciation: 'Play pronunciation',
      speakWord: 'Speak word',
      wordNotFound: 'Word not found',
      tryAgain: 'Try Again',
      searching: 'Searching dictionaries...',
      error: 'Oops! Something went wrong',
      audioUnavailable: 'Audio playback unavailable',
      more: 'more'
    },
    'pt-BR': {
      searchPlaceholder: 'Buscar uma palavra...',
      welcome: 'Bem-vindo ao Englytics',
      welcomeDesc: 'Pesquise qualquer palavra em inglês para obter definições detalhadas, exemplos, pronúncia e traduções.',
      tryWords: 'Experimente estas palavras:',
      definitions: 'Definições',
      thesaurus: 'Tesauro',
      examples: 'Exemplos',
      wordNetwork: 'Rede de Palavras',
      semanticSimilarity: 'Similaridade Semântica',
      usageExamples: 'Exemplos de Uso',
      recentSearches: 'Pesquisas Recentes',
      savedWords: 'Palavras Salvas',
      noHistory: 'Nenhum histórico de pesquisa ainda',
      noFavorites: 'Nenhum favorito ainda',
      clear: 'Limpar',
      origin: 'Origem',
      definition: 'Definição',
      example: 'Exemplo',
      synonyms: 'Sinônimos',
      antonyms: 'Antônimos',
      meaning: 'Significado',
      pronunciation: 'Pronúncia',
      translation: 'Tradução',
      audio: 'Áudio',
      speak: 'Falar',
      addToFavorites: 'Adicionar aos favoritos',
      removeFromFavorites: 'Remover dos favoritos',
      playPronunciation: 'Reproduzir pronúncia',
      speakWord: 'Falar palavra',
      wordNotFound: 'Palavra não encontrada',
      tryAgain: 'Tentar Novamente',
      searching: 'Pesquisando nos dicionários...',
      error: 'Ops! Algo deu errado',
      audioUnavailable: 'Reprodução de áudio indisponível',
      more: 'mais'
    }
  };

  const t = texts[language];

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        const savedFavorites = localStorage.getItem('dictionaryFavorites');
        const savedHistory = localStorage.getItem('dictionaryHistory');
        const savedTheme = localStorage.getItem('dictionaryTheme');
        const savedLanguage = localStorage.getItem('dictionaryLanguage');
        const savedTranslations = localStorage.getItem('translationCache');

        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
        if (savedLanguage) setLanguage(savedLanguage as Language);
        if (savedTranslations) setTranslationCache(JSON.parse(savedTranslations));
      } catch (err) {
        console.error('Error loading persisted data:', err);
      }
    };

    loadPersistedData();
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.className = theme;
    try {
      localStorage.setItem('dictionaryTheme', theme);
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  }, [theme]);

  // Translation function
  const translateText = useCallback(async (text: string, cacheKey?: string): Promise<string> => {
    if (language === 'en') return text;
    
    const key = cacheKey || text;
    const cached = translationCache[key];
    
    // Cache valid for 24 hours
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.text;
    }

    try {
      const response = await fetch('https://api.mymemory.translated.net/get', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const url = new URL('https://api.mymemory.translated.net/get');
        url.searchParams.append('q', text);
        url.searchParams.append('langpair', 'en|pt-br');
        
        const translationResponse = await fetch(url.toString());
        const data = await translationResponse.json();
        
        if (data.responseData && data.responseData.translatedText) {
          const translatedText = data.responseData.translatedText;
          
          // Update cache
          const newCache = {
            ...translationCache,
            [key]: {
              text: translatedText,
              timestamp: Date.now()
            }
          };
          
          setTranslationCache(newCache);
          
          try {
            localStorage.setItem('translationCache', JSON.stringify(newCache));
          } catch (err) {
            console.error('Error saving translation cache:', err);
          }
          
          return translatedText;
        }
      }
    } catch (err) {
      console.error('Translation failed:', err);
    }
    
    return text; // Return original text if translation fails
  }, [language, translationCache]);

  // Translate definitions and examples
  const translateDefinitionsAndExamples = useCallback(async (definitions: DictionaryResponse[]) => {
    if (language === 'en') return;

    const definitionsToTranslate: {[key: string]: string} = {};
    const examplesToTranslate: {[key: string]: string} = {};

    definitions.forEach(def => {
      def.meanings.forEach(meaning => {
        meaning.definitions.forEach((definition, defIndex) => {
          const defKey = `${def.word}-${meaning.partOfSpeech}-${defIndex}`;
          definitionsToTranslate[defKey] = definition.definition;
          
          if (definition.example) {
            const exampleKey = `${def.word}-${meaning.partOfSpeech}-${defIndex}-example`;
            examplesToTranslate[exampleKey] = definition.example;
          }
        });
      });
    });

    // Translate definitions
    const defPromises = Object.entries(definitionsToTranslate).map(async ([key, text]) => {
      const translated = await translateText(text, key);
      return [key, translated];
    });

    // Translate examples
    const examplePromises = Object.entries(examplesToTranslate).map(async ([key, text]) => {
      const translated = await translateText(text, key);
      return [key, translated];
    });

    try {
      const defResults = await Promise.all(defPromises);
      const exampleResults = await Promise.all(examplePromises);

      const newDefTranslations: {[key: string]: string} = {};
      const newExampleTranslations: {[key: string]: string} = {};

      defResults.forEach(([key, translation]) => {
        newDefTranslations[key] = translation as string;
      });

      exampleResults.forEach(([key, translation]) => {
        newExampleTranslations[key] = translation as string;
      });

      setDefinitionTranslations(newDefTranslations);
      setExampleTranslations(newExampleTranslations);
    } catch (err) {
      console.error('Error translating definitions:', err);
    }
  }, [language, translateText]);

  // API functions
  const fetchDefinitions = useCallback(async (word: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? t.wordNotFound : 'Failed to fetch data');
      }
      
      const data = await response.json();
      setDefinitions(data);
      
      // Translate definitions and examples if needed
      await translateDefinitionsAndExamples(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setDefinitions([]);
    } finally {
      setLoading(false);
    }
  }, [t.wordNotFound, translateDefinitionsAndExamples]);

  const fetchRelatedWords = useCallback(async (word: string) => {
    try {
      const [synonyms, triggers, adjectives] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${word}`).then(res => res.json()),
        fetch(`https://api.datamuse.com/words?rel_trg=${word}`).then(res => res.json()),
        fetch(`https://api.datamuse.com/words?rel_jjb=${word}`).then(res => res.json())
      ]);

      const combined = [...synonyms, ...triggers, ...adjectives]
        .filter((v, i, a) => a.findIndex(t => t.word === v.word) === i)
        .sort((a, b) => b.score - a.score)
        .slice(0, 30);

      setRelatedWords(combined);
    } catch (err) {
      console.error('Failed to load related words:', err);
    }
  }, []);

  const fetchTranslation = useCallback(async (word: string) => {
    if (language === 'en') {
      setTranslation(null);
      return;
    }
    
    try {
      const translated = await translateText(word, `main-word-${word}`);
      setTranslation({
        text: translated,
        source: 'Português'
      });
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslation(null);
    }
  }, [language, translateText]);

  // Handler functions
  const addToHistory = useCallback((word: string) => {
    const newHistory = [
      word.toLowerCase(),
      ...history.filter(w => w.toLowerCase() !== word.toLowerCase())
    ].slice(0, 15);
    
    setHistory(newHistory);
    try {
      localStorage.setItem('dictionaryHistory', JSON.stringify(newHistory));
    } catch (err) {
      console.error('Error saving history:', err);
    }
  }, [history]);

  const handleSearch = useCallback(async (searchWord: string) => {
    if (!searchWord.trim()) return;
    
    setWord(searchWord);
    addToHistory(searchWord);
    
    await Promise.all([
      fetchDefinitions(searchWord),
      fetchRelatedWords(searchWord),
      fetchTranslation(searchWord)
    ]);
  }, [fetchDefinitions, fetchRelatedWords, fetchTranslation, addToHistory]);

  const toggleFavorite = useCallback((word: string) => {
    const newFavorites = favorites.includes(word)
      ? favorites.filter(w => w !== word)
      : [...favorites, word];
    
    setFavorites(newFavorites);
    try {
      localStorage.setItem('dictionaryFavorites', JSON.stringify(newFavorites));
    } catch (err) {
      console.error('Error saving favorites:', err);
    }
  }, [favorites]);

  const playAudio = useCallback((url: string) => {
    if (audioPlaying || !url) return;
    
    setAudioPlaying(true);
    const audio = new Audio(url);
    audio.play()
      .catch(err => {
        console.error('Audio playback failed:', err);
        setError(t.audioUnavailable);
      })
      .finally(() => setAudioPlaying(false));
  }, [audioPlaying, t.audioUnavailable]);

  const speakWord = useCallback((text: string) => {
    if (speaking || !('speechSynthesis' in window)) return;
    
    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [speaking]);

 

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('dictionaryLanguage', lang);
    } catch (err) {
      console.error('Error saving language:', err);
    }
    
    // Clear translations when changing language
    setDefinitionTranslations({});
    setExampleTranslations({});
    
    if (word) {
      fetchTranslation(word);
      if (definitions.length > 0) {
        translateDefinitionsAndExamples(definitions);
      }
    }
  }, [word, definitions, fetchTranslation, translateDefinitionsAndExamples]);

  // Components
  const Header = () => (
    <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 sticky top-0 z-50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <h1 className={`text-2xl font-bold flex items-center ${window.innerWidth <= 768 ? 'text-black' : 'text-white'}`}>
          <img 
            src="/gitbook.svg" 
            alt="Logo" 
            className={`mr-2 w-6 h-6 ${window.innerWidth <= 768 ? '' : 'filter invert'}`} 
          />
          <span>Englytics</span>
        </h1>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );

  const LanguageSwitcher = () => (
    <div className="flex space-x-2">
      <button 
        className={`px-3 py-1 rounded-md text-sm font-medium ${language === 'en' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
        onClick={() => changeLanguage('en')}
        title="English"
        aria-label="Switch to English"
      >
        <span className="mr-1">🇺🇸</span>
        <span>EN</span>
      </button>
      <button 
        className={`px-3 py-1 rounded-md text-sm font-medium ${language === 'pt-BR' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
        onClick={() => changeLanguage('pt-BR')}
        title="Português"
        aria-label="Switch to Portuguese"
      >
        <span className="mr-1">🇧🇷</span>
        <span>PT-BR</span>
      </button>   
    </div>
  );


  const SearchForm = () => (
    <form 
      className="mb-6"
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('search') as HTMLInputElement;
        handleSearch(input.value);
      }}
    >
      <div className="relative">
        <input
          name="search"
          type="text"
          placeholder={t.searchPlaceholder}
          defaultValue={word}
          disabled={loading}
          aria-label="Search input"
          className="w-full p-4 pl-6 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <button 
          type="submit" 
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          disabled={loading}
          aria-label="Search"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">🔍</span>
          )}
        </button>
      </div>
    </form>
  );

  const WordDisplay = () => {
    if (!definitions.length) return null;
    
    const firstDef = definitions[0];
    const phonetic = firstDef.phonetics?.find(p => p.audio && p.text) || 
                     firstDef.phonetics?.find(p => p.text);
    const audio = firstDef.phonetics?.find(p => p.audio)?.audio;

    return (
      <section className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold dark:text-white flex items-center">
              {firstDef.word}
              <span className="ml-2 text-sm px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100 rounded">
                English
              </span>
            </h2>
            {phonetic?.text && (
              <div className="mt-1 text-gray-600 dark:text-gray-400">
                <span className="font-medium">{t.pronunciation}:</span>
                <span className="ml-2 font-mono">/{phonetic.text}/</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              className={`p-2 rounded-full ${favorites.includes(firstDef.word) ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`}
              onClick={() => toggleFavorite(firstDef.word)}
              aria-label={favorites.includes(firstDef.word) 
                ? t.removeFromFavorites
                : t.addToFavorites}
              title={favorites.includes(firstDef.word) 
                ? t.removeFromFavorites
                : t.addToFavorites}
            >
              {favorites.includes(firstDef.word) ? '★' : '☆'}
            </button>
            
            {audio && (
              <button
                className={`p-2 rounded-full ${audioPlaying ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => playAudio(audio)}
                disabled={audioPlaying}
                aria-label={t.playPronunciation}
                title={t.playPronunciation}
              >
                {audioPlaying ? (
                  <span className="flex items-center">
                    <span className="w-4 h-4 mr-1 bg-indigo-500 rounded-full animate-pulse"></span>
                    🔊
                  </span>
                ) : '🔊'}
              </button>
            )}
            
            <button
              className={`p-2 rounded-full ${speaking ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => speakWord(firstDef.word)}
              disabled={speaking}
              aria-label={t.speakWord}
              title={t.speakWord}
            >
              {speaking ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 mr-1 bg-indigo-500 rounded-full animate-pulse"></span>
                  🗣
                </span>
              ) : '🗣'}
            </button>
          </div>
        </div>
        
        {translation && (
          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
            <div className="flex items-center mb-1">
              <span className="font-medium text-indigo-800 dark:text-indigo-200">{t.translation}:</span>
              <span className="ml-2 text-xs px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100 rounded">
                {translation.source}
              </span>
            </div>
            <span className="text-indigo-700 dark:text-indigo-200">{translation.text}</span>
          </div>
        )}
        
        {firstDef.origin && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{t.origin}</h4>
            <p className="text-gray-700 dark:text-gray-300">{firstDef.origin}</p>
          </div>
        )}
      </section>
    );
  };

  const MeaningCard = ({ meaning, wordIndex }: { 
    meaning: DictionaryResponse['meanings'][0], 
    wordIndex: number 
  }) => (
    <article className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="mb-4 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full inline-block text-sm font-medium">
        {meaning.partOfSpeech}
      </div>
      
      <div className="space-y-4">
        {meaning.definitions.slice(0, 5).map((def, i) => {
          const defKey = `${definitions[wordIndex].word}-${meaning.partOfSpeech}-${i}`;
          const exampleKey = `${definitions[wordIndex].word}-${meaning.partOfSpeech}-${i}-example`;
          
          return (
            <div key={i} className="pl-2 border-l-4 border-indigo-200 dark:border-indigo-800">
              <div className="mb-2">
                <div className="flex items-start">
                  <span className="mr-2 font-medium text-gray-500 dark:text-gray-400">{i + 1}.</span>
                  <div>
                    <div className="mb-2">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t.definition}:</span>
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                          English
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{def.definition}</p>
                    </div>
                    
                    {language === 'pt-BR' && definitionTranslations[defKey] && (
                      <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded mb-1 inline-block">
                          Português
                        </span>
                        <p className="text-gray-800 dark:text-gray-200">{definitionTranslations[defKey]}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {def.example && (
                <div className="ml-6 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t.example}:</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                        English
                      </span>
                    </div>
                    <p className="italic text-gray-800 dark:text-gray-200">"{def.example}"</p>
                  </div>
                  
                  {language === 'pt-BR' && exampleTranslations[exampleKey] && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded">
                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-500 rounded mb-1 inline-block">
                        Português
                      </span>
                      <p className="italic text-gray-800 dark:text-gray-200">"{exampleTranslations[exampleKey]}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {(meaning.synonyms.length > 0 || meaning.antonyms.length > 0) && (
        <div className="mt-4 space-y-3">
          {meaning.synonyms.length > 0 && (
            <div>
              <strong className="text-gray-700 dark:text-gray-300">{t.synonyms}: </strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {meaning.synonyms.slice(0, 5).map((syn, i) => (
                  <button 
                    key={i}
                    className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full transition-colors"
                    onClick={() => handleSearch(syn)}
                    title={`Search for ${syn}`}
                  >
                    <span className="text-xs mr-1 px-1 py-0.5 bg-indigo-200 dark:bg-indigo-700 rounded">
                      EN
                    </span>
                    {syn}
                  </button>
                ))}
                {meaning.synonyms.length > 5 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
                    +{meaning.synonyms.length - 5} {t.more}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {meaning.antonyms.length > 0 && (
            <div>
              <strong className="text-gray-700 dark:text-gray-300">{t.antonyms}: </strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {meaning.antonyms.slice(0, 5).map((ant, i) => (
                  <button 
                    key={i}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-800 dark:text-red-200 rounded-full transition-colors"
                    onClick={() => handleSearch(ant)}
                    title={`Search for ${ant}`}
                  >
                    <span className="text-xs mr-1 px-1 py-0.5 bg-red-200 dark:bg-red-700 rounded">
                      EN
                    </span>
                    {ant}
                  </button>
                ))}
                {meaning.antonyms.length > 5 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
                    +{meaning.antonyms.length - 5} {t.more}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );

  const ThesaurusPanel = () => (
    <section className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.wordNetwork}</h3>
      
      <div className="flex flex-wrap gap-3">
        {relatedWords.slice(0, 50).map((word, i) => {
          const strength = Math.min(3, Math.floor(word.score / 200));
          const sizeClasses = [
            'text-sm',    // strength 0
            'text-base',  // strength 1
            'text-lg',    // strength 2
            'text-xl'     // strength 3
          ];
          
          return (
            <button
              key={i}
              className={`px-3 py-1 rounded-full transition-all hover:scale-105 ${sizeClasses[strength]} ${
                strength === 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                strength === 1 ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' :
                strength === 2 ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100' :
                'bg-indigo-300 dark:bg-indigo-700 text-indigo-900 dark:text-indigo-100'
              }`}
              onClick={() => handleSearch(word.word)}
              aria-label={`Search for ${word.word}`}
              title={`Score: ${word.score}`}
            >
              {(() => {
                let bgClass = '';
                if (strength === 0) bgClass = 'bg-gray-200 dark:bg-gray-600';
                else if (strength === 1) bgClass = 'bg-indigo-200 dark:bg-indigo-800';
                else if (strength === 2) bgClass = 'bg-indigo-300 dark:bg-indigo-700';
                else bgClass = 'bg-indigo-400 dark:bg-indigo-600';
                return (
                  <span className={`text-xs mr-1 px-1 py-0.5 ${bgClass} rounded`}>
                    EN
                  </span>
                );
              })()}
              {word.word}
            </button>
          );
        })}
      </div>
      
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.semanticSimilarity}</h4>
        <div className="space-y-3">
          {relatedWords.slice(0, 10).map((word, i) => (
            <div key={i} className="flex items-center">
              <button
                className="w-32 text-left text-sm text-gray-700 dark:text-gray-300 hover:underline truncate"
                onClick={() => handleSearch(word.word)}
                title={`Search for ${word.word}`}
              >
                <span className="text-xs mr-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                  EN
                </span>
                {word.word}
              </button>
              <div className="flex-1 mx-2 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${Math.min(100, word.score / 10)}%` }}
                />
              </div>
              <div className="w-12 text-right text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {Math.round(word.score)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const ExamplesPanel = () => (
    <section className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.usageExamples}</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {definitions[0].meanings.flatMap((meaning, meaningIndex) =>
          meaning.definitions
            .filter(def => def.example)
            .map((def, i) => {
              const exampleKey = `${definitions[0].word}-${meaning.partOfSpeech}-${i}-example`;
              const defKey = `${definitions[0].word}-${meaning.partOfSpeech}-${i}`;
              
              return (
                <div key={`${meaningIndex}-${i}`} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center mb-1">
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded mr-2">
                          English
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.example}:</span>
                      </div>
                      <p className="italic text-gray-800 dark:text-gray-200">"{def.example}"</p>
                    </div>
                    
                    {language === 'pt-BR' && exampleTranslations[exampleKey] && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900 rounded">
                        <div className="flex items-center mb-1">
                          <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded mr-2">
                            Português
                          </span>
                          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{t.example}:</span>
                        </div>
                        <p className="italic text-indigo-800 dark:text-indigo-200">"{exampleTranslations[exampleKey]}"</p>
                      </div>
                    )}
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.meaning}:</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded mr-2">
                          English
                        </span>
                        <p className="text-gray-800 dark:text-gray-200">{def.definition}</p>
                      </div>
                      
                      {language === 'pt-BR' && definitionTranslations[defKey] && (
                        <div>
                          <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded mr-2">
                            Português
                          </span>
                          <p className="text-gray-800 dark:text-gray-200">{definitionTranslations[defKey]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </section>
  );

  const HistoryPanel = () => (
    <aside className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex justify-between items-center">
        {t.recentSearches}
        {history.length > 0 && (
          <button 
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => {
              setHistory([]);
              try {
                localStorage.removeItem('dictionaryHistory');
              } catch (err) {
                console.error('Error clearing history:', err);
              }
            }}
            aria-label="Clear history"
          >
            {t.clear}
          </button>
        )}
      </h3>
      
      {history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t.noHistory}</p>
      ) : (
        <ul className="space-y-1">
          {history.map((item, i) => (
            <li key={i}>
              <button 
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${item === word ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => handleSearch(item)}
              >
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded mr-2">
                  EN
                </span>
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  const FavoritesPanel = () => (
    <aside className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex justify-between items-center">
        {t.savedWords}
        {favorites.length > 0 && (
          <button 
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => {
              setFavorites([]);
              try {
                localStorage.removeItem('dictionaryFavorites');
              } catch (err) {
                console.error('Error clearing favorites:', err);
              }
            }}
            aria-label="Clear favorites"
          >
            {t.clear}
          </button>
        )}
      </h3>
      
      {favorites.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t.noFavorites}</p>
      ) : (
        <ul className="space-y-1">
          {favorites.map((item, i) => (
            <li key={i} className="group relative">
              <button 
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${item === word ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => handleSearch(item)}
              >
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded mr-2">
                  EN
                </span>
                {item}
              </button>
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item);
                }}
                aria-label={`Remove ${item} from favorites`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  const LoadingIndicator = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-800 dark:text-gray-200">{t.searching}</p>
      </div>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="p-6 bg-red-50 dark:bg-red-900 rounded-lg text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">{t.error}</h3>
      <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
      <button 
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        onClick={() => handleSearch(word)}
      >
        {t.tryAgain}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>  
      <div className="dark:bg-gray-900 min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col-reverse lg:flex-row gap-6 md:gap-8">
            {/* Side panels: mobile below, desktop left */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              <div className="sticky top-4 md:top-6 space-y-4 md:space-y-6">
                {/* Painéis laterais sem barra de pesquisa */}
                <HistoryPanel />
                <FavoritesPanel />
              </div>
            </div>
            {/* Main content */}
            <main className="w-full lg:w-3/4">
              {/* Barra de pesquisa sempre no topo */}
              <div className="mb-6">
                <SearchForm />
              </div>
              {loading && <LoadingIndicator />}
              {error ? (
                <ErrorDisplay />
              ) : definitions.length > 0 ? (
                <>
                  <WordDisplay />
                  {/* Tabs: scrollable on mobile */}
                  <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-4 md:mb-6 no-scrollbar">
                    <button
                      className={`flex-1 min-w-[120px] px-2 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === 'definitions' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      onClick={() => setActiveTab('definitions')}
                    >
                      {t.definitions}
                    </button>
                    <button
                      className={`flex-1 min-w-[120px] px-2 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === 'thesaurus' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      onClick={() => setActiveTab('thesaurus')}
                    >
                      {t.thesaurus}
                    </button>
                    <button
                      className={`flex-1 min-w-[120px] px-2 py-2 text-sm md:text-base font-medium whitespace-nowrap ${activeTab === 'examples' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      onClick={() => setActiveTab('examples')}
                    >
                      {t.examples}
                    </button>
                  </div>
                  <div className="tab-content">
                    {activeTab === 'definitions' && (
                      <div className="space-y-4 md:space-y-6">
                        {definitions[0].meanings.map((meaning, i) => (
                          <MeaningCard key={i} meaning={meaning} wordIndex={0} />
                        ))}
                      </div>
                    )}
                    {activeTab === 'thesaurus' && <ThesaurusPanel />}
                    {activeTab === 'examples' && <ExamplesPanel />}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 md:py-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-3 md:mb-4">{t.welcome}</h2>
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">{t.welcomeDesc}</p>
                  <div className="max-w-md mx-auto">
                    <p className="text-gray-700 dark:text-gray-400 mb-2 md:mb-3">{t.tryWords}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['hello', 'beautiful', 'dictionary', 'learn', 'language'].map((word) => (
                        <button
                          key={word}
                          className="px-3 py-2 text-sm md:px-4 md:py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full transition-colors"
                          onClick={() => handleSearch(word)}
                        >
                          <span className="text-xs px-1 py-0.5 md:px-1.5 md:py-0.5 bg-indigo-200 dark:bg-indigo-800 rounded mr-1">
                            EN
                          </span>
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}