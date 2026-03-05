#!/bin/bash

# Quick Test - Template Integration
# Tests template recommendations in chat workflow

echo "🧪 Testing Template Integration in Chat Workflow"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Run integration test
echo "📋 Test 1: Running template integration test..."
echo "------------------------------------------------"
cd /Users/damodhar.meshram/cam/backend
node test-template-integration.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Integration test passed!${NC}"
else
    echo "❌ Integration test failed!"
    exit 1
fi

echo ""
echo "=================================================="
echo ""

# 2. Check if server files are valid
echo "📋 Test 2: Validating server.js syntax..."
echo "------------------------------------------------"
node -c server.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ server.js syntax valid!${NC}"
else
    echo "❌ server.js has syntax errors!"
    exit 1
fi

echo ""
echo "=================================================="
echo ""

# 3. Check template files exist
echo "📋 Test 3: Checking required files..."
echo "------------------------------------------------"

FILES=(
    "templates.json"
    "tools/templateRecommender.js"
    "tools/templateIntegration.js"
    "tools/templateRoutes.js"
    "tools/index.js"
    "server.js"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo "❌ $file (MISSING)"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    echo -e "${GREEN}✅ All required files exist!${NC}"
else
    echo "❌ Some files are missing!"
    exit 1
fi

echo ""
echo "=================================================="
echo ""

# 4. Verify templates.json is valid JSON
echo "📋 Test 4: Validating templates.json..."
echo "------------------------------------------------"
python3 -m json.tool templates.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    TEMPLATE_COUNT=$(node -e "const t = require('./templates.json'); console.log(Object.keys(t).length)")
    echo -e "${GREEN}✅ templates.json is valid! ($TEMPLATE_COUNT templates)${NC}"
else
    echo "❌ templates.json has JSON errors!"
    exit 1
fi

echo ""
echo "=================================================="
echo ""

# Summary
echo "🎉 All Tests Passed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Start the server: npm start"
echo "   2. Test the chat endpoint with template request:"
echo "      curl -X POST http://localhost:3000/api/turn/stream \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"input_as_text\": \"create a template for a quiz\", \"sessionId\": \"test_123\"}'"
echo ""
echo "   3. Update frontend to handle 'template_recommendations' response type"
echo ""
echo "📚 Documentation: TEMPLATE_INTEGRATION_COMPLETE.md"
echo ""
