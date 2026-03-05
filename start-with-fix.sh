#!/bin/bash

# Quick Start Backend with Template Fix
# This will start the backend server with the updated code

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🚀 STARTING BACKEND WITH TEMPLATE FIX"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📝 What was fixed:"
echo "   - Changed markModified() to use correct path: messages.X.courseOutline"
echo "   - Direct session.save() instead of updateMessage()"
echo "   - This ensures nested template field is persisted"
echo ""
echo "🔍 Watch for these logs when you accept a template:"
echo "   [DB Service] ═══════════════...═══════════════"
echo "   [DB Service] ACCEPTING TEMPLATE FOR LESSON"
echo "   [DB Service] Marked path as modified: messages.X.courseOutline"
echo "   [DB Service] ✓ Outline saved successfully"
echo "   [DB Service] Template data saved: { templateName: ..., templateType: ... }"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

cd /Users/damodhar.meshram/cam/backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Start the server
echo "🎬 Starting server..."
echo ""
npm start
