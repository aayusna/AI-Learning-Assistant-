const AIBanner = ({ powered = true, className = '' }) => {
  if (powered !== false) return null;

  return (
    <div className={`ai-offline-banner ${className}`}>
      <strong>Offline mode</strong> — OpenAI quota or API key issue. Showing basic results.
      Add billing at{' '}
      <a
        href="https://platform.openai.com/account/billing"
        target="_blank"
        rel="noreferrer"
      >
        platform.openai.com
      </a>{' '}
      and set <code>OPENAI_API_KEY</code> in <code>.env</code> for full AI features.
    </div>
  );
};

export default AIBanner;
