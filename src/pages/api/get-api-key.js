import { withSessionRoute, getOpenAIApiKey } from "@/lib/settings";

export default withSessionRoute(async function handler(req, res) {
  if (req.method === 'GET') {
    const apiKey = await getOpenAIApiKey(req);
    res.status(200).json({ apiKey });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});