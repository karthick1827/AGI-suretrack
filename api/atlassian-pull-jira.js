const { handleAtlassianRoute } = require('./_atlassian-handlers.js');

function handler(req, res) {
  return handleAtlassianRoute('pull-jira', req, res);
}

export default handler;
export { handler };
