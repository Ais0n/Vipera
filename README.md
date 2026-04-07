# Vipera

**V**isual **I**ntelligence-**P**romoted **E**nd Use**r** **A**uditing

Vipera is an interactive system for streamlining and enhancing the systematicness of large-scale text-to-image (T2I) model auditing. It helps auditors test T2I models at scale, understand model behavior in depth, and develop meaningful auditing criteria.

**Accepted as a full paper at [CHI 2026](https://chi2026.acm.org/).** [[Paper]](https://arxiv.org/abs/2510.05742) [[Demo Video]](https://youtu.be/eNQZEP3psXs) [[CHI 2025 LBW]](https://arxiv.org/abs/2503.11113)

## Features

- **Scene Graph Visualization** -- Hierarchical, interactive tree of objects and attributes extracted from generated images, with embedded distribution charts
- **LLM-Powered Audit Suggestions** -- AI-driven comparison of image pairs to suggest new auditing criteria, prompt variations, and keywords
- **Human-in-the-Loop Labeling** -- LLM-generated labels with full user review, editing, and relabeling support
- **Multi-Mode Interface** -- Four system modes (A-D) offering varying levels of scene graph and AI assistance
- **Audit Documentation** -- Bookmark charts, write notes, and generate structured audit reports

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- An [OpenRouter](https://openrouter.ai/) API key (for LLM features)
- A [Replicate](https://replicate.com/) API token (for image generation)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/vipera.git
cd vipera

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your API keys:
#   NEXT_OPENROUTER_KEY=sk-or-v1-...
#   REPLICATE_API_TOKEN=r8_...

# 4. Build and run
npm run build
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_OPENROUTER_KEY` | Yes | OpenRouter API key for LLM calls ([get one](https://openrouter.ai/keys)) |
| `REPLICATE_API_TOKEN` | Yes | Replicate API token for image generation ([get one](https://replicate.com/account/api-tokens)) |
| `PORT` | No | Server port (default: 3000 dev, 8801 production) |
| `NEXT_PUBLIC_SAVE_MODE` | No | Save generated images/graphs to disk (`true`/`false`, default: `true`) |
| `NEXT_PUBLIC_LLM_ENABLED` | No | Enable LLM-powered suggestions (`true`/`false`, default: `true`) |
| `NEXT_PUBLIC_FORUM_API_KEY` | No | WeAudit discussion forum API key |
| `NEXT_PUBLIC_FORUM_USERNAME` | No | WeAudit discussion forum username |
| `NEXT_PUBLIC_FORUM_POST_URL` | No | WeAudit discussion forum post endpoint URL |

### User-Configurable LLM Settings

Users can also configure the LLM model and API key through the **Settings** modal in the header (gear icon). This allows demo users to provide their own OpenRouter API key without access to the server.

Default models:
- **Text tasks** (suggestions, keywords, notes): `google/gemini-3.1-flash-lite-preview`
- **Vision tasks** (scene graph, labeling, image comparison): `google/gemini-2.5-flash-lite`

## System Modes

| Mode | Scene Graph | AI Suggestions | Description |
|---|---|---|---|
| A | No | No | Manual auditing only |
| B | Yes | No | Scene graph visualization without AI assistance |
| C | No | Yes | Flat criteria with AI suggestions |
| D | Yes | Yes | Full system with scene graph + AI suggestions |

## Project Structure

```
pages/
  index.js              # Main application page
  api/
    llm.js              # Unified LLM client helper
    settings.js          # Settings API endpoint
    generate-graph.js    # Scene graph extraction from images
    generate-labels.js   # Image labeling via LLM
    generate-images.js   # Image generation via Replicate/SDXL
    suggest-comparison.js      # Image pair comparison suggestions
    suggest-comparison-flat.js # Flat criteria comparison suggestions
    suggest-external.js        # External knowledge suggestions
    suggest-keyword.js         # Keyword suggestions
    suggest-note.js            # Audit note suggestions
    suggest-promotion.js       # Prompt variation suggestions
    check-graph.js       # Cached graph retrieval
    check-images.js      # Image directory listing
    check-labels.js      # Cached label retrieval
components/
  Header.js             # Navigation bar with mode and settings
  SearchBar.js          # Prompt input and generation controls
  ImageSummary.js       # Main analysis workspace
  TreeView.js           # D3.js hierarchical tree visualization
  SceneGraph.js         # D3.js force-directed graph
  PromptManager.js      # Prompt grouping and color management
  SuggestComparison.js  # Image comparison suggestion panel
  SuggestComparisonFlat.js  # Flat criteria suggestion panel
  SuggestPromotion.js   # Prompt suggestion panel
  SuggestExternal.js    # External knowledge suggestion panel
  BookmarkedCharts.js   # Bookmarked charts and notes
  SettingsModal.js      # LLM configuration modal
  OnboardingTour.js     # First-time user guided tour
  ...
utils.js                # Shared utility functions
Constants.js            # Application constants (configured via env vars)
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

### Quick Deploy (PM2)

```bash
# On your server:
npm install
npm run build
npm install -g pm2
pm2 start server.js --name vipera --env production
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

## Citation

```bibtex
@inproceedings{huang2026vipera,
  title={Vipera: Blending Visual and LLM-Driven Guidance for Systematic Auditing of Text-to-Image Generative AI},
  author={Huang, Yanwei and others},
  booktitle={Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems},
  year={2026}
}
```

## License

This project is for research purposes. Please cite the paper if you use Vipera in your work.

---

Made with love in Pittsburgh.
