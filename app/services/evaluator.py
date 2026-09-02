import os
import json
import logging
import re
from typing import Dict, Any

from app.services.rag_engine import retrieve_ground_truth_context

logger = logging.getLogger(__name__)

def heuristic_evaluator(
    question: str,
    candidate_answer: str,
    ground_truth_chunks: list[str]
) -> Dict[str, Any]:
    """Fallback evaluator calculating scores based on answer length, technical vocabulary, and coverage."""
    ans_length = len(candidate_answer.split())
    
    # Calculate clarity score
    if ans_length > 40:
        clarity_score = 9.0
    elif ans_length > 20:
        clarity_score = 7.5
    elif ans_length > 5:
        clarity_score = 5.0
    else:
        clarity_score = 2.0
        
    # Check key technical terms in candidate's answer
    words = set(re.findall(r'\w+', candidate_answer.lower()))
    gt_text = " ".join(ground_truth_chunks).lower()
    gt_words = set(re.findall(r'\w+', gt_text))
    
    overlap = words.intersection(gt_words)
    
    if len(words) > 15:
        tech_score = min(10.0, 6.0 + len(overlap) * 0.8)
    else:
        tech_score = min(10.0, 3.0 + len(overlap) * 0.5)
        
    covered = [f"Mentioned relevant concepts: {', '.join(list(overlap)[:4])}"] if overlap else ["Provided general explanation"]
    missing = ["Could provide deeper architectural details and edge-case error handling"]
    
    summary = f"Candidate answered with {ans_length} words demonstrating basic comprehension. Technical score: {tech_score:.1f}/10."
    
    return {
        "technical_score": float(round(tech_score, 1)),
        "clarity_score": float(round(clarity_score, 1)),
        "covered_points": covered,
        "missing_points": missing,
        "summary": summary
    }

async def evaluate_turn(
    job_id: str,
    question: str,
    candidate_answer: str
) -> Dict[str, Any]:
    """
    Evaluate candidate's answer against Qdrant ground-truth chunks for the specified job_id.
    Returns structured evaluation dictionary:
    {
      "technical_score": float,
      "clarity_score": float,
      "covered_points": list[str],
      "missing_points": list[str],
      "summary": str
    }
    """
    # 1. Retrieve ground-truth chunks from Qdrant under job_id
    context_chunks = await retrieve_ground_truth_context(job_id, f"{question} {candidate_answer}", limit=3)
    
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt = f"""
            You are an expert technical interviewer judge evaluating a candidate's answer.
            
            Question Asked:
            {question}
            
            Candidate's Answer:
            {candidate_answer}
            
            Ground-Truth Context / Rubric Chunks:
            {"".join(context_chunks)}
            
            Provide a strict evaluation JSON response with the following exact keys:
            - "technical_score": float between 0.0 and 10.0
            - "clarity_score": float between 0.0 and 10.0
            - "covered_points": list of strings detailing key points the candidate addressed correctly
            - "missing_points": list of strings detailing key technical aspects the candidate omitted or answered incorrectly
            - "summary": string executive summary of the turn performance

            Return raw valid JSON ONLY without markdown formatting.
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```[a-z]*\n?", "", raw_text)
                raw_text = re.sub(r"\n?```$", "", raw_text)
                
            data = json.loads(raw_text)
            return {
                "technical_score": float(data.get("technical_score", 7.0)),
                "clarity_score": float(data.get("clarity_score", 7.0)),
                "covered_points": data.get("covered_points", []),
                "missing_points": data.get("missing_points", []),
                "summary": data.get("summary", "Evaluation completed.")
            }
        except Exception as e:
            logger.warning(f"LLM turn evaluation failed or unconfigured: {e}. Using heuristic evaluator.")
            
    return heuristic_evaluator(question, candidate_answer, context_chunks)
