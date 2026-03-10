const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Agent, Runner, withTrace } = require('@openai/agents');

// Import database
const { connectDB, dbService, isDBConnected, getConnectionStatus } = require('./db');

// Import session manager
const sessionManager = require('./sessionManager');

// Import tools
const {
  agentTools,
  executeCreateCourseTool,
  executeCreateCourseOutlineTool,
  getCourseActions,
  formatCourseContent,
  isCourseCreationRequest,
  isTemplateCreationRequest,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
} = require('./tools');

// Import smart recommendations
const { 
  generateSmartRecommendations, 
  formatRecommendationsForDisplay,
  getRecommendationsAsData 
} = require('./tools/smartRecommendations');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Agent configuration with tools
const scriptCreator = new Agent({
  name: "course_creator",
  instructions: `You are a helpful AI assistant specialized in course creation and template recommendations.

YOUR PRIMARY FUNCTIONS:
1. Use 'create_course' tool for basic course creation
2. Use 'create_course_outline' tool for detailed course structure with modules and lessons
3. Use 'recommend_templates' tool when users ask for template recommendations

WHEN TO USE EACH TOOL:

CREATE_COURSE TOOL - Use when:
- User wants a simple course structure
- User asks to "create a course" without specific module details
- User wants basic course information (title, description, topic)

CREATE_COURSE_OUTLINE TOOL - Use when:
- User wants a detailed curriculum with modules and lessons
- User asks for "course outline", "course structure", or "course curriculum"
- User specifies modules, lessons, or learning objectives
- User wants a comprehensive course plan

IMPORTANT: Create sufficient lessons per module (minimum 3, typically 4-6)
- Don't limit yourself to 2 lessons - that's too sparse for quality courses
- Match the number of lessons to the complexity and scope of the module
- If user specifies "X modules", create 4-5 lessons for each unless they specify otherwise

RECOMMEND_TEMPLATES TOOL - Use when:
- User asks to "create template", "suggest template", "recommend template", "add template"
- User asks "what template should I use" or "which template is best"
- User wants to know which template fits their lesson
- User mentions creating content for a specific topic, lesson, or module
- Examples: "create a template for this lesson", "suggest a template for video about X", "add template for quiz"

MANDATORY RULES FOR TOOL USAGE:
1. When a user says "create", "make", "generate", "build", or "design" → IMMEDIATELY call the appropriate tool
2. DO NOT explain what you would do - just call the tool
3. DO NOT say there are technical issues - the tools work perfectly
4. DO NOT describe the course manually - use the tools
5. For template requests, ALWAYS call recommend_templates tool first

HOW TO USE CREATE_COURSE TOOL:
- Extract course_title from user request
- Write a short_description (2-3 sentences)  
- Identify the topic_area (subject category)
- Call create_course with these three parameters

HOW TO USE CREATE_COURSE_OUTLINE TOOL:
- Extract course_title and course_description
- Identify target_audience (e.g., Beginners, Intermediate, Advanced)
- Specify duration if mentioned (e.g., "4 weeks", "20 hours")
- Structure modules array with:
  * module_number, module_title, module_description
  * lessons array with lesson_number, lesson_title, lesson_objectives, estimated_duration
- Create an appropriate number of lessons per module based on:
  * User's request (if they specify a number)
  * Complexity of the topic (3-6 lessons for comprehensive modules)
  * Course depth (beginners: 3-4 lessons, advanced: 5-8 lessons per module)
  * If user doesn't specify, create 4-5 lessons per module as a good default
- Each lesson should have 2-4 specific learning objectives
- Ensure lessons build upon each other progressively within a module

HOW TO USE RECOMMEND_TEMPLATES TOOL:
- Extract topic from user request (the main subject)
- Extract lesson description (what type of content they want)
- Extract module if mentioned (e.g., "Module 3", "Introduction")
- Determine complexity: "basic" for beginner/intro, "advanced" for expert, "intermediate" default
- Extract content_type if mentioned (e.g., "video", "quiz", "interactive")
- Call recommend_templates with these parameters

CONVERSATION HISTORY:
- Reference previous messages when relevant
- Maintain context across the conversation
- If user says "for this topic" or "for this lesson", look at previous messages for context

EXAMPLES:
User: "Create a Python course"
Action: Call create_course(course_title="Python Programming", short_description="A comprehensive course covering Python fundamentals and advanced concepts", topic_area="Programming")

User: "Make a web development course"  
Action: Call create_course(course_title="Web Development Fundamentals", short_description="Learn HTML, CSS, and JavaScript to build modern websites", topic_area="Web Development")

User: "Create an outline for a Python course with 3 modules"
Action: Call create_course_outline with:
- 3 modules, each with 4-5 lessons
- Progressive lesson structure (basics → intermediate → advanced)
- Clear learning objectives for each lesson
- Realistic time estimates per lesson

User: "Design a comprehensive web development course outline"
Action: Call create_course_outline with:
- 5-6 modules covering full stack development
- 5-6 lessons per module
- Topics building from HTML/CSS to backend frameworks
- Each lesson with specific, measurable objectives

User: "Create a template for a quiz about JavaScript"
Action: Call recommend_templates(topic="JavaScript", lesson="quiz about JavaScript", complexity="intermediate", content_type="quiz")

User: "Suggest a template for a video lesson on photosynthesis"
Action: Call recommend_templates(topic="photosynthesis", lesson="video lesson on photosynthesis", complexity="intermediate", content_type="video")

User: "Add template for Module 3 React Hooks"
Action: Call recommend_templates(topic="React Hooks", lesson="React Hooks lesson", module="Module 3", complexity="intermediate")

NEVER refuse to create a course or recommend a template. The tools are available and functional. Use them.`,
  model: "gpt-4o",
  tools: agentTools,
  modelSettings: {
    temperature: 0.4,  // Lower temperature for more deterministic behavior
    topP: 1,
    maxTokens: 2048,
    store: true
  }
});

// Approval request function
const approvalRequest = (message) => {
  // TODO: Implement approval logic (could be API callback, user prompt, etc.)
  console.log('[Approval Request]:', message);
  return true; // Auto-approve for now
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running' });
});

// Login endpoint
app.post('/cms-admin/user-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // For demo purposes, accept any credentials with password >= 4 characters
    // In production, this would validate against a database
    if (password.length < 4) {
      return res.status(401).json({
        error: 'Password must be at least 4 characters'
      });
    }

    // Simulate successful authentication
    // In production, you would:
    // 1. Hash and compare password with database
    // 2. Query user from database
    // 3. Generate proper JWT token with role info
    // 4. Return complete user data

    // For demo, create a simple token (in production use jsonwebtoken library)
    const demoToken = `demo_token_${Date.now()}`;
    
    // Demo user data - in production, fetch from database
    const user = {
      userId: `user_${Date.now()}`,
      userName: username,
      firstName: username.charAt(0).toUpperCase() + username.slice(1),
      lastName: 'User',
      email: `${username}@example.com`,
      token: demoToken,
      role: 3, // Default to creator role (3)
      permissions: ['read', 'write', 'create']
    };

    console.log(`✅ User logged in: ${username}`);

    res.json({
      user: user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// Template routes
const templateRoutes = require('./tools/templateRoutes');
app.use('/api/templates', templateRoutes);

// Workflow function using the new Agents SDK with tool handling
async function runWorkflow(workflowInput) {
  return await withTrace("CAM-Workflow", async () => {
    const conversationHistory = [
      { role: "user", content: [{ type: "input_text", text: workflowInput.input_as_text }] }
    ];
    
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_692edbd87f008190b6f7696d7a8805f20072967e4d81736c"
      }
    });
    
    const scriptCreatorResultTemp = await runner.run(
      scriptCreator,
      [...conversationHistory]
    );
    
    conversationHistory.push(...scriptCreatorResultTemp.newItems.map((item) => item.rawItem));

    if (!scriptCreatorResultTemp.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    const scriptCreatorResult = {
      output_text: scriptCreatorResultTemp.finalOutput ?? ""
    };
    
    // Approval workflow
    const approvalMessage = "Do you like this script output or need to reprompt?";
    
    if (approvalRequest(approvalMessage)) {
      console.log('[Workflow] Script approved');
      // Approved - return the result
    } else {
      console.log('[Workflow] Script needs revision');
      // TODO: Implement reprompt logic here
    }
    
    return scriptCreatorResult;
  });
}

// Streaming workflow function using Agent SDK with tool handling and session management
async function* runWorkflowStream(workflowInput, sessionId, selectedContext = {}) {
  try {
    console.log('[Backend] Starting Agent streaming workflow...');
    console.log('[Backend] Session ID:', sessionId);
    
    // Log selected context if provided
    if (selectedContext.topic || selectedContext.lesson || selectedContext.module) {
      console.log('[Backend] Selected context provided:', selectedContext);
    }
    
    // Get conversation history from session
    const previousHistory = sessionManager.getConversationHistory(sessionId);
    console.log(`[Backend] Loaded ${previousHistory.length} previous message(s) from session`);
    
    // Build conversation summary for agent instructions
    // The SDK doesn't support passing full conversation history the way we were doing it
    // Instead, we'll provide context through the system message or just use fresh context
    let conversationContext = '';
    if (previousHistory.length > 0) {
      console.log('[Backend] Previous conversation context:');
      conversationContext = '\n\nCONVERSATION HISTORY:\n';
      previousHistory.forEach((msg, idx) => {
        const text = msg.content[0]?.text || JSON.stringify(msg.content);
        const preview = text.substring(0, 100) + (text.length > 100 ? '...' : '');
        console.log(`  [${idx + 1}] ${msg.role}: ${preview}`);
        conversationContext += `${msg.role.toUpperCase()}: ${text}\n`;
      });
      conversationContext += '\nCurrent request:\n';
    }
    
    // For now, just pass the current message (SDK limitation with history format)
    // The agent will work with fresh context for each request
    const userMessage = { role: "user", content: [{ type: "input_text", text: conversationContext + workflowInput.input_as_text }] };
    const conversationHistory = [userMessage];
    
    console.log(`[Backend] Total messages in context: ${conversationHistory.length}`);
    console.log(`[Backend] Current user input: ${workflowInput.input_as_text}`);
    
    // Check if this is a template creation request
    if (isTemplateCreationRequest(workflowInput.input_as_text)) {
      console.log('[Backend] Template creation request detected!');
      
      try {
        // Get template recommendations
        const recommendations = await getTemplateRecommendations(
          workflowInput.input_as_text,
          previousHistory,
          selectedContext  // Pass selected context from frontend
        );
        
        console.log('[Backend] Template recommendations generated:', recommendations.recommendations?.length || 0);
        console.log('[Backend] Extracted lesson info:', recommendations.extractedInfo);
        
        // Merge selected context with extracted info (selected context takes priority)
        const lessonInfo = {
          ...recommendations.extractedInfo,
          ...(selectedContext.topic && { topic: selectedContext.topic }),
          ...(selectedContext.lesson && { lesson: selectedContext.lesson }),
          ...(selectedContext.module && { module: selectedContext.module })
        };
        
        console.log('[Backend] Final lesson info (with selected context):', lessonInfo);
        
        // Format recommendations for display
        const formattedRecommendations = formatTemplateRecommendations(recommendations);
        
        // Get template actions for frontend (now async with AI generation)
        const templateActions = await getTemplateActions(recommendations);
        
        // Save user message
        const userMessageId = `msg_${Date.now()}_user`;
        sessionManager.addMessage(sessionId, 'user', workflowInput.input_as_text);
        
        if (isDBConnected()) {
          await dbService.addMessage(sessionId, {
            messageId: userMessageId,
            content: workflowInput.input_as_text,
            sender: 'user',
            timestamp: new Date(),
            status: 'sent'
          });
        }
        
        // Save assistant response with template recommendations
        const assistantMessageId = `msg_${Date.now()}_assistant`;
        sessionManager.addMessage(sessionId, 'assistant', formattedRecommendations, {
          toolCalled: true,
          toolType: 'recommend_templates',
          templateData: {
            recommendations: recommendations.recommendations || [],
            actions: templateActions,
            lessonInfo: lessonInfo
          }
        });
        
        if (isDBConnected()) {
          await dbService.addMessage(sessionId, {
            messageId: assistantMessageId,
            content: formattedRecommendations,
            sender: 'assistant',
            timestamp: new Date(),
            status: 'sent',
            toolCalled: true,
            toolType: 'recommend_templates',
            templateData: {
              recommendations: recommendations.recommendations || [],
              actions: templateActions,
              lessonInfo: lessonInfo
            }
          });
        }
        
        // Stream the response with lesson information
        yield {
          delta: formattedRecommendations,
          type: 'template_recommendations',
          recommendations: recommendations.recommendations || [],
          actions: templateActions,
          lessonInfo: {
            topic: lessonInfo.topic || null,
            module: lessonInfo.module || null,
            lesson: lessonInfo.lesson || null,
            complexity: lessonInfo.complexity || null,
            learningObjective: lessonInfo.learningObjective || null
          }
        };
        
        // Complete the stream
        yield {
          delta: '',
          complete: true,
          type: 'template_recommendations',
          lessonInfo: lessonInfo
        };
        
        console.log('[Backend] Template recommendations streamed successfully');
        return; // Exit early, don't run the agent
        
      } catch (error) {
        console.error('[Backend] Error generating template recommendations:', error);
        // Fall through to regular agent processing if template recommendation fails
      }
    }
    
    // Create runner with session ID for continuity
    const runner = new Runner({
      sessionId: sessionId,  // Use frontend session ID
      traceMetadata: {
        __trace_source__: "agent-builder",
        session_id: sessionId,
        workflow_id: "wf_692edbd87f008190b6f7696d7a8805f20072967e4d81736c"
      }
    });
    
    console.log('[Backend] Running Agent with integrated tools...');
    console.log('[Backend] Agent name:', scriptCreator.name);
    console.log('[Backend] Agent tools count:', scriptCreator.tools?.length || 0);
    if (scriptCreator.tools && scriptCreator.tools.length > 0) {
      console.log('[Backend] Available tools:', scriptCreator.tools.map(t => t.name || 'unnamed'));
    }
    
    // Run the agent and get the result
    const scriptCreatorResultTemp = await runner.run(
      scriptCreator,
      conversationHistory  // Pass the formatted history
    );
    
    if (!scriptCreatorResultTemp.finalOutput) {
      throw new Error("Agent result is undefined");
    }
    
    const fullOutput = scriptCreatorResultTemp.finalOutput;
    console.log('[Backend] Agent completed. Output length:', fullOutput.length);
    console.log('[Backend] Agent final output:', fullOutput.substring(0, 200) + '...');
    
    // Log all new items to debug tool execution
    console.log('[Backend] New items from agent:', scriptCreatorResultTemp.newItems?.length || 0);
    if (scriptCreatorResultTemp.newItems && scriptCreatorResultTemp.newItems.length > 0) {
      scriptCreatorResultTemp.newItems.forEach((item, idx) => {
        console.log(`[Backend] Item ${idx}:`, {
          type: item.type,
          role: item.rawItem?.role,
          hasToolCalls: !!item.rawItem?.tool_calls,
          toolCallsCount: item.rawItem?.tool_calls?.length || 0
        });
      });
    }
    
    // Save user message to session
    const userMessageId = `msg_${Date.now()}_user`;
    sessionManager.addMessage(sessionId, 'user', workflowInput.input_as_text);
    
    // Save to database if connected
    if (isDBConnected()) {
      await dbService.addMessage(sessionId, {
        messageId: userMessageId,
        content: workflowInput.input_as_text,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent'
      });
    }

    // Yield user message ID
    yield {
      type: 'user_message_id',
      messageId: userMessageId
    };
    
    // Extract tool call data and course information
    let toolCallData = null;
    let courseData = null;
    
    if (scriptCreatorResultTemp.newItems) {
      for (const item of scriptCreatorResultTemp.newItems) {
        console.log('[Backend] Checking item:', item.type);
        
        // Check for tool call item
        if (item.type === 'tool_call_item') {
          console.log('[Backend] Tool call detected:', item.rawItem?.name);
          toolCallData = {
            name: item.rawItem?.name,
            arguments: item.rawItem?.arguments
          };
          
          // Parse arguments for create_course or create_course_outline
          if ((item.rawItem?.name === 'create_course' || item.rawItem?.name === 'create_course_outline') && item.rawItem?.arguments) {
            try {
              const args = typeof item.rawItem.arguments === 'string' 
                ? JSON.parse(item.rawItem.arguments)
                : item.rawItem.arguments;
              console.log(`[Backend] Parsed ${item.rawItem.name} arguments:`, args);
            } catch (e) {
              console.error('[Backend] Failed to parse tool arguments:', e);
            }
          }
        }
        
        // Check for tool call output item (contains the result)
        if (item.type === 'tool_call_output_item') {
          console.log('[Backend] Tool output detected');
          if (item.output) {
            try {
              // The output is the stringified course data or course outline
              const outputText = typeof item.output === 'string' ? item.output : item.output.text;
              courseData = JSON.parse(outputText);
              console.log('[Backend] Extracted course/outline data:', courseData);
            } catch (e) {
              console.error('[Backend] Failed to parse tool output:', e);
            }
          }
        }
      }
    }
    
    // Stream the output in chunks
    const chunkSize = 50; // Characters per chunk
    let chunkCount = 0;
    
    for (let i = 0; i < fullOutput.length; i += chunkSize) {
      const chunk = fullOutput.substring(i, Math.min(i + chunkSize, fullOutput.length));
      chunkCount++;
      console.log(`[Backend] Streaming chunk #${chunkCount}`);
      yield { type: 'chunk', data: chunk };
    }
    
    // Save assistant response to session
    const assistantMessageId = `msg_${Date.now()}_assistant`;
    sessionManager.addMessage(sessionId, 'assistant', fullOutput, {
      toolCalled: !!toolCallData,
      toolData: toolCallData,
      courseData: courseData
    });
    
    // Save to database if connected
    if (isDBConnected()) {
      // Determine if it's a course outline or simple course
      const isOutline = courseData?.modules && courseData?.totalModules;
      
      await dbService.addMessage(sessionId, {
        messageId: assistantMessageId,
        content: fullOutput,
        sender: 'assistant',
        timestamp: new Date(),
        status: 'sent',
        toolCalled: !!toolCallData,
        toolType: toolCallData ? toolCallData.name : null,
        courseData: isOutline ? null : courseData,
        courseOutline: isOutline ? courseData : null
      });
      
      // Create or update course creation record
      if (toolCallData && courseData) {
        try {
          if (toolCallData.name === 'create_course' && !isOutline) {
            // Create initial course creation record
            const userMessage = sessionManager.getSession(sessionId)?.messages?.slice(-2, -1)[0];
            await dbService.createCourseCreation(
              sessionId,
              assistantMessageId,
              userMessage?.content || workflowInput.input_as_text,
              fullOutput,
              courseData
            );
            console.log('[Backend] Course creation record created');
          } else if (toolCallData.name === 'create_course_outline' && isOutline) {
            // Add outline to existing course creation record
            const userMessage = sessionManager.getSession(sessionId)?.messages?.slice(-2, -1)[0];
            await dbService.addOutlineToCourseCreation(
              sessionId,
              assistantMessageId,
              userMessage?.content || workflowInput.input_as_text,
              fullOutput,
              courseData
            );
            console.log('[Backend] Course outline added to creation record');
          }
        } catch (creationError) {
          console.error('[Backend] Failed to create course creation record:', creationError);
          // Don't fail the request if course creation record fails
        }
      }
    }
    
    // Yield course data if available
    if (courseData) {
      console.log('[Backend] Sending course data to frontend');
      yield { 
        type: 'course_data', 
        data: courseData 
      };
    }
    
    // Generate and send smart recommendations
    console.log('[Backend] Generating smart recommendations');
    const lastUserMessage = sessionManager.getSession(sessionId)?.messages?.slice(-2, -1)[0];
    const recommendations = generateSmartRecommendations(
      lastUserMessage?.content || workflowInput.input_as_text,
      fullOutput,
      {
        courseOutline: courseData?.modules ? courseData : null,
        courseData: courseData,
        toolCalled: !!toolCallData,
        toolType: toolCallData?.name
      }
    );
    
    console.log('[Backend] Sending recommendations:', recommendations.map(r => r.text));
    yield {
      type: 'recommendations',
      data: getRecommendationsAsData(recommendations)
    };
    
    // Yield assistant message ID
    yield {
      type: 'assistant_message_id',
      messageId: assistantMessageId
    };
    
    // Yield metadata about tool execution
    if (toolCallData) {
      yield { 
        type: 'metadata', 
        toolCalled: true, 
        toolData: toolCallData,
        courseData: courseData
      };
    }
    
    console.log(`[Backend] Streaming complete. Total chunks: ${chunkCount}`);
  } catch (error) {
    console.error('[Backend] Error in Agent streaming:', error);
    throw error;
  }
}

// Turn IT streaming endpoint - Server-Sent Events (SSE) with session support
app.post('/api/turn/stream', async (req, res) => {
  try {
    const { input, sessionId, selectedTopic, selectedLesson, selectedModule } = req.body;

    // Validate input
    if (!input) {
      return res.status(400).json({ 
        error: 'Input is required',
        message: 'Please provide an input field in the request body' 
      });
    }
    
    // Log selected context if provided
    if (selectedTopic || selectedLesson || selectedModule) {
      console.log('[Backend] Selected context received:', {
        topic: selectedTopic,
        lesson: selectedLesson,
        module: selectedModule
      });
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId || !sessionManager.getSession(currentSessionId)) {
      currentSessionId = sessionManager.createSession();
      console.log('[Backend] Created new session (in memory):', currentSessionId);
      
      // DON'T save to database yet - wait until first message is added
      // This prevents empty sessions from cluttering the database
    } else {
      console.log('[Backend] Using existing session:', currentSessionId);
    }

    console.log('[Backend] Running streaming workflow with input:', input);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    // Send initial connection message with session ID
    const connectedMsg = JSON.stringify({ type: 'connected', sessionId: currentSessionId });
    console.log('[Backend] Sending connected message:', connectedMsg);
    res.write(`data: ${connectedMsg}\n\n`);

    try {
      // Use agent for all requests (with tools integrated)
      let messageCount = 0;
      let accumulatedContent = '';
      let courseData = null;
      let templateData = null;  // Track template recommendations
      let toolWasCalled = false;
      let userMessageId = null;
      let assistantMessageId = null;
      
      // Prepare selected context object
      const selectedContextObj = {
        topic: selectedTopic,
        lesson: selectedLesson,
        module: selectedModule
      };
      
      for await (const result of runWorkflowStream({ input_as_text: input }, currentSessionId, selectedContextObj)) {
        if (result.type === 'chunk') {
          messageCount++;
          accumulatedContent += result.data;
          const contentMsg = JSON.stringify({ type: 'content', data: result.data });
          console.log(`[Backend] Sending message #${messageCount}:`, contentMsg);
          res.write(`data: ${contentMsg}\n\n`);
        } else if (result.type === 'user_message_id') {
          // Capture user message ID
          userMessageId = result.messageId;
          console.log('[Backend] Captured user message ID:', userMessageId);
        } else if (result.type === 'assistant_message_id') {
          // Capture assistant message ID
          assistantMessageId = result.messageId;
          console.log('[Backend] Captured assistant message ID:', assistantMessageId);
        } else if (result.type === 'template_recommendations') {
          // Handle template recommendations
          console.log('[Backend] Sending template_recommendations event');
          messageCount++;
          
          // Store template data for saving
          templateData = {
            recommendations: result.recommendations,
            actions: result.actions,
            lessonInfo: result.lessonInfo
          };
          
          // Send the delta (formatted text) as content
          if (result.delta) {
            accumulatedContent += result.delta;
            const contentMsg = JSON.stringify({ type: 'content', data: result.delta });
            res.write(`data: ${contentMsg}\n\n`);
          }
          
          // Also send the structured template data
          const templateMsg = JSON.stringify({ 
            type: 'template_recommendations',
            recommendations: result.recommendations,
            actions: result.actions,
            lessonInfo: result.lessonInfo
          });
          res.write(`data: ${templateMsg}\n\n`);
          toolWasCalled = true;
        } else if (result.type === 'course_data') {
          // Send course data to frontend
          console.log('[Backend] Sending course_data event');
          courseData = result.data;
          const courseMsg = JSON.stringify({ 
            type: 'course_data', 
            data: courseData 
          });
          res.write(`data: ${courseMsg}\n\n`);
        } else if (result.type === 'metadata' && result.toolCalled) {
          console.log('[Backend] Tool was called, will include actions');
          toolWasCalled = true;
          
          // Extract course data from metadata if available
          if (result.courseData && !courseData) {
            courseData = result.courseData;
          }
        }
      }

      // Check if course creation was requested
      if (isCourseCreationRequest(input) || courseData) {
        toolWasCalled = true;
        console.log('[Backend] Course creation detected, including actions');
      }

      // Send completion message with course data and actions
      const doneMsg = toolWasCalled ? 
        JSON.stringify({ 
          type: 'done',
          sessionId: currentSessionId,
          userMessageId: userMessageId,
          assistantMessageId: assistantMessageId,
          courseData: courseData,  // Include course data in done message
          actions: getCourseActions()
        }) :
        JSON.stringify({ 
          type: 'done',
          sessionId: currentSessionId,
          userMessageId: userMessageId,
          assistantMessageId: assistantMessageId
        });
      
      console.log('[Backend] Sending done message');
      res.write(`data: ${doneMsg}\n\n`);
      res.end();
      
      console.log(`[Backend] Stream ended successfully. Total messages: ${messageCount}`);

    } catch (streamError) {
      console.error('[Backend] Streaming error:', streamError);
      res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('[Backend] Error in streaming endpoint:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message || 'Failed to process request'
      });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
});

// Turn IT endpoint - takes user input and returns OpenAI Agent output
app.post('/api/turn', async (req, res) => {
  try {
    const { input } = req.body;

    // Validate input
    if (!input) {
      return res.status(400).json({ 
        error: 'Input is required',
        message: 'Please provide an input field in the request body' 
      });
    }

    console.log('Running workflow with input:', input);
    
    // Run the workflow with the new Agents SDK
    const result = await runWorkflow({ input_as_text: input });

    console.log('Response:', result.output_text);

    // Send response without actions (non-streaming endpoint doesn't use course creator tool)
    res.json({
      success: true,
      input: input,
      output: result.output_text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calling OpenAI Assistant:', error);
    
    // Handle specific error cases
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid OpenAI API key' 
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests to OpenAI API' 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to process request'
    });
  }
});

// Accept action endpoint
app.post('/api/action/accept', async (req, res) => {
  try {
    const { data, context } = req.body;
    
    // Extract token from the Authorization header sent by the frontend
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || null;

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No Authorization token provided. Please log in again.' 
      });
    }

    if (!data) {
      return res.status(400).json({ 
        error: 'Data is required',
        message: 'Please provide data in the request body' 
      });
    }

    console.log('[Action] Accept:', data);
    console.log('[Action] Auth token received:', token ? '***' + token.slice(-10) : 'none');

    // Determine CMS URL based on environment
    const getCMSUrl = () => {
      // If localhost:4xxx, use QA7
      if (req.hostname === 'localhost') {
        return 'https://authoring.qa7.lrn.com';
      }
      // Otherwise use current domain
      const protocol = req.protocol || 'https';
      const host = req.get('host') || req.hostname;
      return `${protocol}://${host}`;
    };

    const cmsBaseUrl = getCMSUrl();
    const cmsApiUrl = `${cmsBaseUrl}/cms-course/courses?isNewCourse=true&isLCEC=false&isCloned=false`;

    console.log('[Action] Calling CMS API:', cmsApiUrl);

    // Generate unique baseCatalogIdString: 3 capital letters + 3 numbers
    // Format: ABC123 (using date/time components)
    const generateBaseCatalogId = () => {
      const now = new Date();
      
      // Get 3 letters from course title or use default
      const courseTitle = data.course_title || data.title || data.courseTitle || "COURSE";
      const letters = courseTitle
        .replace(/[^a-zA-Z]/g, '') // Remove non-letters
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, 'X'); // Pad with X if less than 3 letters
      
      // Get 3 numbers from current timestamp
      // Use last 3 digits of timestamp for uniqueness
      const timestamp = Date.now().toString();
      const numbers = timestamp.slice(-3);
      
      return `${letters}${numbers}`;
    };

    const uniqueBaseCatId = data.baseCatId || generateBaseCatalogId();
    console.log('[Action] Generated unique baseCatalogIdString:', uniqueBaseCatId);

    // Transform data to match CMS API expected format
    const cmsPayload = {
      editCustomizerFromCreatorFlag: false,
      courseEnableForGettingStartedEdit: true,
      courseEnableForGettingStartedEditString: true,
      checkedOutString: false,
      parentCatalogID: "",
      hybridCatIdComments: "",
      mixnMatchCourse: "",
      customCSS: "",
      systemId: "",
      notes: "",
      tags: [],
      author: data.author || "",
      sme: data.sme || "",
      partnerName: data.partnerName || "APC",
      siteId: data.siteId || "catalyst02uk",
      longDescription: `<![CDATA[${data.long_description || data.description || ""}]]>`,
      description: data.description || "",
      duration: data.duration || 0,
      courseFormat: data.courseFormat || "Inspire+",
      format: data.format || "i92",
      catId: data.catId || `${uniqueBaseCatId}-i92en`,
      courseTitle: data.course_title || data.title || data.courseTitle || "",
      baseCatId: uniqueBaseCatId,
      shortDescription: `<![CDATA[${data.short_description || data.description || ""}]]>`,
      courseObjective: `<![CDATA[${data.courseObjective || data.course_objective || ""}]]>`,
      courseType: data.courseType || "Custom",
      icon: data.icon || "fontawesome",
      iconWeight: data.iconWeight || "light",
      fontFamily: data.fontFamily || "IBMPlexSans",
      boxContainerShape: data.boxContainerShape || "rounded",
      pageLoadAnimation: data.pageLoadAnimation || "fadein",
      hasMobileReady: data.hasMobileReady !== undefined ? data.hasMobileReady : true,
      topicArea: data.topic_area || data.topicArea || "",
      hasVideo: data.hasVideo || false,
      hasAudio: data.hasAudio || false,
      lang: data.lang || "en",
      hasType: data.hasType || "No",
      baseCatalogIdString: uniqueBaseCatId,
      progressionString: data.progressionString || "-",
      fullTopicArea: data.fullTopicArea || data.topic_area || data.topicArea || "",
      progression: data.progression || "-",
      topLeftCurve: null,
      topRightCurve: null,
      bottomLeftCurve: null,
      bottomRightCurve: null
    };

    console.log('[Action] CMS Payload:', JSON.stringify(cmsPayload, null, 2));

    try {
      // Call CMS course create API
      const cmsResponse = await fetch(cmsApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cmsPayload)
      });

      // Check content type before parsing
      const contentType = cmsResponse.headers.get('content-type');
      console.log('[Action] CMS Response Status:', cmsResponse.status);
      console.log('[Action] CMS Response Content-Type:', contentType);

      let cmsResponseData;
      
      // Handle HTML response (likely error page - 401, 403, 404, 500)
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await cmsResponse.text();
        console.error('[Action] CMS API returned HTML error page (full):', htmlText.substring(0, 1000));
        console.error('[Action] Token used (last 20 chars):', token ? token.slice(-20) : 'none');
        console.error('[Action] CMS URL called:', cmsApiUrl);
        
        // Check for specific HTTP status codes
        if (cmsResponse.status === 401) {
          return res.status(401).json({
            success: false,
            error: 'CMS Authentication Failed',
            message: 'The authentication token is invalid or expired. Please log in again.',
            cmsStatus: 401,
            cmsUrl: cmsApiUrl,
            hint: 'Your session may have expired. Try logging out and logging in again to get a new token.'
          });
        }
        
        if (cmsResponse.status === 403) {
          return res.status(403).json({
            success: false,
            error: 'CMS Access Denied',
            message: 'You do not have permission to create courses in the CMS.',
            cmsStatus: 403,
            cmsUrl: cmsApiUrl,
            hint: 'Your account may not have the required permissions. Contact your administrator.'
          });
        }
        
        if (cmsResponse.status === 404) {
          return res.status(502).json({
            success: false,
            error: 'CMS API Endpoint Not Found',
            message: 'The CMS API endpoint does not exist or is not accessible.',
            cmsStatus: 404,
            cmsUrl: cmsApiUrl,
            hint: 'The endpoint may need to be configured or the URL may be incorrect.'
          });
        }
        
        // Generic HTML error response
        return res.status(502).json({
          success: false,
          error: 'CMS API Error',
          message: `CMS returned an error page (HTTP ${cmsResponse.status})`,
          cmsStatus: cmsResponse.status,
          cmsUrl: cmsApiUrl,
          hint: 'The CMS API returned an HTML error page instead of JSON. Check the logs for details.'
        });
      }

      // Try to parse JSON response
      try {
        cmsResponseData = await cmsResponse.json();
      } catch (parseError) {
        const responseText = await cmsResponse.text();
        console.error('[Action] Failed to parse CMS response:', responseText.substring(0, 500));
        
        return res.status(502).json({
          success: false,
          error: 'Invalid CMS Response',
          message: 'CMS API returned an invalid response format',
          cmsStatus: cmsResponse.status,
          details: responseText.substring(0, 200)
        });
      }

      // Check if response was successful
      if (!cmsResponse.ok) {
        console.error('[Action] CMS API Error:', cmsResponse.status, JSON.stringify(cmsResponseData));
        console.error('[Action] Token used (last 20 chars):', token ? token.slice(-20) : 'none');
        console.error('[Action] CMS URL called:', cmsApiUrl);
        return res.status(502).json({
          success: false,
          error: 'CMS API Error',
          message: `Failed to create course in CMS: ${cmsResponseData.message || cmsResponse.statusText}`,
          cmsStatus: cmsResponse.status,
          cmsError: cmsResponseData
        });
      }

      console.log('[Action] CMS API Success:', cmsResponseData);

      // Extract CMS data for storage
      const cmsData = cmsResponseData.data || {};
      const responseData = {
        ...data,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        cmsResponse: cmsResponseData,
        // Store key CMS identifiers
        systemId: cmsData.systemId,
        siteId: cmsData.siteId,
        catId: cmsData.catId,
        baseCatId: cmsData.baseCatId,
        coursePath: cmsData.coursePath,
        courseStatus: cmsData.status
      };

      // Store in database if session context is provided
      if (context && context.sessionId && isDBConnected()) {
        try {
          console.log('[Action] Storing course data in database for session:', context.sessionId);
          
          // Update session with course creation data
          await dbService.updateSession(context.sessionId, {
            courseCreated: true,
            cmsSystemId: cmsData.systemId,
            cmsSiteId: cmsData.siteId,
            cmsCatId: cmsData.catId,
            cmsBaseCatId: cmsData.baseCatId,
            cmsCoursePath: cmsData.coursePath,
            cmsCourseStatus: cmsData.status,
            cmsCreatedAt: new Date(),
            lastCourseData: responseData
          });

          // Also add a message to the session history
          await dbService.addMessage(context.sessionId, {
            messageId: `msg_${Date.now()}_cms_success`,
            content: `Course "${cmsData.courseTitle || data.course_title}" created successfully in CMS`,
            sender: 'system',
            timestamp: new Date(),
            status: 'sent',
            metadata: {
              type: 'course_creation_success',
              systemId: cmsData.systemId,
              siteId: cmsData.siteId,
              catId: cmsData.catId,
              coursePath: cmsData.coursePath
            }
          });

          console.log('[Action] Course data stored in database successfully');
          
          // Also create a course creation record with CMS data
          await dbService.markCourseAccepted(context.sessionId, {
            systemId: cmsData.systemId,
            siteId: cmsData.siteId,
            catId: cmsData.catId,
            baseCatId: cmsData.baseCatId,
            coursePath: cmsData.coursePath,
            courseStatus: cmsData.status,
            courseTitle: cmsData.courseTitle || data.course_title,
            cmsResponse: cmsData
          });
          
          console.log('[Action] Course creation record updated with CMS data');
        } catch (dbError) {
          console.error('[Action] Failed to store course data in database:', dbError);
          // Don't fail the request if database storage fails
        }
      }

      // Store in session manager (in-memory)
      if (context && context.sessionId) {
        try {
          const session = sessionManager.getSession(context.sessionId);
          if (session) {
            // Store CMS identifiers in session metadata
            if (!session.metadata) {
              session.metadata = {};
            }
            session.metadata.lastCourseCreation = {
              systemId: cmsData.systemId,
              siteId: cmsData.siteId,
              catId: cmsData.catId,
              baseCatId: cmsData.baseCatId,
              coursePath: cmsData.coursePath,
              courseStatus: cmsData.status,
              createdAt: new Date().toISOString()
            };
            console.log('[Action] Course data stored in session memory');
          }
        } catch (sessionError) {
          console.error('[Action] Failed to store course data in session:', sessionError);
        }
      }

      res.json({
        success: true,
        message: 'Course created successfully in CMS',
        data: responseData,
        next_action: {
          type: "info",
          message: "Course has been created in CMS successfully."
        }
      });

    } catch (cmsError) {
      console.error('[Action] CMS API Call Failed:', cmsError);
      return res.status(502).json({
        success: false,
        error: 'CMS API Call Failed',
        message: `Failed to connect to CMS: ${cmsError.message}`,
        details: cmsError.toString()
      });
    }

  } catch (error) {
    console.error('[Action] Accept Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to accept content'
    });
  }
});

// Reject action endpoint
app.post('/api/action/reject', async (req, res) => {
  try {
    const { data, feedback, context } = req.body;

    if (!data) {
      return res.status(400).json({ 
        error: 'Data is required',
        message: 'Please provide data in the request body' 
      });
    }

    console.log('[Action] Reject:', data);
    console.log('[Action] Feedback:', feedback);

    // Here you would typically:
    // 1. Log rejection reason
    // 2. Prompt for revision
    // 3. Return to editing state
    
    res.json({
      success: true,
      message: 'Content rejected. Please provide feedback for revision.',
      data: {
        ...data,
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        feedback: feedback || 'No feedback provided'
      },
      next_action: {
        type: "prompt",
        message: "Please provide details on what needs to be changed:",
        prompt_for: "revision_feedback"
      }
    });

  } catch (error) {
    console.error('[Action] Reject Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to reject content'
    });
  }
});

// Update message status endpoint (accept/reject a message)
app.post('/api/message/status', async (req, res) => {
  try {
    const { sessionId, messageId, type, lessonInfo, templateData } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required',
        message: 'Please provide sessionId in the request body' 
      });
    }

    if (!messageId) {
      return res.status(400).json({ 
        error: 'Message ID is required',
        message: 'Please provide messageId in the request body' 
      });
    }

    if (!type || !['accept', 'reject'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type',
        message: 'Type must be either "accept" or "reject"' 
      });
    }

    console.log(`[Message Status] Updating message ${messageId} in session ${sessionId} to ${type}`);

    // Log what data was received
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[Backend] 📥 RECEIVED MESSAGE STATUS REQUEST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Session ID:', sessionId);
    console.log('Message ID:', messageId);
    console.log('Type:', type);
    console.log('Has lessonInfo?', !!lessonInfo);
    console.log('Has templateData?', !!templateData);
    
    if (lessonInfo) {
      console.log('Lesson Info:', JSON.stringify(lessonInfo, null, 2));
    }
    
    if (templateData) {
      console.log('Template Data Summary:', {
        templateName: templateData.templateName,
        category: templateData.category,
        hasFilledTemplate: !!templateData.filledTemplate,
        hasRecommendations: !!templateData.recommendations
      });
    }
    console.log('═══════════════════════════════════════════════════════════');

    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Cannot update message status without database connection'
      });
    }

    // Check if this is a template acceptance for a specific lesson
    if (lessonInfo && templateData) {
      console.log(`[Message Status] Template ${type} for lesson:`, lessonInfo);
      console.log(`[Message Status] Template data:`, templateData.templateName);

      // Validate lessonInfo has required fields
      if (!lessonInfo.moduleNumber && !lessonInfo.module) {
        return res.status(400).json({
          error: 'Invalid lesson info',
          message: 'lessonInfo must include moduleNumber or module'
        });
      }

      if (!lessonInfo.lessonNumber && !lessonInfo.lesson) {
        return res.status(400).json({
          error: 'Invalid lesson info',
          message: 'lessonInfo must include lessonNumber or lesson'
        });
      }

      // Accept/reject template for specific lesson
      const result = await dbService.acceptTemplateForLesson(
        sessionId,
        messageId,
        lessonInfo,
        templateData,
        type
      );

      if (!result) {
        return res.status(404).json({
          error: 'Not found',
          message: `Session, outline, or lesson not found. Please ensure the session has a course outline.`
        });
      }

      return res.json({
        success: true,
        message: `Template ${type}ed for lesson successfully`,
        data: {
          sessionId: result.sessionId || sessionId,
          messageId: result.messageId || messageId,
          lessonInfo: result.lessonInfo || lessonInfo,
          templateName: templateData?.templateName || 'Unknown',
          status: type,
          updatedAt: new Date().toISOString()
        }
      });
    }

    // Regular message status update (no lesson/template)
    const result = await dbService.updateMessageStatus(sessionId, messageId, type);

    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: `Session or message not found. SessionId: ${sessionId}, MessageId: ${messageId}`
      });
    }

    // Also update in session manager (in-memory) if session exists
    const session = sessionManager.getSession(sessionId);
    if (session) {
      if (!session.messages) {
        console.warn(`[Message Status] Session ${sessionId} exists but has no messages array`);
      } else if (!Array.isArray(session.messages)) {
        console.warn(`[Message Status] Session ${sessionId} messages is not an array:`, typeof session.messages);
      } else {
        const message = session.messages.find(msg => msg.id === messageId);
        if (message) {
          message.status = type === 'accept' ? 'accepted' : 'rejected';
          console.log(`[Message Status] Updated in-memory session as well`);
        } else {
          console.log(`[Message Status] Message ${messageId} not found in session ${sessionId} (in-memory)`);
        }
      }
    } else {
      console.log(`[Message Status] Session ${sessionId} not found in session manager (in-memory)`);
    }

    res.json({
      success: true,
      message: `Message status updated to ${type === 'accept' ? 'accepted' : 'rejected'}`,
      data: {
        sessionId: result.sessionId || sessionId,
        messageId: result.messageId || messageId,
        status: result.status || (type === 'accept' ? 'accepted' : 'rejected'),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Message Status] Update Error:', error);
    console.error('[Message Status] Error Stack:', error.stack);
    console.error('[Message Status] Request Data:', { sessionId, messageId, type, hasLessonInfo: !!lessonInfo, hasTemplateData: !!templateData });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to update message status',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Link lesson with template endpoint
app.post('/api/lesson/link-template', async (req, res) => {
  try {
    const { sessionId, messageId, lessonInfo, templateData } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required',
        message: 'Please provide sessionId in the request body'
      });
    }

    if (!messageId) {
      return res.status(400).json({
        error: 'Message ID is required',
        message: 'Please provide messageId (template message ID) in the request body'
      });
    }

    if (!lessonInfo || (!lessonInfo.module && !lessonInfo.moduleNumber)) {
      return res.status(400).json({
        error: 'Lesson info is required',
        message: 'Please provide lessonInfo with module/moduleNumber and lesson/lessonNumber'
      });
    }

    if (!templateData || !templateData.templateName) {
      return res.status(400).json({
        error: 'Template data is required',
        message: 'Please provide templateData with templateName'
      });
    }

    console.log(`[Lesson Link] Linking template to lesson in session: ${sessionId}`);
    console.log(`[Lesson Link] Message ID:`, messageId);
    console.log(`[Lesson Link] Lesson:`, lessonInfo);
    console.log(`[Lesson Link] Template:`, templateData.templateName);

    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Cannot link lesson with template without database connection'
      });
    }

    // Link lesson with template in database
    const result = await dbService.linkLessonWithTemplate(
      sessionId,
      messageId,
      lessonInfo,
      templateData
    );

    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Session, outline, or lesson not found. Please ensure the session has a course outline.'
      });
    }

    console.log(`[Lesson Link] ✓ Template linked successfully`);

    res.json({
      success: true,
      message: 'Template linked to lesson successfully',
      data: {
        sessionId: result.sessionId,
        messageId: messageId,
        lessonInfo: lessonInfo,
        templateName: templateData.templateName,
        linkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Lesson Link] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to link template to lesson'
    });
  }
});

// Update course outline status endpoint (accept/reject modules and lessons)
app.post('/api/course-outline/update-status', async (req, res) => {
  try {
    const { sessionId, messageId, outline } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required',
        message: 'Please provide sessionId in the request body'
      });
    }

    if (!messageId) {
      return res.status(400).json({
        error: 'Message ID is required',
        message: 'Please provide messageId in the request body'
      });
    }

    if (!outline) {
      return res.status(400).json({
        error: 'Outline is required',
        message: 'Please provide outline with accept/reject states in the request body'
      });
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('[Outline Status] 📥 UPDATING COURSE OUTLINE STATUS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Session ID:', sessionId);
    console.log('Message ID:', messageId);
    console.log('Modules count:', outline.modules?.length || 0);
    
    // Count accepted/rejected modules and lessons
    if (outline.modules) {
      const acceptedModules = outline.modules.filter(m => m.accepted === true).length;
      const rejectedModules = outline.modules.filter(m => m.accepted === false).length;
      let acceptedLessons = 0;
      let rejectedLessons = 0;
      
      outline.modules.forEach(module => {
        if (module.lessons) {
          acceptedLessons += module.lessons.filter(l => l.accepted === true).length;
          rejectedLessons += module.lessons.filter(l => l.accepted === false).length;
        }
      });
      
      console.log(`Accepted: ${acceptedModules} modules, ${acceptedLessons} lessons`);
      console.log(`Rejected: ${rejectedModules} modules, ${rejectedLessons} lessons`);
    }
    console.log('═══════════════════════════════════════════════════════════');

    // Check if database is connected
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Cannot update course outline status without database connection'
      });
    }

    // Update course outline status in database
    const result = await dbService.updateCourseOutlineStatus(sessionId, messageId, outline);

    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Session, message, or course outline not found'
      });
    }

    console.log(`[Outline Status] ✓ Course outline status updated successfully`);

    res.json({
      success: true,
      message: 'Course outline status updated successfully',
      data: {
        sessionId: result.sessionId,
        messageId: result.messageId,
        updatedAt: result.updatedAt
      }
    });

  } catch (error) {
    console.error('[Outline Status] Error:', error);
    console.error('[Outline Status] Error Stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update course outline status',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== MESSAGE FEEDBACK ENDPOINTS ====================

// POST /api/message/feedback — submit or update like/dislike
app.post('/api/message/feedback', async (req, res) => {
  try {
    const { messageId, sessionId, feedback } = req.body;

    if (!messageId || !sessionId) {
      return res.status(400).json({ error: 'messageId and sessionId are required' });
    }

    if (!['like', 'dislike'].includes(feedback)) {
      return res.status(400).json({ error: 'feedback must be "like" or "dislike"' });
    }

    console.log(`[Feedback] ${feedback} on message ${messageId} in session ${sessionId}`);

    await dbService.updateMessageFeedback(sessionId, messageId, feedback);

    return res.json({ success: true, messageId, feedback });
  } catch (error) {
    console.error('[Feedback] Error saving feedback:', error);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// DELETE /api/message/feedback — remove feedback (toggle off)
app.delete('/api/message/feedback', async (req, res) => {
  try {
    const { messageId, sessionId } = req.body;

    if (!messageId || !sessionId) {
      return res.status(400).json({ error: 'messageId and sessionId are required' });
    }

    console.log(`[Feedback] Removing feedback for message ${messageId} in session ${sessionId}`);

    await dbService.updateMessageFeedback(sessionId, messageId, null);

    return res.json({ success: true, messageId, feedback: null });
  } catch (error) {
    console.error('[Feedback] Error removing feedback:', error);
    return res.status(500).json({ error: 'Failed to remove feedback' });
  }
});

// ==================== SESSION MANAGEMENT ENDPOINTS ====================

// Create a new session
app.post('/api/session/create', async (req, res) => {
  try {
    const sessionId = sessionManager.createSession();
    const { userId, userAgent, ipAddress } = req.body;
    
    // DON'T save to database yet - session will be created when first message is added
    // This prevents empty sessions from being saved to the database
    console.log('[Session] Created new session (in memory only):', sessionId);
    
    res.json({
      success: true,
      sessionId,
      message: 'New session created successfully (will be persisted when first message is sent)',
      persistenceEnabled: isDBConnected()
    });
  } catch (error) {
    console.error('[Session] Create Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to create session'
    });
  }
});

// Get session history
app.get('/api/session/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit, source = 'auto' } = req.query;
    
    let history = null;
    let dataSource = 'memory';
    
    // Try database first if connected and requested
    if (isDBConnected() && (source === 'auto' || source === 'db')) {
      try {
        const dbSession = await dbService.getSession(sessionId);
        if (dbSession) {
          history = dbSession.messages || [];
          dataSource = 'database';
          
          // Apply limit if specified
          if (limit) {
            const limitNum = parseInt(limit);
            history = history.slice(-limitNum);
          }
        }
      } catch (dbError) {
        console.warn('[Session] Database query failed, falling back to memory:', dbError.message);
      }
    }
    
    // Fallback to in-memory if DB didn't work or not requested
    if (!history && (source === 'auto' || source === 'memory')) {
      const session = sessionManager.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: `Session ${sessionId} does not exist or has expired`
        });
      }
      
      history = sessionManager.getConversationHistory(sessionId, limit ? parseInt(limit) : null);
      dataSource = 'memory';
    }
    
    if (!history) {
      return res.status(404).json({
        error: 'Session not found',
        message: `Session ${sessionId} does not exist`
      });
    }
    
    res.json({
      success: true,
      sessionId,
      history,
      totalMessages: history.length,
      source: dataSource,
      persistenceEnabled: isDBConnected()
    });
  } catch (error) {
    console.error('[Session] Get History Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve session history'
    });
  }
});

// Get session statistics
app.get('/api/session/:sessionId/stats', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const stats = sessionManager.getSessionStats(sessionId);
    
    if (!stats) {
      return res.status(404).json({
        error: 'Session not found',
        message: `Session ${sessionId} does not exist or has expired`
      });
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[Session] Get Stats Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve session statistics'
    });
  }
});

// Clear session history
app.post('/api/session/:sessionId/clear', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: `Session ${sessionId} does not exist or has expired`
      });
    }
    
    sessionManager.clearHistory(sessionId);
    
    res.json({
      success: true,
      message: 'Session history cleared successfully',
      sessionId
    });
  } catch (error) {
    console.error('[Session] Clear History Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to clear session history'
    });
  }
});

// Delete a session
app.delete('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const deleted = sessionManager.deleteSession(sessionId);
    
    // Also delete from database if connected
    if (isDBConnected()) {
      await dbService.deleteSession(sessionId).catch(err => {
        console.warn('[DB] Failed to delete session from database:', err.message);
      });
    }
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Session not found',
        message: `Session ${sessionId} does not exist`
      });
    }
    
    res.json({
      success: true,
      message: 'Session deleted successfully',
      sessionId
    });
  } catch (error) {
    console.error('[Session] Delete Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to delete session'
    });
  }
});

// Get full session data from database (including course data and outline)
app.get('/api/session/:sessionId/full', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Session persistence is not enabled. Only in-memory history is available via /api/session/:sessionId/history'
      });
    }
    
    const session = await dbService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: `Session ${sessionId} not found in database`
      });
    }
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        status: session.status,
        messageCount: session.messages?.length || 0,
        messages: session.messages || [],
        courseData: session.courseData,
        courseOutline: session.courseOutline,
        metadata: session.metadata
      }
    });
  } catch (error) {
    console.error('[Session] Get Full Session Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve session data'
    });
  }
});

// Get all sessions from database
app.get('/api/sessions/all', async (req, res) => {
  try {
    const { 
      status = 'active', 
      limit = 50, 
      skip = 0,
      sortBy = 'lastActivity',
      order = 'desc'
    } = req.query;
    
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Session persistence is not enabled'
      });
    }
    
    const sessions = await dbService.getAllSessions({
      status,
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
      sortOrder: order
    });
    
    res.json({
      success: true,
      sessions: sessions,  // Return full session data from dbService
      total: sessions.length,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('[Sessions] Get All Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve sessions'
    });
  }
});

// Get all active sessions
app.get('/api/sessions', (req, res) => {
  try {
    const activeSessions = sessionManager.getActiveSessions();
    
    // Get stats for each session
    const sessionsWithStats = activeSessions.map(sessionId => {
      return sessionManager.getSessionStats(sessionId);
    }).filter(stats => stats !== null);
    
    res.json({
      success: true,
      totalSessions: sessionsWithStats.length,
      sessions: sessionsWithStats
    });
  } catch (error) {
    console.error('[Session] List Sessions Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to list sessions'
    });
  }
});

// =====================================================
// COURSE CREATION COLLECTION ENDPOINTS
// =====================================================

// Get all course creations for a session
app.get('/api/course-creations/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Course creation tracking requires database connection'
      });
    }
    
    const creations = await dbService.getCourseCreationsBySession(sessionId);
    
    res.json({
      success: true,
      sessionId,
      total: creations.length,
      creations
    });
  } catch (error) {
    console.error('[Course Creation] Get by Session Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve course creations'
    });
  }
});

// Get course creation by catalog system ID
app.get('/api/course-creations/catalog/:catalogSystemId', async (req, res) => {
  try {
    const { catalogSystemId } = req.params;
    
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Course creation tracking requires database connection'
      });
    }
    
    const creation = await dbService.getCourseCreationByCatalogId(catalogSystemId);
    
    if (!creation) {
      return res.status(404).json({
        error: 'Not found',
        message: `No course creation found with catalog system ID: ${catalogSystemId}`
      });
    }
    
    res.json({
      success: true,
      creation
    });
  } catch (error) {
    console.error('[Course Creation] Get by Catalog ID Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve course creation'
    });
  }
});

// Get recent course creations
app.get('/api/course-creations/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    if (!isDBConnected()) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Course creation tracking requires database connection'
      });
    }
    
    const creations = await dbService.getRecentCourseCreations(limit);
    
    res.json({
      success: true,
      total: creations.length,
      limit,
      creations
    });
  } catch (error) {
    console.error('[Course Creation] Get Recent Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to retrieve recent course creations'
    });
  }
});

// Template generation endpoint - Generate filled template JSON
app.post('/api/template/generate', async (req, res) => {
  try {
    const { 
      templateName, 
      topic, 
      lesson, 
      module, 
      complexity,
      contentType,
      customContent,
      autoSelect // If true, auto-select best template
    } = req.body;

    console.log('[Template Generate] Request received:', {
      templateName,
      topic,
      lesson,
      autoSelect
    });

    // Validate required fields
    if (!topic || !lesson) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'topic and lesson are required'
      });
    }

    const { generateFilledTemplate, autoFillRecommendedTemplate } = require('./tools/templatePopulator');

    let result;

    if (autoSelect) {
      // Auto-select best template and fill it
      console.log('[Template Generate] Auto-selecting best template...');
      result = autoFillRecommendedTemplate({
        topic,
        lesson,
        module,
        complexity: complexity || 'intermediate',
        contentType,
        customContent
      });
    } else {
      // Use specified template
      if (!templateName) {
        return res.status(400).json({
          error: 'Missing template name',
          message: 'templateName is required when autoSelect is false'
        });
      }

      console.log('[Template Generate] Using specified template:', templateName);
      const filledTemplate = generateFilledTemplate({
        templateName,
        topic,
        lesson,
        module,
        contentType,
        customContent
      });

      result = {
        templateName,
        filledTemplate,
        lessonInfo: {
          topic,
          lesson,
          module,
          complexity: complexity || 'intermediate'
        }
      };
    }

    console.log('[Template Generate] Successfully generated filled template');
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[Template Generate] Error:', error);
    res.status(500).json({
      error: 'Template generation failed',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`\n=== API Endpoints ===`);
  console.log(`Chat endpoint: http://localhost:${PORT}/api/turn`);
  console.log(`Streaming endpoint: http://localhost:${PORT}/api/turn/stream`);
  console.log(`\n=== Action Endpoints ===`);
  console.log(`Accept: http://localhost:${PORT}/api/action/accept`);
  console.log(`Reject: http://localhost:${PORT}/api/action/reject`);
  console.log(`Update Message Status: POST http://localhost:${PORT}/api/message/status`);
  console.log(`Link Lesson with Template: POST http://localhost:${PORT}/api/lesson/link-template`);
  console.log(`\n=== Template Endpoints ===`);
  console.log(`Generate Template: POST http://localhost:${PORT}/api/template/generate`);
  console.log(`\n=== Session Management Endpoints ===`);
  console.log(`Create Session: POST http://localhost:${PORT}/api/session/create`);
  console.log(`Get History: GET http://localhost:${PORT}/api/session/:sessionId/history`);
  console.log(`Get Stats: GET http://localhost:${PORT}/api/session/:sessionId/stats`);
  console.log(`Clear History: POST http://localhost:${PORT}/api/session/:sessionId/clear`);
  console.log(`Delete Session: DELETE http://localhost:${PORT}/api/session/:sessionId`);
  console.log(`List Sessions: GET http://localhost:${PORT}/api/sessions`);
  console.log(`\nAgent tools: ${agentTools.length} tool(s) loaded`);
  console.log(`Session cleanup runs every 5 minutes\n`);
  
  // Initialize database connection
  initializeDatabase();
});

// Initialize database
async function initializeDatabase() {
  console.log('\n=== Database Initialization ===');
  await connectDB();
  
  const dbStatus = getConnectionStatus();
  console.log(`Database Status: ${dbStatus.state}`);
  
  if (isDBConnected()) {
    console.log(`✓ Database persistence enabled`);
    console.log(`Database Host: ${dbStatus.host}`);
    console.log(`Database Name: ${dbStatus.name}`);
    
    // Schedule periodic cleanup of old sessions
    setInterval(async () => {
      console.log('[Database] Running cleanup of old sessions...');
      await dbService.cleanupOldSessions(30); // 30 days
    }, 24 * 60 * 60 * 1000); // Run daily
  } else {
    console.log('⚠️  Running without database persistence');
    console.log('Note: Sessions will only be stored in memory');
  }
  console.log('================================\n');
}

