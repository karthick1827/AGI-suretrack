const { handleAtlassianRoute } = require('./_atlassian-handlers.js');

function handler(req, res) {
  return handleAtlassianRoute('sync-confluence', req, res);
}

export default handler;
export { handler };
