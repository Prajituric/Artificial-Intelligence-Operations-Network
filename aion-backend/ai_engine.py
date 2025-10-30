from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.agents import Tool, AgentExecutor, LLMSingleActionAgent, AgentOutputParser
import openai
import os
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

class AIEngine:
    def __init__(self):
        self.models = {
            "gpt-4-turbo": "gpt-4-turbo",
            "gpt-3.5-turbo": "gpt-3.5-turbo",
            "llama2": "llama2"  # Pentru integrare cu Ollama
        }
    
    def generate_response(self, agent_name: str, system_prompt: str, user_prompt: str, model: str = "gpt-4-turbo"):
        """Generate a response using OpenAI API"""
        try:
            response = openai.ChatCompletion.create(
                model=self.models.get(model, "gpt-4-turbo"),
                messages=[
                    {"role": "system", "content": f"You are {agent_name}. {system_prompt}"},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def evaluate_response(self, response: str, criteria: list = ["clarity", "accuracy", "conciseness"]):
        """Evaluate the quality of the response using OpenAI"""
        metrics = {}
        
        try:
            for key in criteria:
                ask = f"Rate the {key} of the following response from 0 to 10:\n{response}"
                score = openai.ChatCompletion.create(
                    model="gpt-4-turbo",
                    messages=[{"role": "user", "content": ask}]
                )
                # Extract numeric score from response
                metrics[key] = int(''.join([c for c in score.choices[0].message.content if c.isdigit()]) or 0)
            
            avg = sum(metrics.values()) / len(metrics)
            return {**metrics, "average": avg}
        except Exception as e:
            return {"error": str(e), "average": 0}
    
    def create_langchain_agent(self, agent_name: str, system_prompt: str, tools: list = None):
        """Create a LangChain agent with specific tools"""
        # Simplified implementation for example
        # In the complete implementation, we will configure a full LangChain agent
        
        llm = OpenAI(temperature=0)
        
        prompt = PromptTemplate(
            input_variables=["agent_name", "system_prompt", "tools", "input"],
            template="""
            You are {agent_name}. {system_prompt}
            
            You have access to the following tools:
            {tools}
            
            User input: {input}
            """
        )
        
        chain = LLMChain(llm=llm, prompt=prompt)
        
        return chain

# Exemplu de utilizare
if __name__ == "__main__":
    ai_engine = AIEngine()
    response = ai_engine.generate_response(
        agent_name="Code Reviewer",
        system_prompt="You are an expert code reviewer. Analyze code for bugs, security issues, and best practices.",
        user_prompt="Please review this code:\n\ndef add(a, b):\n    return a + b"
    )
    print(response)
    
    metrics = ai_engine.evaluate_response(response)
    print(metrics)