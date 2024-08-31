import { withSessionRoute, setOpenAIApiKey } from "@/lib/settings";

export default withSessionRoute(async function handler(req, res) {
  if (req.method === 'POST') {
    const { apiKey } = req.body;
    await setOpenAIApiKey(req, apiKey);
    res.status(200).json({ message: 'API key saved successfully' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});