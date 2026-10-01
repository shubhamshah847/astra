import { useState } from 'react';
import { addArticle } from '../api.js';

const emptyForm = { title: '', sourceUrl: '', publishedAt: '', body: '' };

export default function AddArticleForm({ onAdded }) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text: '...' }
  const [saving, setSaving] = useState(false);

  function change(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await addArticle(form);
      if (saved.status === 'failed') {
        setMessage({
          type: 'error',
          text: 'Saved, but the AI failed: ' + saved.errorMessage + ' You can press "Retry AI" on the article card.',
        });
      } else {
        setMessage({ type: 'ok', text: 'Article added and analysed by AI.' });
      }
      setForm(emptyForm);
      onAdded();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setSaving(false);
  }

  return (
    <div className="box">
      <h2>Add an article</h2>
      <form onSubmit={handleSubmit} className="column">
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => change('title', e.target.value)}
        />
        <div className="row">
          <input
            type="text"
            placeholder="Source link (optional, starts with http)"
            value={form.sourceUrl}
            onChange={(e) => change('sourceUrl', e.target.value)}
          />
          <input type="date" value={form.publishedAt} onChange={(e) => change('publishedAt', e.target.value)} />
        </div>
        <textarea
          rows="5"
          placeholder="Paste the article text here (at least 50 characters)"
          value={form.body}
          onChange={(e) => change('body', e.target.value)}
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Analysing with AI...' : 'Add article'}
        </button>
      </form>
      {message && <p className={'message ' + message.type}>{message.text}</p>}
    </div>
  );
}
