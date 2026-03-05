# Backend API with OpenAI Integration

This is a Node.js Express API that integrates with OpenAI to process user input and return AI-generated responses.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the backend directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_openai_api_key
   PORT=3000
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## Kill Process on Port 8000 (if needed)

If port 8000 is in use (or you want to ensure it's free before starting the backend), run:

```bash
lsof -ti:8000 | xargs kill -9
```

This will force-kill any process using port 8000.

## Start the Backend Server

From the `backend` directory, run:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Health Check
- **GET** `/`
- Returns server status

### Turn IT Endpoint
- **POST** `/api/turn`
- Takes user input and returns OpenAI output

**Request Body:**
```json
{
  "input": "Your question or prompt here"
}
```

**Response:**
```json
{
  "success": true,
  "input": "Your question or prompt here",
  "output": "AI generated response",
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

## Example Usage

Using cURL:
```bash
curl -X POST http://localhost:3000/api/turn \
  -H "Content-Type: application/json" \
  -d '{"input": "What is artificial intelligence?"}'
```

Using JavaScript fetch:
```javascript
fetch('http://localhost:3000/api/turn', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: 'What is artificial intelligence?'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Server port (default: 3000)

## Error Handling

The API handles various error cases:
- 400: Missing input
- 401: Invalid OpenAI API key
- 429: Rate limit exceeded
- 500: Internal server error
