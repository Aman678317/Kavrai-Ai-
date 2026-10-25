# Cinema-Grade AI Film Localization Platform: Production System Design
**Document ID:** SYS-DESIGN-2026-V1  
**Target Platform:** Cinema-Grade AI Film Localization & Multilingual Dubbing (BRAHMA AI / VAANI / ATMAN Inspired)  
**Parent Specifications:** [docs/MASTER_ARCHITECTURE.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/MASTER_ARCHITECTURE.md), [docs/ARCHITECTURE_GAP_ANALYSIS.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/ARCHITECTURE_GAP_ANALYSIS.md)  
**Status:** Canonical System Design Blueprint  

---

## 1. Executive Summary & End-to-End System Topology

### 1.1 Architectural Vision
The platform is designed to localize full-length cinematic feature films (90–180 minutes, 4K/2K, 24/25 fps) into any target international or regional language with theatrical fidelity. The architecture integrates:
- **Premium Apple-Style Studio Frontend:** Built with Next.js 15, WebGL, and Tailwind CSS. Features dark-mode glassmorphism, frame-accurate dual-viewport scrubbing, interactive multi-track timelines, and director approval gates.
- **Node.js Orchestration & BFF Tier:** High-concurrency Fastify/TypeScript gateway managing WebSocket streaming, project/shot relational state, and distributed task dispatch.
- **Python AI Inference Microservices:**
  - **VAANI Voice Engine:** Hybrid Demucs v4 audio stem separation, WhisperX phoneme-level forced alignment, syllable-budgeted LLM transcreation, CosyVoice 2 / StyleTTS2 zero-shot cross-lingual voice cloning, and room impulse response convolution.
  - **ATMAN Visual Engine:** TalkNet audio-visual active speaker detection, Mediapipe/FLAME 3D head pose tracking, dual-tier lip-sync (Tier 1 MuseTalk for preview, Tier 2 LatentSync for theatrical master), RestoreFormer++/GFPGAN face restoration, and multi-band Laplacian pyramid compositing.
- **Full-Movie Distributed Processing Engine:** Scene and shot decomposition via PySceneDetect, Celery/Temporal task scheduling, parallel GPU batch rendering, and lossless SMPTE-accurate conform stitching.
- **Hollywood Studio Security & Rights Governance:** MPA/TPN Gold Shield compliance, SAG-AFTRA 2023 performer digital likeness consent ledgers, and C2PA cryptographic provenance injection.

### 1.2 End-to-End System Topology

```mermaid
flowchart TB
    subgraph CLIENT["Client Tier (Studio QC Workbench)"]
        UI["Studio Web Portal (Next.js 15 + WebGL Player)"]
        WS_CLIENT["WebSocket Timeline Client"]
    end

    subgraph GATEWAY["API Gateway & BFF Tier (Node.js 20 / Fastify)"]
        API_GW["Fastify API Gateway"]
        AUTH["Auth & JWT Service"]
        WS_HUB["WebSocket Synchronization Hub"]
        STATE_MGR["Project & Shot State Manager"]
    end

    subgraph STORAGE["Data & Storage Infrastructure"]
        PG[("PostgreSQL 16 + pgvector<br/>(Project & Shot Relational DB)")]
        REDIS[("Redis 7.2 Cluster<br/>(Pub/Sub, Queue, Cache)")]
        MINIO[("MinIO / AWS S3<br/>(NVMe Distributed Object Store)")]
    end

    subgraph ORCHESTRATION["Distributed Orchestration Tier"]
        TEMPORAL["Temporal.io / Celery Orchestrator"]
        INGEST_Q["Queue: media.ingest"]
        VAANI_Q["Queue: ai.vaani.audio"]
        ATMAN_PREVIEW_Q["Queue: ai.atman.preview"]
        ATMAN_MASTER_Q["Queue: ai.atman.master"]
        CONFORM_Q["Queue: media.conform"]
    end

    subgraph AI_SERVICES["GPU AI Inference Services (Python 3.11 / PyTorch 2.5)"]
        VAANI_SVC["VAANI Service (Demucs, WhisperX, TTS)"]
        ATMAN_SVC["ATMAN Service (TalkNet, LatentSync, Blend)"]
        MEDIA_SVC["Media Engine (FFmpeg, OCIO, ebur128)"]
    end

    UI <-->|HTTPS / REST| API_GW
    WS_CLIENT <-->|WSS (WebSockets)| WS_HUB
    API_GW --> AUTH
    API_GW --> STATE_MGR
    STATE_MGR --> PG
    WS_HUB <--> REDIS

    STATE_MGR --> TEMPORAL
    TEMPORAL --> INGEST_Q & VAANI_Q & ATMAN_PREVIEW_Q & ATMAN_MASTER_Q & CONFORM_Q

    INGEST_Q --> MEDIA_SVC
    VAANI_Q --> VAANI_SVC
    ATMAN_PREVIEW_Q --> ATMAN_SVC
    ATMAN_MASTER_Q --> ATMAN_SVC
    CONFORM_Q --> MEDIA_SVC

    VAANI_SVC <-->|Read / Write Stems| MINIO
    ATMAN_SVC <-->|Read / Write Frames| MINIO
    MEDIA_SVC <-->|Read / Write Video| MINIO

    VAANI_SVC -.->|gRPC Timestamps| ATMAN_SVC
```

---

## 2. Monorepo Structure & Service Boundaries

The platform is organized as a unified, high-cohesion polyglot monorepo:

```
kavrai-ai/
├── apps/
│   ├── studio-web/                     # Next.js 15 Studio QC Workbench
│   │   ├── src/
│   │   │   ├── app/                    # App Router (projects, timeline, qc, settings)
│   │   │   ├── components/
│   │   │   │   ├── player/             # Dual-viewport WebGL / Canvas player
│   │   │   │   ├── timeline/           # Multi-track audio/viseme timeline
│   │   │   │   ├── transcreation/      # Syllable counter & script editor
│   │   │   │   └── ui/                 # Apple-style glassmorphic UI components
│   │   │   ├── hooks/                  # WebSockets, audio context, keyboard shortcuts
│   │   │   └── lib/                    # State management, timecode utilities
│   │   └── package.json
│   │
│   └── api-gateway/                    # Node.js 20 LTS / Fastify Backend-for-Frontend
│       ├── src/
│       │   ├── routes/                 # REST endpoints (auth, projects, shots, qc)
│       │   ├── websockets/             # Real-time timeline synchronization & presence
│       │   ├── services/               # Database repositories & queue dispatchers
│       │   ├── plugins/                # JWT auth, CORS, Swagger OpenAPI, rate limiting
│       │   └── index.ts
│       └── package.json
│
├── services/
│   ├── vaani-service/                  # Python 3.11 / FastAPI Audio & Speech Engine
│   │   ├── src/
│   │   │   ├── demuxing/               # Meta Hybrid Demucs v4 pipeline
│   │   │   ├── asr/                    # WhisperX + PyAnnote 3.1 diarization
│   │   │   ├── transcreation/          # Structured LLM transcreation (Claude/vLLM)
│   │   │   ├── voice_cloning/          # CosyVoice 2 / StyleTTS2 zero-shot synthesis
│   │   │   ├── acoustics/              # Room impulse response estimation & convolution
│   │   │   └── main.py                 # FastAPI & gRPC server entrypoints
│   │   └── pyproject.toml
│   │
│   ├── atman-service/                  # Python 3.11 / FastAPI Visual Performance Engine
│   │   ├── src/
│   │   │   ├── asd/                    # TalkNet + SyncNet active speaker detection
│   │   │   ├── tracking/               # Mediapipe 3D Face / FLAME pose tracking
│   │   │   ├── lip_sync_preview/       # Tier 1: MuseTalk / LivePortrait flow model
│   │   │   ├── lip_sync_master/        # Tier 2: LatentSync diffusion inpainting
│   │   │   ├── restoration/            # RestoreFormer++ / GFPGAN codebook restoration
│   │   │   ├── compositing/            # Laplacian pyramid blending + RAFT optical flow
│   │   │   └── main.py                 # FastAPI & gRPC server entrypoints
│   │   └── pyproject.toml
│   │
│   └── media-engine/                   # Python 3.11 Media Processing & Concat Worker
│       ├── src/
│       │   ├── chunking/               # PySceneDetect frame-accurate shot splitting
│       │   ├── mastering/              # ACEScc color management & ITU-R BS.1770-4 conform
│       │   ├── concat/                 # Lossless concat demuxer & MP4/ProRes packaging
│       │   ├── provenance/             # C2PA manifest builder & cryptographic signer
│       │   └── worker.py               # Celery / Temporal task consumer
│       └── pyproject.toml
│
├── packages/
│   ├── shared-types/                   # Shared TypeScript models (generated from schemas)
│   ├── python-schemas/                 # Canonical Pydantic v2 data models
│   └── proto/                          # Protobuf definitions for inter-service gRPC
│       ├── vaani.proto
│       └── atman.proto
│
├── deploy/
│   ├── docker/                         # Local development Dockerfiles & docker-compose.yml
│   └── k8s/                            # Production Kubernetes Helm charts & KEDA autoscalers
└── docs/                               # Architectural & System Design Documentation
```

### 2.1 Communication Protocol Matrix

| Service Interaction | Protocol | Payload Type | Latency SLA | Encryption |
| :--- | :--- | :--- | :--- | :--- |
| **Studio Web $\leftrightarrow$ API Gateway** | HTTPS (REST) | JSON (OpenAPI 3.1) | $\le 100\text{ ms}$ | TLS 1.3 |
| **Studio Web $\leftrightarrow$ API Gateway** | WebSockets (WSS) | JSON / Binary Frames | $\le 20\text{ ms}$ | TLS 1.3 |
| **API Gateway $\leftrightarrow$ PostgreSQL** | TCP (Postgres Wire) | SQL DDL/DML (Prisma) | $\le 5\text{ ms}$ | TLS 1.3 |
| **API Gateway $\leftrightarrow$ Redis** | TCP (RESP) | Binary / Key-Value / Pub-Sub | $\le 1\text{ ms}$ | TLS 1.3 |
| **Orchestrator $\leftrightarrow$ Python Workers** | AMQP / Redis (Celery) | CloudEvents JSON | $\le 10\text{ ms}$ | Mutual TLS |
| **VAANI $\leftrightarrow$ ATMAN (Direct Sync)** | gRPC / HTTP/2 | Protocol Buffers (Proto3) | $\le 5\text{ ms}$ | Mutual TLS |
| **Workers $\leftrightarrow$ MinIO / S3** | HTTPS (S3 API) | Raw Bytes (Video Chunks/Stems) | $> 500\text{ MB/s}$ | TLS 1.3 |

---

## 3. API Specifications & Data Contracts

### 3.1 REST API Specification (OpenAPI 3.1 Core Endpoints)

#### 1. Ingest Master Video
- **Endpoint:** `POST /api/v1/projects/{projectId}/ingest`
- **Request Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Request Payload:**
```json
{
  "sourceVideoUri": "s3://cinema-vault/dune2/reel_01_prores422hq.mov",
  "sourceLanguage": "en",
  "targetLanguages": ["hi-IN", "es-ES", "de-DE"],
  "frameRate": 24.0,
  "colorSpace": "ACEScg",
  "audioMasterFormat": "5.1_SURROUND",
  "actorConsentTokenId": "8f9a2b1c-3d4e-4f5a-b6c7-d8e9f0a1b2c3"
}
```
- **Response (`202 Accepted`):**
```json
{
  "jobId": "job_ingest_987654",
  "projectId": "proj_dune2_reel01",
  "status": "QUEUED",
  "estimatedDurationSeconds": 480,
  "createdAt": "2026-10-25T23:50:00Z"
}
```

#### 2. Get Shot Breakdown & Timeline Data
- **Endpoint:** `GET /api/v1/projects/{projectId}/shots?targetLanguage=hi-IN`
- **Response (`200 OK`):**
```json
{
  "projectId": "proj_dune2_reel01",
  "totalShots": 142,
  "shots": [
    {
      "shotId": "shot_0142",
      "shotIndex": 142,
      "startFrame": 3412,
      "endFrame": 3478,
      "startSmpte": "00:14:22:10",
      "endSmpte": "00:14:25:04",
      "hasActiveDialogue": true,
      "activeSpeakerId": "ACTOR_LEAD_MALE",
      "qcStatus": "APPROVED",
      "dialogue": {
        "dialogueId": "dlg_0142_01",
        "sourceText": "We cannot cross the perimeter before dusk.",
        "targetText": "हम शाम से पहले सीमा पार नहीं कर सकते।",
        "targetLanguage": "hi-IN",
        "audioStemUri": "s3://cinema-vault/dune2/shots/shot_0142_hi.wav",
        "syncScore": 9.12,
        "lseConfidence": 8.94
      },
      "previewVideoUri": "https://cdn.kavrai.ai/dune2/shots/shot_0142_preview.mp4",
      "masterVideoUri": "s3://cinema-vault/dune2/shots/shot_0142_master.mov"
    }
  ]
}
```

#### 3. Update Dialogue Transcreation & Trigger Re-synthesis
- **Endpoint:** `PUT /api/v1/shots/{shotId}/dialogue`
- **Request Payload:**
```json
{
  "targetLanguage": "hi-IN",
  "editedTargetText": "हम सूरज ढलने से पहले सीमा पार नहीं कर सकते।",
  "syllableBudgetOverride": 14,
  "visemeAnchorNudgeFrames": {
    "anchor_01": 2,
    "anchor_02": -1
  },
  "renderTier": "PREVIEW"
}
```
- **Response (`200 OK`):**
```json
{
  "dialogueId": "dlg_0142_01",
  "shotId": "shot_0142",
  "status": "PROCESSING_AUDIO",
  "estimatedMs": 1200
}
```

#### 4. Export Final Master Feature Film
- **Endpoint:** `POST /api/v1/projects/{projectId}/export`
- **Request Payload:**
```json
{
  "targetLanguage": "hi-IN",
  "containerFormat": "PRORES_422_HQ",
  "audioLayout": "5.1_SURROUND",
  "loudnessStandard": "ITU_R_BS_1770_4",
  "targetLufs": -24.0,
  "injectC2paManifest": true
}
```
- **Response (`202 Accepted`):**
```json
{
  "exportJobId": "export_dune2_hi_master",
  "status": "CONCAT_AND_MASTERING",
  "outputUri": "s3://cinema-vault/dune2/exports/dune2_reel01_hindi_master.mov"
}
```

---

### 3.2 WebSocket Timeline Synchronization Protocol

When a sound supervisor or director scrubs through the film on the Studio QC Workbench, frame-accurate synchronization is broadcast via WebSockets.

- **WebSocket URL:** `wss://api.kavrai.ai/v1/ws/timeline?projectId={projectId}`
- **Message Types:**

```json
// 1. Client Cursor Scrub Event (Client -> Server -> Broadcast)
{
  "type": "TIMELINE_SCRUB",
  "userId": "user_director_01",
  "smpteTimecode": "00:14:23:12",
  "frameIndex": 3444,
  "playbackRate": 1.0,
  "isPlaying": false
}

// 2. Viseme Anchor Nudge Event (Client -> Server)
{
  "type": "VISEME_NUDGE",
  "shotId": "shot_0142",
  "phoneme": "p",
  "originalFrame": 3442,
  "targetFrame": 3445
}

// 3. Render Progress Stream (Server -> Client)
{
  "type": "RENDER_PROGRESS",
  "shotId": "shot_0142",
  "tier": "PREVIEW",
  "currentFrame": 45,
  "totalFrames": 66,
  "fps": 34.2,
  "percentage": 68.1
}

// 4. Shot QC Approval Lock (Client -> Server)
{
  "type": "QC_APPROVAL_LOCK",
  "shotId": "shot_0142",
  "approvedBy": "user_vfx_lead",
  "role": "LEAD_VFX_SUPERVISOR",
  "locked": true
}
```

---

### 3.3 Inter-Service gRPC Protocol Buffers

High-speed direct communication between `media-engine`, `vaani-service`, and `atman-service` uses gRPC.

#### `proto/vaani.proto`
```protobuf
syntax = "proto3";

package kavrai.vaani.v1;

service VaaniAudioService {
  rpc DemuxAudioStems (DemuxAudioRequest) returns (DemuxAudioResponse);
  rpc TranscribeAndDiarize (TranscribeRequest) returns (TranscribeResponse);
  rpc TranscreateDialogue (TranscreateRequest) returns (TranscreateResponse);
  rpc SynthesizeVoice (SynthesizeVoiceRequest) returns (SynthesizeVoiceResponse);
}

message DemuxAudioRequest {
  string project_id = 1;
  string source_audio_uri = 2;
  int32 sample_rate = 3;
}

message DemuxAudioResponse {
  string vocals_stem_uri = 1;
  string m_and_e_stem_uri = 2;
  double snr_db = 3;
}

message TranscribeRequest {
  string vocals_stem_uri = 1;
  string language_code = 2;
}

message WordAlignment {
  string word = 1;
  int64 start_ms = 2;
  int64 end_ms = 3;
  repeated string phonemes = 4;
}

message DialogueSegmentProto {
  string dialogue_id = 1;
  string speaker_id = 2;
  int64 start_ms = 3;
  int64 end_ms = 4;
  string source_text = 5;
  repeated WordAlignment words = 6;
}

message TranscribeResponse {
  repeated DialogueSegmentProto segments = 1;
}

message TranscreateRequest {
  DialogueSegmentProto segment = 1;
  string target_language = 2;
  int32 max_syllable_budget = 3;
}

message TranscreateResponse {
  string target_text = 1;
  int32 syllable_count = 2;
  int64 estimated_duration_ms = 3;
}

message SynthesizeVoiceRequest {
  string speaker_id = 1;
  string target_text = 2;
  string target_language = 3;
  string reference_audio_stem_uri = 4;
  int64 target_duration_ms = 5;
}

message SynthesizeVoiceResponse {
  string synthesized_audio_uri = 1;
  double speaker_similarity_score = 2;
}
```

#### `proto/atman.proto`
```protobuf
syntax = "proto3";

package kavrai.atman.v1;

service AtmanVisionService {
  rpc DetectActiveSpeaker (ActiveSpeakerRequest) returns (ActiveSpeakerResponse);
  rpc RenderLipSyncShot (RenderLipSyncRequest) returns (RenderLipSyncResponse);
}

enum RenderTier {
  TIER_1_PREVIEW = 0;
  TIER_2_CINEMA_MASTER = 1;
}

message ActiveSpeakerRequest {
  string shot_video_uri = 1;
  string dialogue_audio_uri = 2;
}

message ActiveSpeakerResponse {
  bool is_speaker_in_frame = 1;
  string active_actor_id = 2;
  repeated int32 face_bounding_box = 3;
}

message RenderLipSyncRequest {
  string shot_id = 1;
  string original_video_chunk_uri = 2;
  string target_audio_stem_uri = 3;
  RenderTier tier = 4;
  bool enable_restoration = 5;
}

message RenderLipSyncResponse {
  string rendered_video_uri = 1;
  double lse_confidence = 2;
  double lse_distance = 3;
  int64 total_frames_processed = 4;
}
```

---

## 4. Database Schema Design (PostgreSQL 16 + pgvector)

The relational and vector database structure guarantees ACID transactional consistency, frame-accurate indexing, and biometric consent audit trails.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Actor Consent & SAG-AFTRA Rights Tokens
CREATE TABLE performer_consent_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_name VARCHAR(255) NOT NULL,
    actor_legal_identifier VARCHAR(100) NOT NULL,
    union_affiliation VARCHAR(50) DEFAULT 'SAG-AFTRA',
    consent_contract_hash VARCHAR(64) NOT NULL,
    authorized_projects TEXT[] NOT NULL,
    voice_cloning_permitted BOOLEAN NOT NULL DEFAULT TRUE,
    visual_reenactment_permitted BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    signature_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    production_studio VARCHAR(255) NOT NULL,
    source_language VARCHAR(10) NOT NULL DEFAULT 'en',
    target_languages VARCHAR(10)[] NOT NULL,
    frame_rate NUMERIC(6,3) NOT NULL DEFAULT 24.000,
    color_space VARCHAR(50) NOT NULL DEFAULT 'ACEScg',
    audio_format VARCHAR(50) NOT NULL DEFAULT '5.1_SURROUND',
    total_frames INT NOT NULL DEFAULT 0,
    duration_seconds NUMERIC(10,3) NOT NULL DEFAULT 0.0,
    master_video_uri TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Actor Biometric Profiles (Protected Storage)
CREATE TABLE actor_biometric_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    consent_token_id UUID REFERENCES performer_consent_tokens(id),
    character_name VARCHAR(255) NOT NULL,
    face_embedding vector(512),       -- ArcFace 512-d feature vector
    voice_embedding vector(256),      -- ECAPA2 256-d speaker timbre vector
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actor_face_vector ON actor_biometric_profiles USING ivfflat (face_embedding vector_cosine_ops);
CREATE INDEX idx_actor_voice_vector ON actor_biometric_profiles USING ivfflat (voice_embedding vector_cosine_ops);

-- 4. Shots Table (SMPTE Indexed)
CREATE TABLE shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    shot_index INT NOT NULL,
    start_frame INT NOT NULL,
    end_frame INT NOT NULL,
    start_smpte VARCHAR(12) NOT NULL,
    end_smpte VARCHAR(12) NOT NULL,
    has_active_dialogue BOOLEAN NOT NULL DEFAULT FALSE,
    active_speaker_profile_id UUID REFERENCES actor_biometric_profiles(id),
    is_offscreen_dialogue BOOLEAN NOT NULL DEFAULT FALSE,
    source_video_chunk_uri TEXT NOT NULL,
    preview_video_uri TEXT,
    master_video_uri TEXT,
    qc_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PROCESSING',
    CONSTRAINT unique_project_shot_index UNIQUE (project_id, shot_index)
);

CREATE INDEX idx_shots_project_smpte ON shots (project_id, start_frame);

-- 5. Dialogue Segments Table
CREATE TABLE dialogue_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shot_id UUID REFERENCES shots(id) ON DELETE CASCADE,
    target_language VARCHAR(10) NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    phoneme_viseme_timeline JSONB NOT NULL,
    audio_stem_uri TEXT,
    target_duration_ms INT NOT NULL,
    lse_confidence NUMERIC(4,2),
    lse_distance NUMERIC(4,2),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_shot_language UNIQUE (shot_id, target_language)
);

-- 6. QC Review & Director Annotations
CREATE TABLE qc_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shot_id UUID REFERENCES shots(id) ON DELETE CASCADE,
    frame_index INT NOT NULL,
    author_id VARCHAR(100) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    annotation_type VARCHAR(50) NOT NULL, -- 'LIP_FLAP_DESYNC', 'COLOR_BLEED', 'OCCLUSION_ERROR', 'TIMING_NUDGE'
    notes TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Log (TPN Compliance)
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Task Queues, State Machine & Orchestration

Distributed processing uses a strict directed acyclic graph (DAG) state machine managed by **Temporal.io** or **Celery + Redis**.

### 5.1 Shot Processing State Machine

```mermaid
stateDiagram-v2
    [*] --> Ingested: Master Video Uploaded
    Ingested --> Demuxing: Extract Dialogue & M&E Stems
    Demuxing --> ShotSplitting: PySceneDetect Scene Cuts
    ShotSplitting --> ASR_Diarization: WhisperX + PyAnnote
    ASR_Diarization --> Transcreation: LLM Syllable Adaptation
    Transcreation --> VoiceSynthesis: CosyVoice 2 / StyleTTS2
    VoiceSynthesis --> ActiveSpeakerCheck: TalkNet Correlation

    state ActiveSpeakerCheck {
        [*] --> InFrameCheck
        InFrameCheck --> OffScreen: Speaker Not in Frame
        InFrameCheck --> InFrame: Speaker in Frame
    }

    OffScreen --> ConcatQueue: Passthrough Visuals
    InFrame --> Tier1Render: MuseTalk (Fast Preview)
    Tier1Render --> QCReview: Ready for Director Scrubbing

    state QCReview {
        [*] --> DirectorInspection
        DirectorInspection --> EditsRequested: Nudge Visemes / Script
        EditsRequested --> Transcreation: Re-run Synthesis
        DirectorInspection --> Approved: Shot Approved
    }

    Approved --> Tier2Render: LatentSync (Diffusion Master)
    Tier2Render --> DetailRestoration: RestoreFormer++
    DetailRestoration --> Blending: Laplacian Pyramid + Optical Flow
    Blending --> ConcatQueue: Render Complete
    ConcatQueue --> ConformMaster: Full Movie Audio/Video Conform
    ConformMaster --> C2PAInjection: Sign Provenance Manifest
    C2PAInjection --> [*]: Final Theatrical Release
```

### 5.2 Celery / Redis Queue Topology

```
REDIS 7.2 BROKER
├── Queue: queue.media.ingest (Concurrency: 4, Node: CPU-Heavy)
│   └── Task: ingest_and_demux_audio_stems
├── Queue: queue.ai.vaani.transcribe (Concurrency: 8, Node: GPU-VAD)
│   └── Task: whisperx_diarize_and_align
├── Queue: queue.ai.vaani.transcreate (Concurrency: 16, Node: CPU / vLLM)
│   └── Task: llm_syllable_constrained_transcreate
├── Queue: queue.ai.vaani.tts (Concurrency: 8, Node: GPU-Audio)
│   └── Task: synthesize_cross_lingual_cloned_voice
├── Queue: queue.ai.atman.preview (Concurrency: 16, Node: GPU-L40S)
│   └── Task: render_musetalk_tier1_preview
├── Queue: queue.ai.atman.master (Concurrency: 8, Node: GPU-L40S / A100)
│   └── Task: render_latentsync_tier2_master
└── Queue: queue.media.master (Concurrency: 2, Node: CPU-Conform)
    └── Task: conform_aces_and_export_master
```

---

## 6. Storage Hierarchy & Media File Lifecycle

Cinematic localization handles multi-gigabyte ProRes and DPX files. The platform implements a three-tier hierarchical storage strategy:

```
+-----------------------------------------------------------------------------------------------+
|  TIER 1: HIGH-SPEED LOCAL NVMe SCRATCH BUFFER (/mnt/scratch)                                  |
|  - Storage: $2 \times 3.84\text{ TB}$ NVMe RAID-0 per worker (> 6,500 MB/s read/write)        |
|  - Format: Uncompressed 10-bit PNG / DPX sequences & WAV 48kHz 24-bit PCM                     |
|  - Lifecycle: Active shot computation only; securely erased (shredded) upon task completion   |
+-----------------------------------------------------------------------------------------------+
                                               ▲
                                               │ Zero-copy memory mapped transfers
                                               ▼
+-----------------------------------------------------------------------------------------------+
|  TIER 2: DISTRIBUTED OBJECT STORAGE (MinIO / AWS S3 NVMe Cluster)                             |
|  - Storage: Ceph / MinIO Cluster over 100 GbE RoCE Network (> 25 GB/s aggregate)             |
|  - Layout:                                                                                    |
|    ├── /projects/{projectId}/source/master_prores422hq.mov                                    |
|    ├── /projects/{projectId}/stems/vocals_clean.wav                                          |
|    ├── /projects/{projectId}/stems/m_and_e_5.1.wav                                           |
|    ├── /projects/{projectId}/shots/shot_{index}/preview.mp4                                  |
|    ├── /projects/{projectId}/shots/shot_{index}/master_latentsync.mov                        |
|    └── /projects/{projectId}/exports/localized_master_hindi.mov                              |
+-----------------------------------------------------------------------------------------------+
                                               ▲
                                               │ Background asynchronous lifecycle archiving
                                               ▼
+-----------------------------------------------------------------------------------------------+
|  TIER 3: COLD VAULT & DISASTER RECOVERY (AWS S3 Glacier Flexible / GCP Archive)               |
|  - Retention: Completed release packages, C2PA signatures, project audit logs                 |
+-----------------------------------------------------------------------------------------------+
```

---

## 7. GPU Worker Topology & Model Execution Pipeline

### 7.1 Single-GPU Workstation Layout (Phase 1 Target: 24 GB VRAM RTX 4090)
To run end-to-end scene localization on a single developer workstation without GPU out-of-memory (OOM) errors, models are loaded dynamically in stages:

```
STAGE 1: Audio Processing (VAANI)
 ├── Demucs v4 (8 GB) -> Transcribes & extracts stems -> Offload from VRAM
 ├── WhisperX (10 GB) -> Word alignment -> Offload from VRAM
 └── CosyVoice 2 (12 GB) -> Synthesize localized audio -> Offload from VRAM

STAGE 2: Visual Processing (ATMAN)
 ├── Mediapipe Face Tracking (CPU / 2 GB VRAM)
 ├── LatentSync / MuseTalk (16 GB VRAM) -> Inpaint mouth region
 ├── RestoreFormer++ (6 GB VRAM) -> Restore skin and teeth
 └── Laplacian Blending (CPU / 4 GB VRAM) -> Composite back into 4K plate
```

### 7.2 Multi-GPU Studio Cluster Node (Phase 2 Target: $4 \times \text{NVIDIA L40S}$ 48 GB)
In a dedicated production node, models remain permanently resident in dedicated GPU memory:
- **GPU 0 (VAANI Core):** Meta Demucs v4 + WhisperX + CosyVoice 2 (resident VRAM: 30 GB).
- **GPU 1 & GPU 2 (ATMAN Preview & Master Workers):** LatentSync + MuseTalk (resident VRAM: 28 GB per card).
- **GPU 3 (Facial Restoration & Optical Flow):** RestoreFormer++ + RAFT optical flow (resident VRAM: 18 GB).

---

## 8. Premium Apple-Style Studio QC Workbench (Frontend Architecture)

The Studio QC Workbench provides directors with an interface inspired by Apple's Human Interface Guidelines (macOS, Final Cut Pro, DaVinci Resolve).

```
+----------------------------------------------------------------------------------------------------+
|  [Apple-Style Top Bar]  Project: Dune: Part Two  Reel: 02  Target: Hindi (hi-IN)  [Export Master]  |
+----------------------------------------------------------------------------------------------------+
|  [VIEWPORT A: Original Master 4K]                  [VIEWPORT B: Localized Sync 4K (Live Heatmap)]   |
|  +------------------------------------------+      +------------------------------------------+    |
|  |                                          |      |                                          |    |
|  |                                          |      |                                          |    |
|  |           Original English 4K            |      |           Localized Hindi 4K             |    |
|  |                                          |      |                                          |    |
|  |                                          |      |                                          |    |
|  +------------------------------------------+      +------------------------------------------+    |
|  SMPTE: 00:14:22:18 | FPS: 24.000 | 100% Zoom      Sync Score: 9.24 / 10 | Status: QC In Review     |
+----------------------------------------------------------------------------------------------------+
|  MULTI-TRACK TIMELINE & VISEME SCRUBBER                                                            |
|  Video Track | [ Shot 141 ] [     Shot 142 (Active Speech)     ] [ Shot 143 ]                      |
|  Source (EN) |              | "We cannot cross the perimeter"   |                                  |
|  Target (HI) |              | "हम शाम से पहले सीमा पार..."      |                                  |
|  Viseme Flap |              | [B-CL] [O-VO] [L-DE] [CL] [OP]    |                                  |
|  M&E Bed     | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   |
+----------------------------------------------------------------------------------------------------+
|  TRANSCREATION INSPECTOR (Side Sheet)                                                              |
|  Syllable Count: 14 / 14 (Exact Match) | Lip-Flap Timing Delta: +0.02s                             |
|  [ Nudge Anchor -1 Frame ] [ Nudge Anchor +1 Frame ] [ Re-Render Preview ] [ Approve & Lock Shot ] |
+----------------------------------------------------------------------------------------------------+
```

### 8.1 Apple-Style Design Tokens & CSS Specification
- **Color Palette (Dark Theatrical Glassmorphism):**
  - Background Base: `#0D0E12` (Deep Charcoal Black).
  - Glass Card Background: `rgba(25, 27, 34, 0.65)` with `backdrop-filter: blur(24px) saturate(180%)`.
  - Borders: `1px solid rgba(255, 255, 255, 0.08)`.
  - Accents: Dynamic Apple Indigo (`#5E5CE6`), Studio Amber (`#FF9F0A` for warnings), Theatrical Green (`#30D158` for approved shots).
- **Typography:**
  - Font Family: `SF Pro Display`, `SF Pro Text`, `-apple-system`, `Inter`.
  - Timecode Display: Monospaced `SF Mono` / `JetBrains Mono` with tabular numbers.
- **Micro-Interactions:**
  - Smooth spring physics for scrubbing cursors (`stiffness: 400`, `damping: 30`).
  - Tactile audio waveforms rendered via HTML5 OffscreenCanvas with dynamic peak level gradient rendering.

---

## 9. Security, Licensing & Studio Compliance

### 9.1 Performer Rights & SAG-AFTRA 2023 Compliance
Under the 2023 SAG-AFTRA Agreement, synthetic voice and digital likeness manipulation requires explicit performer consent:
- **Pre-execution Gate:** The orchestrator checks the `performer_consent_tokens` table. If a valid, non-expired digital certificate signed by the actor's legal representative is absent, the task fails immediately before hitting GPU memory.
- **Tenant Isolation:** Biometric voice vectors (ECAPA2) and facial embeddings (ArcFace) are encrypted using AES-256-GCM with customer-managed keys (CMK) and are permanently purged upon project completion.

### 9.2 C2PA Cryptographic Provenance Injection
Every exported localized movie container includes an immutable C2PA manifest signed with the studio's X.509 private certificate:
```json
{
  "claim_generator": "Kavrai-AI-Studio/1.0",
  "title": "Dune: Part Two (Hindi Dubbed Master)",
  "assertions": [
    {
      "label": "c2pa.actions",
      "data": {
        "actions": [
          {
            "action": "c2pa.dubbed",
            "parameters": {
              "source_language": "en",
              "target_language": "hi-IN",
              "voice_synthesis_engine": "VAANI-v1",
              "lip_sync_engine": "ATMAN-v1"
            }
          }
        ]
      }
    },
    {
      "label": "c2pa.actor_consent",
      "data": {
        "consent_token_id": "8f9a2b1c-3d4e-4f5a-b6c7-d8e9f0a1b2c3",
        "verified": true
      }
    }
  ]
}
```

### 9.3 Open-Source Licensing Compliance Architecture
- **Commercially Pure Core:** Default pipelines only invoke Apache 2.0 / MIT / BSD licensed dependencies (**Demucs v4, WhisperX, LatentSync, MuseTalk, RestoreFormer++, GFPGAN, Mediapipe**).
- **Pluggable Research Adapters:** Restricted non-commercial models (**CodeFormer, FLAME**) are packaged as external, dynamically loaded plugin adapters enabled only when a studio provides a commercial license key or research waiver.

---

## 10. Deployment Topology & Infrastructure-as-Code

### 10.1 Local Development (`docker-compose.yml` Architecture)

```yaml
version: '3.9'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: kavrai_cinema
      POSTGRES_USER: kavrai_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio_admin
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://kavrai_admin:${DB_PASSWORD}@postgres:5432/kavrai_cinema
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000
    depends_on:
      - postgres
      - redis
      - minio

  studio-web:
    build:
      context: .
      dockerfile: apps/studio-web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
      NEXT_PUBLIC_WS_URL: ws://localhost:4000/v1/ws

  vaani-service:
    build:
      context: .
      dockerfile: services/vaani-service/Dockerfile
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000

  atman-service:
    build:
      context: .
      dockerfile: services/atman-service/Dockerfile
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000

volumes:
  pgdata:
  miniodata:
```

### 10.2 Production Kubernetes Cluster Architecture (AWS EKS / GCP GKE)

```mermaid
flowchart TB
    subgraph INGRESS["External Traffic & Studio Ingress"]
        CDN["Cloudflare / Fastly CDN (TLS 1.3 + DDoS)"]
        ALB["AWS Application Load Balancer"]
        ING_CTRL["Ingress-NGINX Controller"]
    end

    subgraph K8S_CLUSTER["Kubernetes Production Cluster (EKS)"]
        subgraph SYSTEM_PODS["System & Web Tier (m6i.2xlarge Node Group)"]
            WEB_PODS["apps/studio-web (Next.js 15) x 4"]
            GW_PODS["apps/api-gateway (Node.js 20) x 6"]
        end

        subgraph KEDA_SCALER["Autoscaling Management"]
            KEDA["KEDA Event Autoscaler"]
        end

        subgraph GPU_POOL["GPU Worker Tier (g6e.12xlarge - 4x NVIDIA L40S)"]
            VAANI_WORKERS["services/vaani-service Pods (Autoscaled 2..16)"]
            ATMAN_PREVIEW["services/atman-preview Pods (Autoscaled 4..32)"]
            ATMAN_MASTER["services/atman-master Pods (Autoscaled 2..16)"]
        end
    end

    subgraph MANAGED_SERVICES["Managed Studio Cloud Services"]
        RDS[("Amazon RDS PostgreSQL 16 Multi-AZ<br/>+ pgvector")]
        ELASTI_CACHE[("Amazon ElastiCache Redis 7.2 Cluster")]
        S3_STORAGE[("Amazon S3 NVMe Storage<br/>(Pre-signed URL Access)")]
    end

    CDN --> ALB
    ALB --> ING_CTRL
    ING_CTRL --> WEB_PODS
    ING_CTRL --> GW_PODS

    GW_PODS --> RDS
    GW_PODS --> ELASTI_CACHE
    GW_PODS --> S3_STORAGE

    KEDA -->|Monitor Redis Queues| GPU_POOL
    GPU_POOL <--> RDS
    GPU_POOL <--> ELASTI_CACHE
    GPU_POOL <--> S3_STORAGE
```

---

## 11. System Verification & Sign-Off

This document constitutes the canonical system design specification for the Cinema-Grade AI Film Localization platform. All downstream code generation, service scaffolding, database migrations, and model deployments must conform strictly to the schemas, interfaces, and architecture outlined in this document.
