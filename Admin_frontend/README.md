# Global Mobility Admin Portal

## Project Overview
This portal is a premium, high-performance administrative interface for the Global Mobility team. It provides a comprehensive suite of tools for monitoring remote work requests, analyzing chatbot interactions, and managing company policy with advanced analytics and mapping capabilities.

## Strategic Goal
To deliver a "Command Centre" experience that moves beyond simple data entry into predictive and sentiment-based insights, allowing the Global Mobility team to proactively adjust policies based on employee behavior and feedback.

## Implementation Plan

### Phase 1: Foundation & Scaffolding
- Initialize a standalone React + TypeScript project using Vite.
- Set up Tailwind CSS with a "Premium Dark" aesthetic theme.
- Install core dependencies: `recharts` (analytics), `react-simple-maps` (global flow mapping), `lucide-react` (iconography), and `framer-motion` (animations).

### Phase 2: Core Layout & Navigation
- Implement a sidebar-based navigation system with three distinct sections:
    1. **Overview Dashboard**: High-level KPIs and volume trends.
    2. **Request Manager**: Advanced table view with status-driven drill-downs.
    3. **Intelligence Hub**: Sentiment analysis and query visualization.
    4. **Policy Editor**: Version-controlled policy management widget.

### Phase 3: Analytics & Visualization
- **Interactive Global Map**: Using `react-simple-maps` to visualize migration flows (lines between home and destination countries).
- **KPI Widgets**: Animated counters for Approval/Rejection rates.
- **Trend Analysis**: Multi-line charts showing how requests evolve over time.

### Phase 4: Intelligence & Sentiment
- **Sentiment Spectrum**: A color-coded visualization of sentiment scores (+100 to -100).
- **Word Cloud/Frequency Analysis**: Identifying common pain points in employee-chatbot conversations.
- **Policy Linkage**: Tagging data against policy versions (e.g., "Policy V3.1" impact).

### Phase 5: Functional Features
- **Excel Export**: Integration for downloading filtered datasets.
- **Advanced Filtering**: Multi-select filters for status, geography, and date ranges.
- **Case Drill-down**: Modal interface for reviewing specific "Pending" cases with full input data.

## Premium Design Principles
- **Atmospheric Depth**: Using layered glassmorphism and subtle gradients rather than flat solid colors.
- **Micro-Interactions**: Smooth transitions between dashboard states using Framer Motion.
- **Typography-First**: Leveraging a high-end sans-serif for clarity and "magazine-style" display fonts for metrics.
- **Spatial Precision**: Generous negative space to prevent data overwhelm.
