export function getOpenAIApiKey() {
  if (typeof window !== 'undefined') {
    const key = localStorage.getItem('openaiApiKey');
    if (key) {
      console.log('OpenAI API key found in localStorage');
      return key;
    }
  }
  console.log('Falling back to environment variable for OpenAI API key');
  return process.env.OPENAI_API_KEY || null;
}

export function setOpenAIApiKey(apiKey) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('openaiApiKey', apiKey);
    console.log('OpenAI API key set in localStorage');
  }
}

export function initializeOpenAIApiKey() {
  if (typeof window !== 'undefined' && !localStorage.getItem('openaiApiKey')) {
    const envApiKey = process.env.OPENAI_API_KEY;
    if (envApiKey) {
      localStorage.setItem('openaiApiKey', envApiKey);
      console.log('OpenAI API key initialized from environment variable');
    } else {
      console.warn('OpenAI API key not found in environment variables');
    }
  }
}
