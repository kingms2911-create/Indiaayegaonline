export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Vercel ki default limit ko bada kar 10mb kar diya hai
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, mediaData, mimeType } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const GEMINI_API_KEY = "AIzaSyCd09CJY2zbBBoVIvXyuyoTK1WNS6-RITs";
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        let contentsPayload = [];

        if (mediaData && mimeType) {
            contentsPayload = [
                {
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: mediaData
                            }
                        }
                    ]
                }
            ];
        } else {
            contentsPayload = [
                {
                    parts: [{ text: prompt }]
                }
            ];
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: contentsPayload })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            const scriptText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ script: scriptText });
        } else if (data.error) {
            return res.status(500).json({ error: data.error.message });
        } else {
            return res.status(500).json({ error: 'Unexpected response from AI API' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
