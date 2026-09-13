"""Structured output contracts for the sales-analysis agent."""

from __future__ import annotations

import math
import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

_NUMERIC_JUNK = re.compile(r"[,\s]")


def _coerce_number(value: object) -> float:
    if isinstance(value, bool):
        raise ValueError("boolean values are not chartable")
    if isinstance(value, (int, float)):
        number = float(value)
    elif isinstance(value, str):
        cleaned = _NUMERIC_JUNK.sub("", value.replace("MAD", "").strip())
        number = float(cleaned)
    else:
        raise ValueError("chart values must be numeric")
    if not math.isfinite(number):
        raise ValueError("chart values must be finite")
    return round(number, 2)


class Answer(BaseModel):
    summary: str = Field(description="One or two sentences that directly answer the question.")
    findings: list[str] = Field(
        default_factory=list,
        description="Short, numbered-style facts. Each item is one sentence with a number and date when possible.",
    )
    conclusion: str = Field(
        description="What the data means for the business, in plain language."
    )

    @field_validator("summary", "conclusion")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("findings")
    @classmethod
    def clean_findings(cls, value: list[str]) -> list[str]:
        findings = [" ".join(item.split()) for item in value if item and item.strip()]
        return findings[:6]


class ChartPoint(BaseModel):
    label: str = Field(description="Category or date shown on the x-axis.")
    value: float = Field(description="Numeric y-axis value, not a string.")

    @field_validator("label")
    @classmethod
    def clean_label(cls, value: str) -> str:
        label = " ".join(value.split())
        if not label:
            raise ValueError("chart labels cannot be empty")
        return label[:48]

    @field_validator("value", mode="before")
    @classmethod
    def parse_value(cls, value: object) -> float:
        return _coerce_number(value)


class Chart(BaseModel):
    id: str = Field(description="Short kebab-case id such as sales-by-product.")
    type: Literal["bar", "line"] = Field(
        description="bar for categories, line for dates/time series."
    )
    title: str = Field(description="Human-readable chart title.")
    x_axis: str = Field(description="X-axis label, e.g. Product or Date.")
    y_axis: str = Field(description="Y-axis label including units, e.g. Revenue (MAD).")
    data: list[ChartPoint] = Field(
        min_length=1,
        max_length=16,
        description="Numeric points copied from the query results. Prefer 2-16 points.",
    )

    @field_validator("id")
    @classmethod
    def clean_id(cls, value: str) -> str:
        slug = re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")
        return slug or "chart"

    @field_validator("title", "x_axis", "y_axis")
    @classmethod
    def clean_axis(cls, value: str) -> str:
        return " ".join(value.split())[:80]


class StructuredAnalysis(BaseModel):
    answer: Answer
    charts: list[Chart] = Field(
        default_factory=list,
        description="Up to three charts. Omit a chart rather than inventing points.",
    )
    suggested_actions: list[str] = Field(
        default_factory=list,
        description="Practical next steps supported by the retrieved data.",
    )

    @field_validator("suggested_actions")
    @classmethod
    def clean_actions(cls, value: list[str]) -> list[str]:
        actions = [" ".join(item.split()) for item in value if item and item.strip()]
        return actions[:4]

    @model_validator(mode="after")
    def unique_chart_ids(self) -> StructuredAnalysis:
        used: set[str] = set()
        charts: list[Chart] = []
        for index, chart in enumerate(self.charts, start=1):
            chart_id = chart.id
            if chart_id in used:
                chart_id = f"{chart.id}-{index}"
            used.add(chart_id)
            charts.append(chart.model_copy(update={"id": chart_id}))
        self.charts = charts[:3]
        return self
