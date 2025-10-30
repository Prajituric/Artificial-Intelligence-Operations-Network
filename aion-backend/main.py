from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from celery import Celery
from sqlalchemy.orm import Session
from typing import List, Optional
import openai
import json
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# FastAPI Configuration
app = FastAPI(title="AION API", description="Artificial Intelligence Operations Network")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Celery Configuration
celery_app = Celery('worker', broker=os.getenv('REDIS_URL'))

# OpenAI Configuration
openai.api_key = os.getenv('OPENAI_API_KEY')

# Authentication Configuration
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 30))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    role: str = "user"

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "user"

class TaskRequest(BaseModel):
    agent: str
    prompt: str
    priority: Optional[int] = 1

class TaskResponse(BaseModel):
    task_id: str

class TaskResult(BaseModel):
    status: str
    output: Optional[str] = None
    metrics: Optional[dict] = None

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db, username: str):
    # Simulating a database for example
# In the real implementation, we will query the database
    fake_users_db = {
        "admin": {
            "username": "admin",
            "full_name": "Administrator",
            "email": "admin@aion.com",
            "hashed_password": get_password_hash("admin"),
            "disabled": False,
            "role": "admin"
        }
    }
    if username in fake_users_db:
        user_dict = fake_users_db[username]
        return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(None, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Rute pentru autentificare
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(None, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Task-uri Celery
@celery_app.task
def run_ai_task(agent, prompt):
    # Simulăm un răspuns de la OpenAI
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": f"You are {agent}"},
                {"role": "user", "content": prompt}
            ]
        )
        result = response.choices[0].message.content
        # Evaluăm răspunsul
        metrics = evaluate_response(result)
        return {"output": result, "metrics": metrics}
    except Exception as e:
        return {"error": str(e)}

def evaluate_response(response: str):
    # Simulăm evaluarea răspunsului
    # În implementarea reală, vom folosi OpenAI pentru evaluare
    metrics = {"clarity": 0, "accuracy": 0, "conciseness": 0}
    
    try:
        for key in metrics.keys():
            ask = f"Rate the {key} of the following response from 0 to 10:\n{response}"
            score = openai.ChatCompletion.create(
                model="gpt-4-turbo",
                messages=[{"role": "user", "content": ask}]
            )
            # Extragem scorul numeric din răspuns
            metrics[key] = int(''.join([c for c in score.choices[0].message.content if c.isdigit()]) or 0)
        
        avg = sum(metrics.values()) / len(metrics)
        return {**metrics, "average": avg}
    except Exception as e:
        return {"error": str(e), "average": 0}

# Rute API
@app.get("/")
def read_root():
    return {"message": "Welcome to AION - Artificial Intelligence Operations Network"}

@app.post("/run-task", response_model=TaskResponse)
async def run_task(req: TaskRequest, current_user: User = Depends(get_current_active_user)):
    task = run_ai_task.delay(req.agent, req.prompt)
    return {"task_id": task.id}

@app.get("/result/{task_id}", response_model=TaskResult)
def get_result(task_id: str, current_user: User = Depends(get_current_active_user)):
    result = run_ai_task.AsyncResult(task_id)
    if result.ready():
        return {"status": "done", **result.get()}
    return {"status": "pending"}

@app.get("/agents")
def get_agents(current_user: User = Depends(get_current_active_user)):
    # Predefined list of agents
    agents = [
        {"id": "code_reviewer", "name": "Code Reviewer", "description": "Analyzes code and provides feedback"},
{"id": "security_auditor", "name": "Security Auditor", "description": "Checks for security vulnerabilities"},
{"id": "data_analyst", "name": "Data Analyst", "description": "Analyzes and interprets data"},
{"id": "documentation_writer", "name": "Documentation Writer", "description": "Generates documentation for code"}
    ]
    return agents

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)