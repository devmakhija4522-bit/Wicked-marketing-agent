from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models import PipelineRequest
from backend.agents.trend_scout import run_trend_scout
from backend.agents.insight_analyst import run_insight_analyst
from backend.agents.content_strategist import run_content_strategist
from backend.agents.script_writer import run_script_writer
from backend.agents.brand_guardian import run_brand_guardian
import time

app = FastAPI(title='WICKED')

app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

@app.get('/')
def root():
    return {'status': 'WICKED is running'}

@app.post('/api/discover-trends')
def discover_trends():
    return {'trends': run_trend_scout()}

@app.post('/api/full-pipeline')
def full_pipeline(request: PipelineRequest):
    trends = run_trend_scout()
    time.sleep(5)
    insights = run_insight_analyst(trends[:2])
    time.sleep(5)
    concepts = run_content_strategist(insights[:1])
    time.sleep(5)
    script = run_script_writer(concepts[0], request.language, request.style_samples)
    time.sleep(5)
    review = run_brand_guardian(script)
    return {'trends': trends, 'insights': insights, 'concepts': concepts, 'script': script, 'review': review}
