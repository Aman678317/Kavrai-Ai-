# Architecture Gap Analysis & Technical Implementation Roadmap
**Document ID:** GAP-ANALYSIS-2026-V1  
**Target Platform:** Cinema-Grade AI Film Localization (BRAHMA AI / VAANI / ATMAN Inspired)  
**Parent Document:** [docs/MASTER_ARCHITECTURE.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/MASTER_ARCHITECTURE.md)  
**Status:** Approved for Implementation Scaffolding  

---

## 1. Executive Summary & Repository Baseline Audit

### 1.1 Current Repository Status
A comprehensive inspection of the repository (`c:\Users\acer\3D Objects\kavrai AI`) confirms:
- **Baseline State:** Clean workspace. `docs/MASTER_ARCHITECTURE.md` defines the overarching conceptual target. Zero application code or build artifacts currently exist.
- **Architectural Mandate:** Build a modular, production-ready system from the ground up without legacy technical debt, starting with a local-first reference pipeline that smoothly scales into a distributed Kubernetes/Temporal cluster.

### 1.2 Core Architectural Decisions (Aligned via Architecture Review)
Based on architectural consensus, five foundational decisions govern this gap analysis and subsequent engineering phases:
1. **Progressive Hybrid Delivery:** Phase 1 delivers a modular, local-first Docker Compose pipeline (FastAPI + Node.js BFF + local GPU execution on an RTX 3090/4090 or single cloud GPU instance) to validate 1–3 minute theatrical scenes end-to-end. Phase 2 transitions workers to distributed Kubernetes pods orchestrated by Temporal.io.
2. **Polyglot Microservices Decomposition:**
   - **Node.js / TypeScript (v20+ LTS):** API Gateway, Studio QC Workbench BFF, WebSockets for timeline playback/scrubbing, project/shot relational state, and authentication.
   - **Python 3.11+ (PyTorch 2.5, CUDA 12.4):** AI model microservices (VAANI audio pipeline, ATMAN vision pipeline), FFmpeg media chunking, and worker execution.
3. **Two-Tier Lip-Sync Model Strategy (ATMAN Core):**
   - **Tier 1 (Draft / Interactive QC Preview):** Fast Flow/GAN models (**MuseTalk** / **LivePortrait**) delivering 25–40 FPS preview rendering with low latency for director timeline scrubbing.
   - **Tier 2 (Cinema Master Render):** Latent Diffusion (**LatentSync**) + Neural Restoration (**CodeFormer** / **RestoreFormer++**) for final 4K/2K high-fidelity theatrical release.
4. **Hybrid Dialogue Transcreation Engine (VAANI Core):**
   - Commercial LLM APIs (**Claude 3.5 Sonnet / GPT-4o**) driven by strict Pydantic/Instructor schema validation and phonetic/syllabic boundary constraints for fast R&D.
   - Pluggable self-hosted engine adapter (**vLLM** running **Llama-3.3-70B / Qwen-2.5-72B**) for studio IP air-gapped deployments.
5. **Pluggable Dual-Path Model Licensing:**
   - Default stack is 100% commercially permissive (**Apache 2.0 / MIT / BSD**) using **GFPGAN / RestoreFormer++ / Mediapipe**.
   - Optional research/studio adapter tier for non-commercial models (**CodeFormer / FLAME**) when studio commercial licenses or research waivers are secured.

---

## 2. Gap Analysis: Specification vs. Existing Repository

| Component | Master Architecture Target | Current Repository State | Gap Severity | Primary Technical Risks |
| :--- | :--- | :--- | :--- | :--- |
| **Project Workspace** | Monorepo structure with shared contracts, types, and Docker Compose orchestration | Empty folder (only `docs/` exists) | **P0 (Critical)** | Lack of build scaffolding, dependency locking, and development environments. |
| **Media Ingestion & Demuxing** | FFmpeg-based stream demuxing, Hybrid Demucs v4 audio stem separation, PySceneDetect shot splitting | None | **P0 (Critical)** | Audio-video sync drift, vocal bleed into M&E beds, SMPTE timecode loss. |
| **ASR & Diarization** | WhisperX word-level forced alignment + PyAnnote 3.1 multi-character speaker diarization | None | **P0 (Critical)** | Hallucinations during background music, multi-speaker attribution collisions. |
| **Constrained Transcreation** | LLM transcreation engine with syllable count budgeting and bilabial/labiodental viseme anchor matching | None | **P0 (Critical)** | Script expansion/contraction causing extreme lip-flap desync over long sentences. |
| **Voice Cloning & Prosody** | Zero-shot cross-lingual voice cloning (StyleTTS2 / CosyVoice 2 / F5-TTS) with emotion/pitch transfer | None | **P0 (Critical)** | Flat, robotic dialogue delivery, foreign accent bleed, failure to match whispering/screaming. |
| **Active Speaker Detection** | Audio-visual speaker matching via TalkNet / SyncNet and ArcFace character clustering | None | **P0 (Critical)** | Neural synthesis applied to wrong actors or off-screen dialogue. |
| **Neural Lip-Sync Engine** | Dual-tier synthesis: MuseTalk (preview) and LatentSync diffusion (final master) | None | **P0 (Critical)** | Frame-to-frame temporal jitter, lower-face blur, unnatural dental/tongue articulation. |
| **Compositing & Blending** | Multi-band Laplacian pyramid blending + RAFT optical flow smoothing + occlusion masking | None | **P0 (Critical)** | Visible square boundary seams around mouth, edge discoloration, hand/mic occlusion distortions. |
| **Studio QC Workbench** | Next.js 15 dual-viewport timeline player, phoneme-viseme manual editor, A/B comparison heatmap | None | **P1 (High)** | Directors unable to visually inspect, edit, or approve shots before final export. |
| **Distributed Orchestration** | Celery/Redis local queue evolving into Temporal.io DAGs with Kubernetes autoscaling | None | **P1 (High)** | Inability to process long-form (>15 min) media without timeouts or OOM crashes. |
| **Color & Audio Mastering** | ACEScc / Rec.709 color fidelity + ITU-R BS.1770-4 (-24 LKFS) 5.1/7.1 audio conform | None | **P1 (High)** | Crushed shadow details, dynamic range clipping, loudness broadcast rejection. |
| **Security & Provenance** | C2PA provenance manifest signing, SAG-AFTRA likeness consent checks, AES-256 encryption | None | **P2 (Medium)** | Studio IP leakage, legal claims under performer synthetic replica provisions. |

---

## 3. Recommended Service Decomposition & Architecture

The system is structured as a modular polyglot monorepo decoupling high-throughput Web/API logic from heavy GPU computation.

```
kavrai-ai/
├── apps/
│   ├── studio-web/             # Next.js 15 Frontend (Studio QC Workbench, Dual-Player, Timeline)
│   └── api-gateway/            # Node.js 20 / Fastify / TypeScript (Auth, WebSockets, Project State)
├── services/
│   ├── vaani-service/          # Python 3.11 / FastAPI (Demucs, WhisperX, Transcreation, TTS)
│   ├── atman-service/          # Python 3.11 / FastAPI (TalkNet, 3DMM, MuseTalk, LatentSync, Blend)
│   └── media-engine/           # Python 3.11 / Celery Worker (FFmpeg chunking, concat, ACES mastering)
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces & OpenAPI generated types
│   ├── python-schemas/         # Pydantic v2 schemas for inter-service gRPC / HTTP payload validation
│   └── proto/                  # Protobuf definitions for gRPC high-speed internal RPC
├── deploy/
│   ├── docker/                 # Dockerfiles & local docker-compose.yml (Phase 1)
│   └── k8s/                    # Helm charts & KEDA autoscaling manifests (Phase 2)
└── docs/                       # Architectural specifications & API contracts
```

### 3.1 Node.js Services (Frontend & Gateway)
1. **`apps/api-gateway` (Node.js 20 LTS + Fastify / NestJS):**
   - **Responsibilities:** Client authentication (JWT/OAuth2), project and reel CRUD, shot metadata indexing, WebSocket server for frame scrubbing events and real-time QC collaboration.
   - **Database Access:** Prisma / Drizzle ORM connecting to PostgreSQL 16.
   - **Task Dispatch:** Pushes job payloads (`IngestJob`, `TranscreateJob`, `RenderShotJob`) to Redis message queues.
2. **`apps/studio-web` (Next.js 15 App Router + React 19 + Tailwind CSS + WebGL):**
   - **Responsibilities:** Dual-viewport A/B video player with synchronized frame stepping, Web Audio API / Canvas timeline waveform renderer, interactive script transcreation editor with real-time syllable counter.

### 3.2 Python Services (AI Inference & Media Core)
1. **`services/vaani-service` (Python 3.11 + FastAPI + PyTorch 2.5):**
   - **Module 1 (Audio Demixing):** Hybrid Demucs v4 stem isolation (`vocals.wav` vs `m_and_e.wav`).
   - **Module 2 (Speech-to-Text & Diarization):** WhisperX (large-v3) with wav2vec2 forced alignment + PyAnnote 3.1 speaker clustering.
   - **Module 3 (Constrained Transcreator):** Structured LLM client (Claude 3.5 Sonnet / OpenAI / vLLM Qwen-2.5) with Pydantic output parsers enforcing target duration ($\pm 5\%$) and viseme closure anchors.
   - **Module 4 (Voice Cloning & Alignment):** CosyVoice 2 / StyleTTS2 cross-lingual zero-shot synthesis + WSOLA dynamic time-stretching + blind room impulse response convolution.
2. **`services/atman-service` (Python 3.11 + FastAPI + PyTorch 2.5 + CUDA 12.4):**
   - **Module 1 (Active Speaker Detection):** TalkNet + SyncNet audio-visual correlation + InsightFace ArcFace character ID tracking.
   - **Module 2 (Geometry Tracking):** Mediapipe Face Mesh (478 landmarks) and 3DMM/FLAME pose extraction.
   - **Module 3 (Tier 1 Preview Lip-Sync):** MuseTalk / LivePortrait flow-matching inference (25–40 FPS).
   - **Module 4 (Tier 2 Master Lip-Sync):** LatentSync latent diffusion inpainting (4–8 FPS).
   - **Module 5 (Detail Restoration & Compositing):** RestoreFormer++ / GFPGAN (commercial) / CodeFormer (studio adapter) + RAFT optical flow temporal smoothing + multi-band Laplacian pyramid compositing.
3. **`services/media-engine` (Python 3.11 + Celery / Temporal Worker):**
   - **Responsibilities:** FFmpeg frame-accurate shot splitting (SMPTE timecodes), color space tagging (Rec.709, DCI-P3, ACES), audio stem loudness mastering (ITU-R BS.1770-4 -24 LKFS), and lossless shot concatenation.

---

## 4. AI Model Stack: Comprehensive Options & Trade-Offs

| Task / Domain | Primary Option (Recommended) | Fallback / Alternative | License | VRAM Req. | Key Pros & Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stem Demixing** | **Meta Hybrid Demucs v4 (HTDemucs)** | Ultimate Vocal Remover 5 (UVR5) / MDX-Net | MIT | 8 GB | **Pro:** State-of-the-art cinematic isolation; zero vocal bleed. **Con:** Computationally heavier than simple spectrogram filters. |
| **ASR & Alignment** | **WhisperX (large-v3)** | NeMo Conformer-CTC | MIT / Apache 2.0 | 10 GB | **Pro:** Word-level and phoneme-level precise timestamps. **Con:** Requires GPU memory; fallback to Whisper-medium on 8 GB cards. |
| **Speaker Diarization** | **PyAnnote.audio 3.1** | Deepgram / Silero VAD | MIT | 4 GB | **Pro:** Highly accurate multi-speaker tracking. **Con:** Requires HuggingFace token and gated model agreement. |
| **Transcreation LLM** | **Claude 3.5 Sonnet / GPT-4o (Hybrid)** | Self-hosted vLLM (Qwen-2.5-72B / Llama-3.3-70B) | Commercial API / Apache 2.0 | 0 GB (API) / 48 GB (vLLM) | **Pro:** Nuanced literary adaptation and strict Pydantic schema adherence. **Con:** API costs / data transit unless vLLM is engaged. |
| **Voice Cloning (TTS)** | **CosyVoice 2 / F5-TTS** | StyleTTS2 / XTTS-v2 | Apache 2.0 | 12 GB | **Pro:** Exceptional cross-lingual zero-shot cloning with emotion transfer. **Con:** Requires clean reference audio ($\ge 25$ dB SNR). |
| **Active Speaker Detection** | **TalkNet + SyncNet** | TalkNet alone / Google ASD | MIT / Apache 2.0 | 6 GB | **Pro:** Prevents dubbing off-camera speech or silent background actors. **Con:** Sensitive to severe motion blur. |
| **3D Face Tracking** | **Mediapipe 3D Face (478 pts)** | FLAME 3DMM (Adapter) | Apache 2.0 / Custom Non-Comm | 2 GB | **Pro:** Extremely fast (120 FPS), commercially unrestricted. **Con:** FLAME provides richer 3D albedo but requires commercial waiver. |
| **Lip-Sync (Tier 1 Preview)**| **MuseTalk / LivePortrait** | Video-Retalking | MIT / Apache 2.0 | 8–12 GB | **Pro:** Real-time speed (25–40 FPS); low latency for interactive QC. **Con:** Minor softness during rapid head turns. |
| **Lip-Sync (Tier 2 Master)** | **LatentSync (Diffusion)** | Diff2Lip | Apache 2.0 | 16–24 GB | **Pro:** Studio theatrical quality; pristine teeth, tongue, and jaw dynamics. **Con:** Requires 16+ GB VRAM; slower inference (4–8 FPS). |
| **Face Restoration** | **RestoreFormer++ / GFPGAN v1.4** | CodeFormer (Studio Adapter) | BSD / Apache 2.0 / Non-Commercial | 6–8 GB | **Pro:** Fully commercially permissive; restores skin textures and teeth. **Con:** CodeFormer has marginally sharper eyes but is non-commercial. |

---

## 5. Cloud & Local GPU Hardware Sizing Matrix

### 5.1 Local R&D & Prototyping Environment (Phase 1 Target)
- **Minimum Workstation Spec:**
  - **GPU:** $1 \times \text{NVIDIA RTX 4090}$ (24 GB VRAM) or $1 \times \text{RTX 3090}$ (24 GB VRAM).
  - **CPU:** AMD Ryzen 9 7950X or Intel Core i9-14900K (16+ cores).
  - **RAM:** 64 GB DDR5.
  - **Storage:** 2 TB NVMe PCIe 4.0 SSD ($> 5,000\text{ MB/s}$ read/write).
- **Execution Strategy:** Sequential pipeline execution using Docker Compose. Models are dynamically loaded and offloaded between audio (VAANI) and visual (ATMAN) stages to prevent VRAM allocation overflows.

### 5.2 Studio Production Cluster (Phase 2 Target)
- **Inference Nodes (G-NODE-L40S):**
  - $4 \times \text{NVIDIA L40S}$ (48 GB VRAM each). Supports parallel batch processing of 4 simultaneous shot streams with zero model offloading overhead.
- **LLM & Master Audio Node (G-NODE-A100):**
  - $2 \times \text{NVIDIA A100}$ (80 GB SXM4) dedicated to continuous vLLM transcreation and multi-track audio mastering.
- **Network & Storage Fabric:**
  - 100 GbE RoCE (RDMA over Converged Ethernet) network fabric.
  - MinIO / Ceph NVMe-oF distributed object store with $\ge 25\text{ GB/s}$ aggregate read bandwidth for uncompressed DPX/ProRes streaming.

---

## 6. Licensing, Legal & Performer Rights Compliance

| Asset / Technology | Governing License | Risk Level | Mitigation & Compliance Policy |
| :--- | :--- | :--- | :--- |
| **CodeFormer** | S-Lab Non-Commercial License | **HIGH** | Excluded from the default core build. **RestoreFormer++** (BSD) and **GFPGAN** (Apache 2.0) are used by default. An optional plugin adapter for CodeFormer is provided only when a client holds a verified commercial license. |
| **FLAME Mesh Model** | Max Planck Institute Non-Commercial License | **HIGH** | Default 3D landmark tracking uses **Mediapipe 3D Face** (Apache 2.0). A pluggable FLAME adapter is available for licensed enterprise VFX environments. |
| **Meta Hybrid Demucs v4** | MIT License | **LOW** | Fully commercially permissible. Source attribution preserved in license manifests. |
| **WhisperX / PyAnnote** | MIT / Apache 2.0 | **LOW** | Fully compliant. Gated HuggingFace token injected via secure environment variables. |
| **LatentSync / MuseTalk** | Apache 2.0 / MIT | **LOW** | Commercially permissible without proprietary restrictions. |
| **SAG-AFTRA 2023 Agreement**| Collective Bargaining Agreement | **CRITICAL** | Platform mandates a signed digital Performer Likeness Consent Token in PostgreSQL before allowing any voice cloning or facial reenactment job to execute. |
| **C2PA Content Provenance** | Coalition Standard (Open) | **LOW** | All rendered media containers automatically inject a signed C2PA manifest declaring the AI localization process, tools used, and actor consent ID. |

---

## 7. Prioritized Implementation Roadmap (P0 / P1 / P2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ P0: FOUNDATION & LOCAL PIPELINE CORE (Weeks 1-8)                             │
│ ├── Monorepo scaffolding, Docker Compose, shared schema definitions         │
│ ├── VAANI Audio Pipeline: Ingestion, Demucs v4, WhisperX, LLM Transcreation  │
│ └── ATMAN Visual Pipeline: TalkNet ASD, MuseTalk/LatentSync, Face Blending   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ P1: STUDIO QC WORKBENCH & SCENE SCALING (Weeks 9-16)                         │
│ ├── Node.js / Fastify API Gateway + WebSocket timeline synchronization      │
│ ├── Next.js 15 Studio QC Workbench (Dual A/B Viewport, Viseme Editor)        │
│ └── PySceneDetect shot chunking, parallel render queue, SMPTE assembly       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ P2: ENTERPRISE CLOUD, SECURITY & THEATRICAL MASTERING (Weeks 17-24)          │
│ ├── Kubernetes Helm charts, KEDA autoscaling, Multi-GPU L40S cluster         │
│ ├── C2PA manifest signing, SAG-AFTRA consent ledger, TPN Gold compliance     │
│ └── ACES color grading pipeline + ITU-R BS.1770-4 5.1/7.1 audio conform      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 P0: Critical Foundation & Core Pipeline (Weeks 1–8)

#### Task P0.1: Monorepo Scaffolding & Polyglot Development Environment
- **Scope:** Initialize Turborepo / pnpm workspace for Node.js (`apps/studio-web`, `apps/api-gateway`) and Poetry / venv virtual environments for Python microservices (`services/vaani-service`, `services/atman-service`, `services/media-engine`).
- **Dependencies:** Docker, Docker Compose, Node.js 20 LTS, Python 3.11.
- **Acceptance Criteria:**
  1. `docker compose up` starts PostgreSQL, Redis, MinIO, Node.js API Gateway, and Python AI stubs with healthy status codes.
  2. Shared Pydantic schemas generate TypeScript definitions via `pydantic-to-typescript`.

#### Task P0.2: VAANI Audio Ingestion & Demixing Microservice
- **Scope:** Build the audio isolation pipeline using FFmpeg and Meta Hybrid Demucs v4.
- **Dependencies:** `torch>=2.5.0`, `demucs>=4.0.1`, `torchaudio`.
- **Acceptance Criteria:**
  1. Input movie clip (.mp4 / .mov) is demuxed into clean `vocals.wav` and `m_and_e.wav`.
  2. Vocal bleed in the M&E track is $\le -35\text{ dB}$ Signal-to-Distortion Ratio (SDR).

#### Task P0.3: WhisperX Speech-to-Text & Diarization Engine
- **Scope:** Implement phoneme- and word-level timestamped transcription linked with PyAnnote 3.1 speaker clustering.
- **Dependencies:** `whisperx`, `pyannote.audio>=3.1.0`.
- **Acceptance Criteria:**
  1. Transcribes speech with Word Error Rate (WER) $\le 6\%$ on clean cinema dialogue.
  2. Produces JSON with exact start/end millisecond timestamps and persistent speaker tokens (`SPEAKER_00`, `SPEAKER_01`).

#### Task P0.4: Timing-Constrained Transcreation Engine
- **Scope:** Implement structured LLM prompting with Pydantic validation enforcing syllable budgets and viseme anchor closures.
- **Dependencies:** `anthropic`, `openai`, `pydantic>=2.0`.
- **Acceptance Criteria:**
  1. Generates target language text whose estimated spoken duration is within $\pm 5\%$ of source duration.
  2. Aligns bilabial closures (`[p, b, m]`) within 3 frames of source facial lip closures.

#### Task P0.5: Zero-Shot Cross-Lingual Voice Cloning & Reverb Matching
- **Scope:** Implement voice synthesis via CosyVoice 2 / StyleTTS2 with pitch and energy transfer, followed by blind room acoustic convolution.
- **Dependencies:** `cosyvoice` / `styletts2`, `librosa`, `scipy`.
- **Acceptance Criteria:**
  1. Synthesizes target dialogue matching original actor timbre (Speaker Cosine Similarity $\ge 0.88$).
  2. Convolves synthesized audio with estimated room impulse response matching the scene acoustic profile.

#### Task P0.6: ATMAN Active Speaker Detection & Face Tracking
- **Scope:** Audio-visual active speaker verification using TalkNet/SyncNet coupled with Mediapipe 3D Face landmarks.
- **Dependencies:** `mediapipe`, `opencv-python`, `torch`.
- **Acceptance Criteria:**
  1. Correctly flags active speaker in multi-actor dialogue with $\ge 95\%$ accuracy.
  2. Bypasses visual synthesis when speech is off-screen or the speaker's back is turned.

#### Task P0.7: Dual-Tier Neural Lip-Sync Engine (MuseTalk + LatentSync)
- **Scope:** Implement the visual lip-sync generator supporting both Tier 1 (MuseTalk) preview rendering and Tier 2 (LatentSync) diffusion master rendering.
- **Dependencies:** `diffusers`, `transformers`, `accelerate`.
- **Acceptance Criteria:**
  1. Tier 1 (MuseTalk) processes 1080p video at $\ge 25\text{ FPS}$ on an RTX 4090.
  2. Tier 2 (LatentSync) achieves Lip Sync Error Confidence (LSE-C) $\ge 8.2$ and LSE Distance (LSE-D) $\le 6.5$.

#### Task P0.8: Detail Restoration & Multi-Band Laplacian Compositing
- **Scope:** Apply RestoreFormer++ / GFPGAN for teeth and skin pore restoration, combined with RAFT optical flow temporal smoothing and multi-band Laplacian blending.
- **Dependencies:** `opencv-python`, `torchvision`, `scikit-image`.
- **Acceptance Criteria:**
  1. No visible boundary seam around the inpainting box ($SSIM \ge 0.992$ outside the mouth region).
  2. Zero frame-to-frame boundary flickering across a 24 fps sequence.

---

### 7.2 P1: Studio QC Workbench & Scene Scale (Weeks 9–16)

#### Task P1.1: Node.js API Gateway & WebSocket Synchronization Hub
- **Scope:** Build the Fastify/Node.js API gateway managing PostgreSQL project state and broadcasting frame-by-frame scrub events over WebSockets.
- **Dependencies:** `fastify`, `@fastify/websocket`, `prisma`, `ioredis`.
- **Acceptance Criteria:**
  1. WebSocket latency $\le 20\text{ ms}$ for timeline cursor scrubbing.
  2. Reliable state synchronization across multiple connected studio clients.

#### Task P1.2: Next.js 15 Studio QC Workbench UI
- **Scope:** Develop the dual-viewport A/B video player with frame-stepping, difference heatmap overlay, and multi-track audio/viseme timeline editor.
- **Dependencies:** `next>=15.0.0`, `react>=19.0.0`, `tailwindcss`, `wavesurfer.js`.
- **Acceptance Criteria:**
  1. Frame-locked playback of original and localized video streams at 24/25 fps without desync.
  2. Interactive viseme timeline allowing dialogue directors to drag-and-nudge words frame-by-frame.

#### Task P1.3: Scene & Shot Decomposition Engine
- **Scope:** Integrate PySceneDetect / TransNet v2 to split long-form media into independent SMPTE-indexed shot assets.
- **Dependencies:** `scenedetect`, `ffmpeg-python`.
- **Acceptance Criteria:**
  1. Accurately segments scenes with $\ge 98\%$ cut detection precision.
  2. Generates lossless shot chunks with frame-accurate SMPTE start/end timecodes.

#### Task P1.4: Asynchronous Parallel Job Queue & Concat Engine
- **Scope:** Celery / Redis task queue dispatching shot rendering tasks across local or networked GPUs, followed by lossless FFmpeg concat demuxing.
- **Dependencies:** `celery`, `redis`, `ffmpeg`.
- **Acceptance Criteria:**
  1. Automatically distributes 100+ shot tasks across available worker GPUs without memory deadlocks.
  2. Assembles processed shots into a continuous, seamless master video with zero audio pop or video freeze at cut points.

---

### 7.3 P2: Enterprise Cloud, Security & Theatrical Mastering (Weeks 17–24)

#### Task P2.1: Kubernetes Deployment & KEDA GPU Autoscaling
- **Scope:** Package all microservices into production Docker containers and write Kubernetes Helm charts with KEDA GPU queue-depth autoscalers.
- **Dependencies:** `kubectl`, `helm`, `keda`, `nvidia-gpu-operator`.
- **Acceptance Criteria:**
  1. Worker pods automatically scale from 0 to $N$ based on pending Redis shot queue depth.
  2. Graceful pod termination ensures no in-flight shot render is corrupted upon spot-instance preemption.

#### Task P2.2: Performer Consent Ledger & C2PA Provenance Manifest
- **Scope:** Implement cryptographic actor consent verification and inject C2PA metadata manifests into output video containers.
- **Dependencies:** `c2pa-python`, `cryptography`.
- **Acceptance Criteria:**
  1. Pipeline rejects rendering jobs if a verified SAG-AFTRA / Performer Consent Token is missing.
  2. Output media files validate against official C2PA verification tools (Verify.contentauthenticity.org).

#### Task P2.3: ACES Color Pipeline & ITU-R BS.1770-4 Mastering
- **Scope:** Integrate OpenColorIO (OCIO) for ACEScc color management and libebur128 for ITU-R BS.1770-4 (-24 LKFS $\pm 0.5\text{ dB}$) dialogue normalization.
- **Dependencies:** `opencolorio`, `ffmpeg` (ebur128 filter).
- **Acceptance Criteria:**
  1. Zero color clipping or gamut compression between input 10-bit ProRes and output localized master.
  2. Dialogue loudness strictly complies with theatrical and broadcast delivery standards.

---

## 8. Quantitative Verification & Acceptance Criteria Matrix

| Verification Domain | Test Category | Target Threshold / Metric | Verification Tooling |
| :--- | :--- | :--- | :--- |
| **Speech Quality** | Objective PESQ | $\text{PESQ} \ge 4.2 \text{ / } 5.0$ | `pesq` Python library |
| **Speech Intelligibility** | Objective STOI | $\text{STOI} \ge 0.94$ | `pystoi` Python library |
| **Voice Likeness** | Speaker Embedding Cosine Sim | $\text{SECS} \ge 0.88$ | ECAPA2 / Resemblyzer embeddings |
| **Visual Lip Sync Accuracy** | SyncNet Confidence (LSE-C) | $\text{LSE-C} \ge 8.2$ | Official SyncNet evaluation suite |
| **Visual Lip Sync Distance** | SyncNet Distance (LSE-D) | $\text{LSE-D} \le 6.5$ | Official SyncNet evaluation suite |
| **Image Perceptual Quality** | LPIPS (Learned Perceptual) | $\text{LPIPS} \le 0.04$ | PyTorch `lpips` library |
| **Non-Mouth Identity Hold** | SSIM on Upper Face / Neck | $\text{SSIM} \ge 0.992$ | `scikit-image` SSIM |
| **Audio Loudness Norm** | Integrated Loudness | $-24.0 \text{ LKFS} \pm 0.5 \text{ dB}$ | FFmpeg `ebur128` filter |
| **Timeline Sync Drift** | Audio-Video Alignment | $0 \text{ frames drift across 120 min}$ | Frame-accurate SMPTE audit tool |
| **Security Compliance** | C2PA Manifest Verification | Valid signature & claim generator | C2PA CLI tool (`c2patool`) |

---

## 9. Next Steps & Execution Gate

With `docs/MASTER_ARCHITECTURE.md` and `docs/ARCHITECTURE_GAP_ANALYSIS.md` ratified:
1. **Approval Gate:** Architecture and Gap Analysis are aligned with team consensus.
2. **Immediate Implementation Step (P0.1):** Scaffold the polyglot monorepo structure, Docker Compose environment, shared schemas, and base dependencies.
