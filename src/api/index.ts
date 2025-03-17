
import express from 'express';
import { fetchModels, generateStream } from './openaiProxy';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Endpoint to fetch models
app.post('/api/models', async (req, res) => {
  try {
    const { apiKey, baseUrl } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const models = await fetchModels(apiKey, baseUrl);
    res.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch models' });
  }
});

// Endpoint to handle streaming
app.post('/api/chat', async (req, res) => {
  try {
    const { apiKey, baseUrl, params } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const stream = await generateStream(apiKey, baseUrl, params);
    
    // Set appropriate headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream the response to the client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in chat stream:', error);
    res.status(500).json({ error: error.message || 'Stream error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
