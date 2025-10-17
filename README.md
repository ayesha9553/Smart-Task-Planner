# Smart Task Planner

## Overview
Smart Task Planner is an AI-powered web application that breaks down user goals into actionable tasks with timelines using AI reasoning. The application leverages OpenAI's language models to analyze the user's goal and generate a comprehensive task plan with dependencies and estimated timelines.

## Features
- Input a goal with timeline constraints (e.g., "Launch a product in 2 weeks")
- Generate a detailed task breakdown with:
  - Task titles and descriptions
  - Estimated durations
  - Suggested deadlines
  - Task dependencies
- Timeline visualization of tasks
- Save plans for future reference
- Optional database integration for persistent storage

## Technical Architecture
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **AI Integration**: OpenAI API
- **Optional Database**: MongoDB

## Prerequisites
- Node.js (v14+)
- npm or yarn
- OpenAI API Key
- (Optional) MongoDB database

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-task-planner.git
cd smart-task-planner
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/smart-task-planner
```

4. Start the application:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Generate Task Plan
- **URL**: `/api/generate-plan`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "goal": "Launch a product in 2 weeks"
  }
  ```
- **Response**:
  ```json
  {
    "goal": "Launch a product in 2 weeks",
    "taskPlan": {
      "tasks": [
        {
          "id": "1",
          "title": "Finalize product features",
          "description": "Determine the core features that will be included in the initial launch",
          "estimatedDuration": "1 day",
          "deadline": "2025-10-19",
          "dependencies": []
        },
        ...
      ]
    }
  }
  ```

### Get All Saved Plans (optional, if database is connected)
- **URL**: `/api/plans`
- **Method**: `GET`
- **Response**: Array of saved task plans

## LLM Usage
The application uses OpenAI's GPT models to analyze the goal text and generate a structured task breakdown. The prompt is designed to:
1. Extract the timeline constraints from the goal
2. Break down the goal into logical, sequential tasks
3. Establish dependencies between tasks
4. Set realistic deadlines within the overall timeframe
5. Provide detailed descriptions for each task

## Future Enhancements
- User authentication
- Collaborative task planning
- Export plans to project management tools (Trello, Asana, etc.)
- Email notifications for upcoming task deadlines
- Visual task progress tracking

## License
MIT

## Author
[Your Name]