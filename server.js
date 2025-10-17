const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Database connection (optional)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Task Schema (optional for database storage)
const taskSchema = new mongoose.Schema({
  goal: String,
  tasks: [{
    title: String,
    description: String,
    deadline: Date,
    dependencies: [String],
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TaskPlan = mongoose.model('TaskPlan', taskSchema);

// API endpoint to process goal and generate tasks
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { goal } = req.body;
    
    if (!goal) {
      return res.status(400).json({ error: 'Goal text is required' });
    }

    // Check if we have a valid API key
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      const prompt = `Break down this goal into actionable tasks with suggested deadlines and dependencies:
      
Goal: ${goal}

Please format your response as a JSON object with the following structure:
{
  "tasks": [
    {
      "id": "1",
      "title": "Task title",
      "description": "Detailed description of the task",
      "estimatedDuration": "X days/hours",
      "deadline": "YYYY-MM-DD",
      "dependencies": [] // IDs of tasks this task depends on
    },
    // More tasks...
  ]
}

Consider logical dependencies between tasks, provide realistic timelines, and ensure the entire plan can be completed by the deadline if specified in the goal.`;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI task planner that breaks down goals into actionable tasks with realistic timelines and dependencies. Provide detailed, actionable tasks with clear deadlines."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      
      // Parse the response
      const completion = response.choices[0].message.content;
      let taskPlan;
      
      try {
        // Extract JSON from the response
        const jsonMatch = completion.match(/\\{([\\s\\S]*)\\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : completion;
        taskPlan = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return res.status(500).json({ 
          error: 'Failed to parse the generated task plan',
          rawResponse: completion 
        });
      }
      
      // Save to database (optional)
      if (mongoose.connection.readyState === 1) { // 1 = connected
        const newTaskPlan = new TaskPlan({
          goal,
          tasks: taskPlan.tasks.map(task => ({
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            dependencies: task.dependencies
          }))
        });
        
        await newTaskPlan.save();
      }
      
      res.json({
        goal,
        taskPlan
      });
    } else {
      // Demo data for when no API key is provided
      console.log("Using demo data - no valid OpenAI API key found");
      
      // Parse goal for timeline
      const goalLower = goal.toLowerCase();
      let timeline = "2 weeks";
      let demoDeadline = new Date();
      
      // Extract timeline from goal text
      if (goalLower.includes("1 week") || goalLower.includes("one week")) {
        timeline = "1 week";
        demoDeadline.setDate(demoDeadline.getDate() + 7);
      } else if (goalLower.includes("2 weeks") || goalLower.includes("two weeks")) {
        timeline = "2 weeks";
        demoDeadline.setDate(demoDeadline.getDate() + 14);
      } else if (goalLower.includes("1 month") || goalLower.includes("one month")) {
        timeline = "1 month";
        demoDeadline.setDate(demoDeadline.getDate() + 30);
      } else {
        demoDeadline.setDate(demoDeadline.getDate() + 14); // Default 2 weeks
      }
      
      // Format dates for demo
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      // Create demo tasks based on goal
      let demoTasks = [];
      
      if (goalLower.includes("launch") && goalLower.includes("product")) {
        // Product launch demo
        const date1 = new Date();
        date1.setDate(date1.getDate() + 2);
        
        const date2 = new Date();
        date2.setDate(date2.getDate() + 4);
        
        const date3 = new Date();
        date3.setDate(date3.getDate() + 7);
        
        const date4 = new Date();
        date4.setDate(date4.getDate() + 10);
        
        const finalDate = new Date();
        finalDate.setDate(finalDate.getDate() + 14);
        
        demoTasks = [
          {
            id: "1",
            title: "Finalize product features",
            description: "Review and finalize all product features that will be included in the initial launch",
            estimatedDuration: "2 days",
            deadline: formatDate(date1),
            dependencies: []
          },
          {
            id: "2",
            title: "Complete product testing",
            description: "Perform thorough testing of all features and fix any critical bugs",
            estimatedDuration: "2 days",
            deadline: formatDate(date2),
            dependencies: ["1"]
          },
          {
            id: "3",
            title: "Prepare marketing materials",
            description: "Create promotional content, social media posts, and press releases",
            estimatedDuration: "3 days",
            deadline: formatDate(date3),
            dependencies: ["1"]
          },
          {
            id: "4",
            title: "Set up sales channels",
            description: "Ensure all distribution channels are ready for product launch",
            estimatedDuration: "3 days",
            deadline: formatDate(date4),
            dependencies: ["2"]
          },
          {
            id: "5",
            title: "Launch product",
            description: "Official product launch across all planned channels",
            estimatedDuration: "1 day",
            deadline: formatDate(finalDate),
            dependencies: ["3", "4"]
          }
        ];
      } else if (goalLower.includes("website") || goalLower.includes("web")) {
        // Website development demo
        const date1 = new Date();
        date1.setDate(date1.getDate() + 2);
        
        const date2 = new Date();
        date2.setDate(date2.getDate() + 5);
        
        const date3 = new Date();
        date3.setDate(date3.getDate() + 8);
        
        const date4 = new Date();
        date4.setDate(date4.getDate() + 12);
        
        const finalDate = new Date();
        finalDate.setDate(finalDate.getDate() + 14);
        
        demoTasks = [
          {
            id: "1",
            title: "Create website wireframes",
            description: "Design layout and user flow for all main pages",
            estimatedDuration: "2 days",
            deadline: formatDate(date1),
            dependencies: []
          },
          {
            id: "2",
            title: "Develop frontend components",
            description: "Create HTML, CSS, and JavaScript for all pages based on wireframes",
            estimatedDuration: "3 days",
            deadline: formatDate(date2),
            dependencies: ["1"]
          },
          {
            id: "3",
            title: "Implement backend functionality",
            description: "Set up server, database, and API endpoints",
            estimatedDuration: "3 days",
            deadline: formatDate(date3),
            dependencies: ["2"]
          },
          {
            id: "4",
            title: "Test and debug website",
            description: "Perform comprehensive testing on different devices and browsers",
            estimatedDuration: "2 days",
            deadline: formatDate(date4),
            dependencies: ["3"]
          },
          {
            id: "5",
            title: "Deploy website to production",
            description: "Launch the website on production servers and configure domain",
            estimatedDuration: "1 day",
            deadline: formatDate(finalDate),
            dependencies: ["4"]
          }
        ];
      } else {
        // Generic project demo
        const date1 = new Date();
        date1.setDate(date1.getDate() + 2);
        
        const date2 = new Date();
        date2.setDate(date2.getDate() + 5);
        
        const date3 = new Date();
        date3.setDate(date3.getDate() + 8);
        
        const date4 = new Date();
        date4.setDate(date4.getDate() + 12);
        
        const finalDate = new Date();
        finalDate.setDate(finalDate.getDate() + 14);
        
        demoTasks = [
          {
            id: "1",
            title: "Project planning",
            description: "Define project scope, objectives, and key milestones",
            estimatedDuration: "2 days",
            deadline: formatDate(date1),
            dependencies: []
          },
          {
            id: "2",
            title: "Resource allocation",
            description: "Assign team members and allocate necessary resources",
            estimatedDuration: "3 days",
            deadline: formatDate(date2),
            dependencies: ["1"]
          },
          {
            id: "3",
            title: "Implementation phase",
            description: "Execute the core project work based on the plan",
            estimatedDuration: "3 days",
            deadline: formatDate(date3),
            dependencies: ["2"]
          },
          {
            id: "4",
            title: "Quality assurance",
            description: "Review and test all deliverables to ensure quality",
            estimatedDuration: "4 days",
            deadline: formatDate(date4),
            dependencies: ["3"]
          },
          {
            id: "5",
            title: "Project delivery",
            description: "Finalize all deliverables and present to stakeholders",
            estimatedDuration: "2 days",
            deadline: formatDate(finalDate),
            dependencies: ["4"]
          }
        ];
      }
      
      const taskPlan = {
        tasks: demoTasks
      };
      
      res.json({
        goal,
        taskPlan
      });
    }
  } catch (error) {
    console.error('Error generating task plan:', error);
    res.status(500).json({ error: 'Failed to generate task plan' });
  }
});

// API endpoint to get all saved plans (optional)
app.get('/api/plans', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const plans = await TaskPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Open http://localhost:${port} in your browser`);
});