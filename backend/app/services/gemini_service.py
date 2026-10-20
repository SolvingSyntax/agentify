from typing import Optional
import os
from dotenv import load_dotenv
from groq import Groq
from app.core.config import settings

load_dotenv()

class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        key = (
            api_key 
            or os.getenv("GROQ_API_KEY") 
            or os.getenv("GEMINI_API_KEY") 
            or getattr(settings, "GROQ_API_KEY", "") 
            or getattr(settings, "GEMINI_API_KEY", "")
        )
        self.api_key = str(key).strip().strip('"').strip("'")
        
        if self.api_key and self.api_key.startswith("gsk_"):
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None

    def _get_active_model(self) -> str:
        """Dynamically fetch active models from Groq to avoid hardcoded deprecation errors."""
        try:
            available_models = self.client.models.list().data
            model_ids = [m.id for m in available_models if hasattr(m, 'id')]
            
            # Pick the first matching model from priority keywords
            for keyword in ["llama-3.3", "llama-3.1", "qwen", "gpt-oss", "llama"]:
                for m_id in model_ids:
                    if keyword in m_id.lower():
                        return m_id
            
            if model_ids:
                return model_ids[0]
        except Exception:
            pass
            
        return "llama-3.1-8b-instant"

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        """Execute text generation using Groq API with auto-detected active model."""
        if not self.api_key or not self.api_key.startswith("gsk_"):
            return f"[Free LLM Not Configured]: Key must start with 'gsk_'."

        if not self.client:
            return "[Groq Client Error]: Client initialization failed."

        # Auto-detect active model ID live from Groq API
        selected_model = model if (model and model != "mixtral-8x7b-32768") else self._get_active_model()

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=selected_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            return response.choices[0].message.content or "No response returned."
        except Exception as e:
            # Fallback attempt with fresh active model query
            try:
                fallback_model = self._get_active_model()
                if fallback_model != selected_model:
                    response = self.client.chat.completions.create(
                        model=fallback_model,
                        messages=messages,
                        temperature=0.7,
                        max_tokens=1024,
                    )
                    return response.choices[0].message.content or "No response returned."
            except Exception:
                pass
            return f"Inference Error ({selected_model}): {str(e)}"

# Singleton export expected by route endpoints
gemini_service = GeminiService()