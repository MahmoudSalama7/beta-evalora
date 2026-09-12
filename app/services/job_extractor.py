import os
import json
import logging
import re
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def heuristic_extraction(description: str) -> Dict[str, Any]:
    """Fallback rule-based heuristic extractor when LLM service is offline or unconfigured."""
    text_lower = description.lower()
    
    # Common tech skills detection
    tech_keywords = [
        "python", "fastapi", "django", "flask", "postgresql", "postgres", "sql", "qdrant",
        "vector database", "redis", "docker", "kubernetes", "aws", "gcp", "azure", "asyncio",
        "langchain", "llm", "rag", "rest api", "websockets", "react", "vue", "typescript",
        "javascript", "git", "ci/cd", "pytest", "unit testing"
    ]
    
    found_skills = [kw.title() for kw in tech_keywords if kw in text_lower]
    if not found_skills:
        found_skills = ["Software Engineering", "Problem Solving", "System Design"]

    # Seniority level estimation
    seniority = "Mid-Level"
    if "senior" in text_lower or "lead" in text_lower or "principal" in text_lower:
        seniority = "Senior"
    elif "junior" in text_lower or "entry" in text_lower or "intern" in text_lower:
        seniority = "Junior"

    # Extract sentences as requirements and responsibilities
    sentences = [s.strip() for s in re.split(r'[\.\n\u2022\*\-]+', description) if len(s.strip()) > 10]
    
    tech_reqs = [s for s in sentences if any(k in s.lower() for k in ["experience", "knowledge", "proficient", "degree", "years", "understanding"])]
    if not tech_reqs:
        tech_reqs = sentences[:3] if len(sentences) >= 3 else [description]

    responsibilities = [s for s in sentences if any(k in s.lower() for k in ["build", "design", "develop", "maintain", "lead", "implement", "create"])]
    if not responsibilities:
        responsibilities = sentences[3:6] if len(sentences) >= 6 else [description]

    return {
        "skills": list(set(found_skills)),
        "technical_requirements": tech_reqs[:5],
        "seniority_level": seniority,
        "core_responsibilities": responsibilities[:5]
    }

async def extract_job_metadata(description: str) -> Dict[str, Any]:
    """
    Extract structured metadata from plain-text job description using Groq LLM (llama-3.3-70b-versatile).
    Returns JSON dictionary with:
    - skills: list[str]
    - technical_requirements: list[str]
    - seniority_level: str
    - core_responsibilities: list[str]
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


    if groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            prompt = f"""
            Analyze the following Job Description text and extract structured JSON with these exact keys:
            - "skills": list of technical skills, frameworks, and tools mentioned
            - "technical_requirements": list of technical experience and qualifications
            - "seniority_level": estimated seniority (e.g. Junior, Mid-Level, Senior, Lead)
            - "core_responsibilities": list of main duties and responsibilities

            Job Description:
            {description}
            """
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert HR technical interviewer AI. Output valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=groq_model,
                response_format={"type": "json_object"}
            )
            raw_text = chat_completion.choices[0].message.content.strip()
            data = json.loads(raw_text)
            logger.info("Successfully extracted job metadata via Groq LLM.")
            return {
                "skills": data.get("skills", []),
                "technical_requirements": data.get("technical_requirements", []),
                "seniority_level": data.get("seniority_level", "Mid-Senior"),
                "core_responsibilities": data.get("core_responsibilities", [])
            }
        except Exception as e:
            logger.warning(f"Groq LLM metadata extraction failed ({e}). Trying fallback...")

    # Fallback to Gemini if configured
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            prompt = f"Analyze Job Description and return JSON with skills, technical_requirements, seniority_level, core_responsibilities:\n{description}"
            response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```[a-z]*\n?", "", raw_text)
                raw_text = re.sub(r"\n?```$", "", raw_text)
            data = json.loads(raw_text)
            return {
                "skills": data.get("skills", []),
                "technical_requirements": data.get("technical_requirements", []),
                "seniority_level": data.get("seniority_level", "Mid-Senior"),
                "core_responsibilities": data.get("core_responsibilities", [])
            }
        except Exception as e:
            logger.warning(f"Gemini LLM metadata extraction failed: {e}")

    return heuristic_extraction(description)

