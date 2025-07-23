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

type Language = 'en' | 'pt' | 'es';

export default function DictionaryApp() {
  // Estados principais
  const [word, setWord] = useState('');
  const [definitions, setDefinitions] = useState<DictionaryResponse[]>([]);
  const [relatedWords, setRelatedWords] = useState<RelatedWord[]>([]);
  const [translation, setTranslation] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'definitions' | 'thesaurus' | 'examples'>('definitions');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Efeitos para carregar dados iniciais
  useEffect(() => {
    const loadPersistedData = () => {
      const savedFavorites = localStorage.getItem('dictionaryFavorites');
      const savedHistory = localStorage.getItem('dictionaryHistory');
      const savedTheme = localStorage.getItem('dictionaryTheme');
      const savedLanguage = localStorage.getItem('dictionaryLanguage');

      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
      if (savedLanguage) setLanguage(savedLanguage as Language);
    };

    loadPersistedData();
  }, []);

  // Aplicar tema
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('dictionaryTheme', theme);
  }, [theme]);

  // Funções de API
  const fetchDefinitions = useCallback(async (word: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Word not found' : 'Failed to fetch data');
      }
      
      const data = await response.json();
      setDefinitions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setDefinitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (language === 'en') return;
    
    try {
      const targetLang = language === 'pt' ? 'pt' : 'es';
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: word,
          source: 'en',
          target: targetLang
        })
      });
      
      const data = await response.json();
      setTranslation(data.translatedText);
    } catch (err) {
      console.error('Translation failed:', err);
    }
  }, [language]);

  // Funções de manipulação
  const handleSearch = useCallback(async (searchWord: string) => {
    if (!searchWord.trim()) return;
    
    setWord(searchWord);
    addToHistory(searchWord);
    
    await Promise.all([
      fetchDefinitions(searchWord),
      fetchRelatedWords(searchWord),
      fetchTranslation(searchWord)
    ]);
  }, [fetchDefinitions, fetchRelatedWords, fetchTranslation]);

  const addToHistory = useCallback((word: string) => {
    const newHistory = [
      word.toLowerCase(),
      ...history.filter(w => w.toLowerCase() !== word.toLowerCase())
    ].slice(0, 15);
    
    setHistory(newHistory);
    localStorage.setItem('dictionaryHistory', JSON.stringify(newHistory));
  }, [history]);

  const toggleFavorite = useCallback((word: string) => {
    const newFavorites = favorites.includes(word)
      ? favorites.filter(w => w !== word)
      : [...favorites, word];
    
    setFavorites(newFavorites);
    localStorage.setItem('dictionaryFavorites', JSON.stringify(newFavorites));
  }, [favorites]);

  const playAudio = useCallback((url: string) => {
    if (audioPlaying || !url) return;
    
    setAudioPlaying(true);
    const audio = new Audio(url);
    audio.play()
      .catch(err => {
        console.error('Audio playback failed:', err);
        setError('Audio playback unavailable');
      })
      .finally(() => setAudioPlaying(false));
  }, [audioPlaying]);

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

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('dictionaryLanguage', lang);
    if (word) fetchTranslation(word);
  }, [word, fetchTranslation]);

  // Componentes internos
  const Header = () => (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">
          <span className="logo-icon">📚</span>
          <span>Englytics</span>
        </h1>
        <div className="header-actions">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );

  const LanguageSwitcher = () => (
    <div className="language-switcher">
      <button 
        className={language === 'en' ? 'active' : ''}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        EN
      </button>
      <button 
        className={language === 'pt' ? 'active' : ''}
        onClick={() => changeLanguage('pt')}
        title="Portuguese"
      >
        PT
      </button>
      <button 
        className={language === 'es' ? 'active' : ''}
        onClick={() => changeLanguage('es')}
        title="Spanish"
      >
        ES
      </button>
    </div>
  );

  const ThemeToggle = () => (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <span className="moon-icon">🌙</span>
      ) : (
        <span className="sun-icon">☀️</span>
      )}
    </button>
  );

  const SearchForm = () => (
    <form 
      className="search-form"
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('search') as HTMLInputElement;
        handleSearch(input.value);
      }}
    >
      <div className="search-input-container">
        <input
          name="search"
          type="text"
          placeholder={language === 'en' 
            ? 'Search for a word...' 
            : language === 'pt' 
              ? 'Buscar uma palavra...' 
              : 'Buscar una palabra...'}
          defaultValue={word}
          disabled={loading}
          aria-label="Search input"
        />
        <button 
          type="submit" 
          className="search-button"
          disabled={loading}
          aria-label="Search"
        >
          {loading ? (
            <span className="spinner"></span>
          ) : (
            <span className="search-icon">🔍</span>
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
      <section className="word-display">
        <div className="word-header">
          <div className="word-title">
            <h2>{firstDef.word}</h2>
            {phonetic?.text && (
              <span className="phonetic">/{phonetic.text}/</span>
            )}
          </div>
          
          <div className="word-actions">
            <button 
              className={`favorite-button ${favorites.includes(firstDef.word) ? 'active' : ''}`}
              onClick={() => toggleFavorite(firstDef.word)}
              aria-label={favorites.includes(firstDef.word) 
                ? 'Remove from favorites' 
                : 'Add to favorites'}
            >
              {favorites.includes(firstDef.word) ? '★' : '☆'}
            </button>
            
            {audio && (
              <button
                className={`audio-button ${audioPlaying ? 'playing' : ''}`}
                onClick={() => playAudio(audio)}
                disabled={audioPlaying}
                aria-label="Play pronunciation"
              >
                {audioPlaying ? '🔊 Playing...' : '🔊 Play'}
              </button>
            )}
            
            <button
              className={`speak-button ${speaking ? 'speaking' : ''}`}
              onClick={() => speakWord(firstDef.word)}
              disabled={speaking}
              aria-label="Speak word"
            >
              {speaking ? '🗣 Speaking...' : '🗣 Speak'}
            </button>
          </div>
        </div>
        
        {translation && language !== 'en' && (
          <div className="translation-box">
            <span className="translation-label">
              {language === 'pt' ? 'Português:' : 'Español:'}
            </span>
            <span className="translation-text">{translation}</span>
          </div>
        )}
        
        {firstDef.origin && (
          <div className="word-origin">
            <h4>Origin</h4>
            <p>{firstDef.origin}</p>
          </div>
        )}
      </section>
    );
  };

  const MeaningCard = ({ meaning }: { meaning: DictionaryResponse['meanings'][0] }) => (
    <article className="meaning-card">
      <div className="part-of-speech-tag">
        {meaning.partOfSpeech}
      </div>
      
      <div className="definitions">
        {meaning.definitions.slice(0, 5).map((def, i) => (
          <div key={i} className="definition-item">
            <div className="definition-meta">
              <span className="definition-number">{i + 1}.</span>
              <p className="definition-text">{def.definition}</p>
            </div>
            
            {def.example && (
              <div className="example">
                <span className="example-label">Example:</span>
                <p className="example-text">"{def.example}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {(meaning.synonyms.length > 0 || meaning.antonyms.length > 0) && (
        <div className="word-relations">
          {meaning.synonyms.length > 0 && (
            <div className="synonyms">
              <strong>Synonyms: </strong>
              {meaning.synonyms.slice(0, 5).map((syn, i) => (
                <button 
                  key={i}
                  className="relation-chip"
                  onClick={() => handleSearch(syn)}
                >
                  {syn}
                </button>
              ))}
              {meaning.synonyms.length > 5 && (
                <span className="more-count">+{meaning.synonyms.length - 5} more</span>
              )}
            </div>
          )}
          
          {meaning.antonyms.length > 0 && (
            <div className="antonyms">
              <strong>Antonyms: </strong>
              {meaning.antonyms.slice(0, 5).map((ant, i) => (
                <button 
                  key={i}
                  className="relation-chip"
                  onClick={() => handleSearch(ant)}
                >
                  {ant}
                </button>
              ))}
              {meaning.antonyms.length > 5 && (
                <span className="more-count">+{meaning.antonyms.length - 5} more</span>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );

  const ThesaurusPanel = () => (
    <section className="thesaurus-panel">
      <h3 className="panel-title">Word Network</h3>
      
      <div className="word-cloud">
        {relatedWords.slice(0, 50).map((word, i) => (
          <button
            key={i}
            className={`word-chip strength-${Math.min(3, Math.floor(word.score / 200))}`}
            onClick={() => handleSearch(word.word)}
            aria-label={`Search for ${word.word}`}
          >
            {word.word}
          </button>
        ))}
      </div>
      
      <div className="similarity-graph">
        <h4 className="graph-title">Semantic Similarity</h4>
        <div className="graph-bars">
          {relatedWords.slice(0, 10).map((word, i) => (
            <div key={i} className="graph-bar-container">
              <div className="graph-bar-label">{word.word}</div>
              <div 
                className="graph-bar" 
                style={{ width: `${Math.min(100, word.score / 10)}%` }}
              />
              <div className="graph-bar-score">{Math.round(word.score)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const ExamplesPanel = () => (
    <section className="examples-panel">
      <h3 className="panel-title">Usage Examples</h3>
      
      <div className="examples-grid">
        {definitions[0].meanings.flatMap(meaning =>
          meaning.definitions
            .filter(def => def.example)
            .map((def, i) => (
              <div key={i} className="example-card">
                <div className="example-content">
                  <p className="example-sentence">"{def.example}"</p>
                  <p className="example-meaning">
                    <strong>Meaning:</strong> {def.definition}
                  </p>
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  );

  const HistoryPanel = () => (
    <aside className="history-panel">
      <h3 className="panel-title">
        Recent Searches
        {history.length > 0 && (
          <button 
            className="clear-button"
            onClick={() => {
              setHistory([]);
              localStorage.removeItem('dictionaryHistory');
            }}
            aria-label="Clear history"
          >
            Clear
          </button>
        )}
      </h3>
      
      {history.length === 0 ? (
        <p className="empty-message">No search history yet</p>
      ) : (
        <ul className="history-list">
          {history.map((item, i) => (
            <li key={i}>
              <button 
                className={`history-item ${item === word ? 'active' : ''}`}
                onClick={() => handleSearch(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  const FavoritesPanel = () => (
    <aside className="favorites-panel">
      <h3 className="panel-title">
        Saved Words
        {favorites.length > 0 && (
          <button 
            className="clear-button"
            onClick={() => {
              setFavorites([]);
              localStorage.removeItem('dictionaryFavorites');
            }}
            aria-label="Clear favorites"
          >
            Clear
          </button>
        )}
      </h3>
      
      {favorites.length === 0 ? (
        <p className="empty-message">No favorites yet</p>
      ) : (
        <ul className="favorites-list">
          {favorites.map((item, i) => (
            <li key={i}>
              <button 
                className={`favorite-item ${item === word ? 'active' : ''}`}
                onClick={() => handleSearch(item)}
              >
                {item}
              </button>
              <button 
                className="remove-favorite"
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
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>Searching dictionaries...</p>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>{error}</p>
      <button 
        className="retry-button"
        onClick={() => handleSearch(word)}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className={`dictionary-app ${theme}`}>
      <Header />
      
      <div className="app-layout">
        <div className="sidebar">
          <SearchForm />
          <HistoryPanel />
          <FavoritesPanel />
        </div>
        
        <main className="main-content">
          {loading && <LoadingIndicator />}
          
          {error ? (
            <ErrorDisplay />
          ) : definitions.length > 0 ? (
            <>
              <WordDisplay />
              
              <div className="content-tabs">
                <button
                  className={`tab-button ${activeTab === 'definitions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('definitions')}
                >
                  Definitions
                </button>
                <button
                  className={`tab-button ${activeTab === 'thesaurus' ? 'active' : ''}`}
                  onClick={() => setActiveTab('thesaurus')}
                >
                  Thesaurus
                </button>
                <button
                  className={`tab-button ${activeTab === 'examples' ? 'active' : ''}`}
                  onClick={() => setActiveTab('examples')}
                >
                  Examples
                </button>
              </div>
              
              <div className="tab-content">
                {activeTab === 'definitions' && (
                  <div className="meanings-container">
                    {definitions[0].meanings.map((meaning, i) => (
                      <MeaningCard key={i} meaning={meaning} />
                    ))}
                  </div>
                )}
                
                {activeTab === 'thesaurus' && <ThesaurusPanel />}
                
                {activeTab === 'examples' && <ExamplesPanel />}
              </div>
            </>
          ) : (
            <div className="welcome-message">
              <h2>Welcome to Englytics Dictionary</h2>
              <p>
                {language === 'en' 
                  ? 'Search for any English word to get detailed definitions, examples, and more.' 
                  : language === 'pt' 
                    ? 'Pesquise qualquer palavra em inglês para obter definições detalhadas, exemplos e mais.' 
                    : 'Busque cualquier palabra en inglés para obtener definiciones detalladas, ejemplos y más.'}
              </p>
              <div className="welcome-examples">
                <p>Try these words:</p>
                <div className="example-words">
                  {['hello', 'beautiful', 'dictionary', 'learn', 'language'].map((word) => (
                    <button
                      key={word}
                      className="example-word"
                      onClick={() => handleSearch(word)}
                    >
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
  );
}