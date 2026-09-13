"""Structured output contracts for the sales-analysis agent."""

from pydantic import BaseModel, Field


class Answer(BaseModel):
    summary: str = Field(description="The direct, concise answer to the question.")
    findings: list[str] = Field(
        default_factory=list,
        description="Important facts found in the tool results.",
    )
    conclusion: str = Field(description="The data-supported conclusion.")


class StructuredAnalysis(BaseModel):
    answer: Answer
    suggested_actions: list[str] = Field(
        default_factory=list,
        description="Practical actions supported by the retrieved data.",
    )
