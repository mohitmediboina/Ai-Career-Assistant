# Ai-Career-Assistant

## Project Title & Description

This repository hosts the code for Ai-Career-Assistant, an AI-powered career guidance tool designed to provide users with personalized insights and resources to navigate their career paths. This project aims to leverage AI to assist users in exploring career options, developing skills,Analysis of Resume and preparing for job opportunities.
<img width="1915" height="1025" alt="Screenshot 2025-10-18 103218" src="https://github.com/user-attachments/assets/38a62022-3a04-41a2-ae89-3374728ceae8" />
<img width="1899" height="1030" alt="image" src="https://github.com/user-attachments/assets/aef15043-86a9-47c8-909e-47727065bb92" />
<img width="1916" height="1013" alt="image" src="https://github.com/user-attachments/assets/46e484f6-7b32-48e6-b82a-4a405206048a" />
<img width="1897" height="933" alt="image" src="https://github.com/user-attachments/assets/3a9b19de-b51c-4e2c-8ac4-25b204d1b703" />
## Data Flow Diagram
<img width="1859" height="877" alt="image" src="https://github.com/user-attachments/assets/1d1bbb39-b06d-4248-a0de-239319958bb0" />


## Demo

## Key Features & Benefits

*   **AI-Driven Career Guidance:** Utilizes AI to analyze user profiles and provide customized career recommendations.
*   **Resume Context Based Answer:** It helps user to get the personalized answer.
*   **User Context is Auto updated based on Conversation:** Ai Agent Automatically Updates the Users Context in the Database based on the conversation (like someone say i got an internship ai will update context and give how we can get job now).
*   **Skill Development Resources:** Offers curated learning materials and resources for skill enhancement.
*   **Job Preparation Assistance:** Provides tools and tips for resume building, interview preparation, and job searching.
*   **Chat Interface:** Features a conversational AI interface powered by LangGraph for interactive career counseling.
*   **Search Integration:** Integrates with Tavily Search to provide up-to-date information on job trends and industry insights.
*   **Resume Analyser:** It analyses resume based on job description and resume give the score and suggestions to edit.
## Prerequisites & Dependencies

Before you begin, ensure you have the following installed:

*   **Node.js:** (Frontend)
*   **Python 3.7+:** (Backend)
*   **pip:** (Python package installer)
*   **MongoDB:** (Database)

### Python Dependencies (Backend):

Install using `pip install -r backend/requirements.txt`:

*   `fastapi`
*   `uvicorn[standard]`
*   `langchain-google-genai`
*   `langchain-community`
*   `langgraph`
*   `python-dotenv`
*   `pydantic`
*   `tavily-python`

### JavaScript Dependencies (Frontend):

Install using `npm install` or `yarn install`:

*   `react`
*   `vite`
*   `eslint`
*   `@eslint/js`
*   `globals`
*   `eslint-plugin-react-hooks`
*   `eslint-plugin-react-refresh`

## Installation & Setup Instructions

Follow these steps to set up the project:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/mohitmediboina/Ai-Career-Assistant.git
    cd Ai-Career-Assistant
    ```

2.  **Backend Setup:**

    *   Navigate to the `backend` directory:

        ```bash
        cd backend
        ```

    *   Create a `.env` file and add your API keys and MongoDB URI.  Example:

        ```
        GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
        TAVILY_API_KEY=YOUR_TAVILY_API_KEY
        MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
        ```

    *   Install the Python dependencies:

        ```bash
        pip install -r requirements.txt
        ```

    *   Run the backend server:

        ```bash
        uvicorn main:app --reload
        ```

3.  **Frontend Setup:**

    *   Navigate to the `frontend` directory:

        ```bash
        cd ../frontend
        ```

    *   Install the JavaScript dependencies:

        ```bash
        npm install # Or yarn install
        ```

    *   Start the development server:

        ```bash
        npm run dev # Or yarn dev
        ```

4.  **Configure Environment Variables:**

    *   In the `frontend` directory, create a `.env` file (if needed, depending on your frontend implementation) to configure any necessary environment variables for the frontend.

## Usage Examples & API Documentation

### Backend API:

The backend exposes several API endpoints via FastAPI.  Here's a basic example:

*   **/chat**: (POST) - Accepts user input and returns AI-generated career advice.  Data is streamed back to the client.

Refer to the `backend/main.py` file for detailed API endpoint documentation.

### Frontend Usage:

The frontend provides a user interface for interacting with the backend.  It includes:

*   **Authentication:** An authentication page (`AuthPage.jsx`).
*   **AI Career Coach Interface:** A main component (`AICareerCoach.jsx`) for interacting with the AI.
*   **Chat Window:** A chat window (`ChatWindow.jsx`) to display conversation history and stream responses from the backend.

## Configuration Options

### Backend:

*   **Environment Variables:**
    *   `GOOGLE_API_KEY`: API key for Google's Generative AI models.
    *   `TAVILY_API_KEY`: API key for Tavily Search.
    *   `MONGODB_URI`: URI for connecting to your MongoDB database.

### Frontend:

Configuration options depend on the specific implementation within the frontend.  Check `.env` files (if present) or component settings for customizable parameters.

## Contributing Guidelines

We welcome contributions to the Ai-Career-Assistant project! To contribute:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive messages.
4.  Submit a pull request to the main branch.

Please ensure your code follows the project's coding style and includes appropriate tests.

## License Information

This project does not currently have a specified license. All rights are reserved by the owner.

## Acknowledgments

*   Langchain: For providing the framework to structure the AI agent
*   Google AI: For powerful generative AI models.
*   Tavily Search: For search functionalities.
*   React + Vite: For the frontend framework
