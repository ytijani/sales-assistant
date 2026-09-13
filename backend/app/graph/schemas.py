"""Structured output contracts for the sales-analysis agent."""

from typing import Literal

from pydantic import BaseModel, Field


class Answer(BaseModel):
    summary: str = Field(description="The direct, concise answer to the question.")
    findings: list[str] = Field(
        default_factory=list,
        description="Important facts found in the tool results.",
    )
    conclusion: str = Field(description="The data-supported conclusion.")


class ChartPoint(BaseModel):
    label: str = Field(description="The category or time-period label for this point.")
    value: float = Field(description="The numeric value for this point.")


class Chart(BaseModel):
    id: str = Field(description="A short, stable identifier such as 'sales-by-product'.")
    type: Literal["bar", "line"] = Field(
        description="Use 'bar' for categories and 'line' for time-series data."
    )
    title: str = Field(description="A concise, human-readable chart title.")
    x_axis: str = Field(description="The label for the horizontal axis.")
    y_axis: str = Field(description="The label for the vertical axis, including units.")
    data: list[ChartPoint] = Field(
        min_length=1,
        description="Chart points calculated only from the retrieved tool data.",
    )


class StructuredAnalysis(BaseModel):
    answer: Answer
    charts: list[Chart] = Field(
        default_factory=list,
        description="Up to three useful charts supported by the retrieved data.",
    )
    suggested_actions: list[str] = Field(
        default_factory=list,
        description="Practical actions supported by the retrieved data.",
    )
