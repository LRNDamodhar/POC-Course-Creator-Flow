const express = require('express');
const router = express.Router();
const {
  recommendTemplates,
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates
} = require('./templateRecommender');

/**
 * POST /api/templates/recommend
 * Get template recommendations based on input
 */
router.post('/recommend', (req, res) => {
  try {
    const { topic, module, lesson, learningObjective, complexity } = req.body;
    
    if (!topic || !module || !lesson) {
      return res.status(400).json({
        error: 'Missing required fields: topic, module, and lesson are required'
      });
    }
    
    const recommendations = recommendTemplates({
      topic,
      module,
      lesson,
      learningObjective,
      complexity
    });
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error in template recommendation:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /api/templates/all
 * Get all available templates
 */
router.get('/all', (req, res) => {
  try {
    const templates = getAllTemplates();
    res.json({ templates, total: templates.length });
  } catch (error) {
    console.error('Error getting all templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

/**
 * GET /api/templates/category/:category
 * Get templates by category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const templates = getTemplatesByCategory(category);
    res.json({ category, templates, total: templates.length });
  } catch (error) {
    console.error('Error getting templates by category:', error);
    res.status(500).json({ error: 'Failed to get templates by category' });
  }
});

/**
 * GET /api/templates/search
 * Search templates by keyword
 */
router.get('/search', (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ error: 'keyword query parameter is required' });
    }
    
    const results = searchTemplates(keyword);
    res.json({ keyword, results, total: results.length });
  } catch (error) {
    console.error('Error searching templates:', error);
    res.status(500).json({ error: 'Failed to search templates' });
  }
});

module.exports = router;
