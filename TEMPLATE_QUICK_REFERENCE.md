# Template Recommender - Quick Reference

## 🚀 Quick Start

### Run Tests
```bash
cd /Users/damodhar.meshram/cam/backend
./test-template-integration.sh
```

### Start Server
```bash
npm start
```

### Test via Chat
Send message: "create a template for a quiz about JavaScript"

## 📁 Key Files

| File | Purpose |
|------|---------|
| `templates.json` | 8 template definitions |
| `tools/templateRecommender.js` | Recommendation engine |
| `tools/templateIntegration.js` | Chat workflow integration |
| `tools/templateRoutes.js` | REST API endpoints |
| `server.js` (line 249) | Detection logic |

## 🔍 Detection Keywords

- "create template"
- "suggest template"
- "recommend template"
- "what template"
- "which template"
- "template for"

## 🎯 Templates Available

| Template | Best For | Keywords |
|----------|----------|----------|
| SAQ | Quizzes, assessments | quiz, test, assessment, question |
| VIDEO | Video content | video, watch, play |
| TEXTGRAPHIC | Text with images | text, image, graphic, diagram |
| CONSULT | Case studies | consult, case, scenario, analyze |
| SELECTANDREVEAL | Interactive exploration | explore, click, reveal, discover |
| BINARYLIST | True/False questions | binary, true/false, yes/no |
| TIMELINE | Chronological content | timeline, chronological, history |
| PODCAST | Audio content | podcast, audio, listen |

## 📊 Scoring

- Video keywords → 3.5 points
- Quiz keywords → 3.5 points
- Interactive keywords → 2.0 points
- Other keywords → 0.5 points
- Complexity bonus: +0.5 (advanced)

## 🔗 API Response

```json
{
  "type": "template_recommendations",
  "recommendations": [{
    "templateName": "saq",
    "score": 3.5,
    "category": "interactive",
    "usage": "Use for assessments",
    "reason": "Contains quiz keywords",
    "template": {...}
  }],
  "actions": [{
    "type": "template_recommendation",
    "label": "Use saq Template",
    "templateData": {...}
  }]
}
```

## 🧪 Test Examples

| Input | Detected? | Top Template |
|-------|-----------|--------------|
| "create quiz template" | ✅ | SAQ (3.5) |
| "video lesson" | ❌ | - |
| "suggest template for video" | ✅ | VIDEO (3.5) |

## 🛠️ Troubleshooting

### Template not detected?
- Check if message contains detection keywords
- Add keyword to `templateIntegration.js` line 14

### Wrong template recommended?
- Adjust keyword weights in `templateRecommender.js` line 8
- Add more specific keywords

### Server errors?
- Check logs: `console.log('[Backend] Template...')`
- Verify templates.json is valid: `python3 -m json.tool templates.json`
- Run tests: `node test-template-integration.js`

## 📚 Documentation

- **Full Guide:** `TEMPLATE_INTEGRATION_COMPLETE.md`
- **Summary:** `TEMPLATE_INTEGRATION_SUMMARY.md`
- **API Docs:** `TEMPLATE_RECOMMENDER_README.md`

## ✅ Status

**Backend:** Complete ✅  
**Frontend:** Pending 🔄  

## 🎯 Next: Frontend

1. Handle `template_recommendations` type in chat component
2. Create template card UI
3. Implement "Use Template" button
4. Add template preview modal

---

**Ready to use!** Send a template request via chat to see it in action.
