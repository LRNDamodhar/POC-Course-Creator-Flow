# Template Recommender Tool

A tool that recommends appropriate learning content templates based on topic, module, and lesson descriptions.

## Features

- **Smart Recommendations**: Analyzes lesson content and suggests the best templates
- **Keyword Matching**: Uses intelligent keyword detection to match content with templates
- **Category-based Filtering**: Templates are organized by categories (interactive, informational, engaging, etc.)
- **Scoring System**: Ranks templates by relevance score
- **REST API**: Includes Express.js routes for easy integration

## Installation

No additional dependencies needed - uses the existing Express.js setup.

## Usage

### 1. As a Module

```javascript
const { recommendTemplates } = require('./tools/templateRecommender');

const result = recommendTemplates({
  topic: 'Introduction to JavaScript',
  module: 'Module 1: Getting Started',
  lesson: 'Watch this video demonstration of how to set up your development environment',
  learningObjective: 'Students will be able to install and configure their IDE',
  complexity: 'basic' // Options: 'basic', 'intermediate', 'advanced'
});

console.log(result.recommendations);
```

### 2. Via REST API

#### Recommend Templates
```bash
POST /api/templates/recommend
Content-Type: application/json

{
  "topic": "Data Structures",
  "module": "Module 3: Arrays and Objects",
  "lesson": "Take this quiz to test your understanding",
  "learningObjective": "Evaluate student comprehension",
  "complexity": "intermediate"
}
```

#### Get All Templates
```bash
GET /api/templates/all
```

#### Get Templates by Category
```bash
GET /api/templates/category/interactive
```

Categories: `interactive`, `informational`, `engaging`, `assessment`, `multimedia`, `clickable`

#### Search Templates by Keyword
```bash
GET /api/templates/search?keyword=video
```

## Template Categories

### Interactive
- `saq` - Self Assessment Questions (multiple choice, single answer)
- `saqVideo` - Video-based assessments
- `binaryList` - Binary choice questions (true/false, yes/no)
- `consult` - Scenario-based learning and case studies

### Informational
- `textGraphic` - Text content with optional images
- `coreImage` - Image-focused content with descriptions
- `video` - Video content with panels and transcripts
- `podcast` - Audio-based content

### Engaging
- `selectAndReveal` - Click-to-reveal interactive content
- `selectAndRevealHotSpots` - Interactive images with clickable hotspots
- `popup` - Content that expands with additional details
- `timeline` - Chronological or sequential information
- `slideShow` - Sequential content or conversations

## Keyword Mapping

The tool uses smart keyword detection:

| Keywords | Recommended Template |
|----------|---------------------|
| video, watch, demonstration | `video` |
| question, quiz, test, assessment | `saq` |
| true/false, yes/no, categorize | `binaryList` |
| scenario, case study, decision | `consult` |
| explore, discover, reveal | `selectAndReveal` |
| hotspot, clickable areas | `selectAndRevealHotSpots` |
| timeline, sequence, chronology | `timeline` |
| conversation, dialogue, story | `slideShow` |

## Example Responses

### Video-based Lesson
Input:
```json
{
  "topic": "Introduction to JavaScript",
  "lesson": "Watch this video demonstration..."
}
```

Recommendations:
1. **VIDEO** (Score: 3.5) - Best for visual demonstrations
2. **TEXTGRAPHIC** (Score: 0.5) - For informational content

### Assessment/Quiz
Input:
```json
{
  "topic": "Data Structures",
  "lesson": "Take this quiz to test your understanding..."
}
```

Recommendations:
1. **SAQ** (Score: 3.5) - Suitable for testing knowledge
2. **BINARYLIST** (Score: 0.5) - For categorization

### Interactive Exploration
Input:
```json
{
  "topic": "Human Anatomy",
  "lesson": "Explore this interactive diagram. Click on different areas..."
}
```

Recommendations:
1. **SELECTANDREVEAL** (Score: 2.0) - Good for interactive discovery
2. **SELECTANDREVEALHOTSPOTS** (Score: 1.5) - For interactive images

## Testing

Run the test file to see examples:
```bash
node tools/test-template-recommender.js
```

## API Integration

The template routes are already integrated into the main server (`server.js`):

```javascript
const templateRoutes = require('./tools/templateRoutes');
app.use('/api/templates', templateRoutes');
```

## Response Format

```json
{
  "input": {
    "topic": "...",
    "module": "...",
    "lesson": "...",
    "learningObjective": "...",
    "complexity": "intermediate"
  },
  "recommendations": [
    {
      "templateName": "video",
      "template": { /* template structure */ },
      "score": 3.5,
      "reason": "Contains video-related keywords...",
      "category": "multimedia",
      "usage": "Use for video-based learning content"
    }
  ],
  "totalTemplatesAvailable": 8
}
```

## Available Functions

- `recommendTemplates(input)` - Get template recommendations
- `getAllTemplates()` - List all available templates
- `getTemplatesByCategory(category)` - Filter templates by category
- `searchTemplates(keyword)` - Search templates by keyword

## Files

- `tools/templateRecommender.js` - Main recommendation logic
- `tools/templateRoutes.js` - Express routes
- `tools/test-template-recommender.js` - Test examples
- `templates.json` - Template definitions
- `TEMPLATE_RECOMMENDER_README.md` - This file

## Future Enhancements

- Machine learning-based recommendations
- User feedback integration
- Template usage analytics
- Custom keyword mappings
- Multi-language support
