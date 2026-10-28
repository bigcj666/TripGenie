"""运行配置：全部来自环境变量，默认 mock 引擎（无 key 也能完整演示）。"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    llm_engine: str  # auto | deepseek | glm | mock
    deepseek_api_key: str
    deepseek_base_url: str
    deepseek_model: str
    glm_api_key: str
    glm_base_url: str
    glm_model: str
    request_timeout: float

    @staticmethod
    def from_env() -> "Settings":
        return Settings(
            llm_engine=os.getenv("LLM_ENGINE", "auto").strip().lower(),
            deepseek_api_key=os.getenv("DEEPSEEK_API_KEY", "").strip(),
            deepseek_base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/"),
            deepseek_model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
            glm_api_key=os.getenv("GLM_API_KEY", "").strip(),
            glm_base_url=os.getenv("GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4").rstrip("/"),
            glm_model=os.getenv("GLM_MODEL", "glm-4-flash"),
            request_timeout=float(os.getenv("LLM_TIMEOUT", "60")),
        )

    def resolve_engine(self) -> str:
        """返回实际生效的引擎名：deepseek | glm | mock。"""
        if self.llm_engine == "mock":
            return "mock"
        if self.llm_engine == "deepseek":
            return "deepseek" if self.deepseek_api_key else "mock"
        if self.llm_engine == "glm":
            return "glm" if self.glm_api_key else "mock"
        # auto：优先 DeepSeek，其次 GLM，最后 mock
        if self.deepseek_api_key:
            return "deepseek"
        if self.glm_api_key:
            return "glm"
        return "mock"
