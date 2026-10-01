// All calls to the server are in this file.

// Send a request and return the JSON. If the server sent an error, throw it.
async function request(url, options) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export function getArticles(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return request('/api/articles?' + params.toString());
}

export function getStats() {
  return request('/api/articles/stats');
}

export function addArticle(article) {
  return request('/api/articles', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(article),
  });
}

export function retryArticle(id) {
  return request('/api/articles/' + id + '/retry', { method: 'POST' });
}

export function makeBrief(topic) {
  return request('/api/brief', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ topic }),
  });
}
