export function getOpenAIApiKey() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('openaiApiKey');
  }
  return null;
}

export function setOpenAIApiKey(apiKey) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('openaiApiKey', apiKey);
  }
}