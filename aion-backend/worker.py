from celery import Celery
from ai_engine import AIEngine
import os
from dotenv import load_dotenv

load_dotenv()

# Celery Configuration
app = Celery('worker', broker=os.getenv('REDIS_URL'))

# Initialize AI Engine
ai_engine = AIEngine()

@app.task
def run_ai_task(agent_name, system_prompt, user_prompt, model="gpt-4-turbo"):
    """
    Run an AI task using AI Engine
    """
    try:
        # Generate response
        response = ai_engine.generate_response(
            agent_name=agent_name,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model
        )
        
        # Evaluate response
        metrics = ai_engine.evaluate_response(response)
        
        return {
            "output": response,
            "metrics": metrics
        }
    except Exception as e:
        return {
            "error": str(e),
            "output": "An error occurred while processing the task.",
            "metrics": {"average": 0}
        }

if __name__ == "__main__":
    app.start()