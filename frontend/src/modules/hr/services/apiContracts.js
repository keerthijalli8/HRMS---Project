/**
 * Backend API Contract Specification
 * Target: Python FastAPI + PostgreSQL
 * HRMS India — Face Recognition Automatic Attendance System
 */

export const FASTAPI_BACKEND_CONTRACT = {
  baseUrl: "/api/v1",
  endpoints: [
    {
      path: "/biometrics/register-face",
      method: "POST",
      summary: "Enrolls employee facial biometric embedding with DPDP Act 2023 consent",
      headers: { Authorization: "Bearer <jwt-token>" },
      requestBody: {
        employee_id: "EMP-1088",
        dpdp_consent: true,
        consent_version: "2023.1",
        embedding_vector: "[128 float values normalized to unit sphere]",
        quality_score: 96.5,
        single_face_verified: true,
        landmarks_count: 68
      },
      responses: {
        201: {
          template_id: "BIO-TPL-1088-20261110",
          status: "ENROLLED",
          enrolled_at: "2026-11-10T10:00:00Z"
        },
        400: { detail: "Biometric consent not granted or multiple faces detected" },
        409: { detail: "Face already enrolled. Requires HR authorization for re-enrollment" }
      }
    },
    {
      path: "/biometrics/verify-liveness",
      method: "POST",
      summary: "Evaluates presentation attack detection (PAD) across video frame sequences",
      requestBody: {
        employee_id: "EMP-1088",
        blink_count: 2,
        micro_movement_variance: 0.145,
        optical_depth_score: 0.92,
        challenge_response_token: "PAD-CHALLENGE-X"
      },
      responses: {
        200: {
          liveness_verified: true,
          liveness_score: 0.965,
          anti_spoofing_flag: "GENUINE_HUMAN",
          timestamp: "2026-11-10T10:01:00Z"
        },
        422: {
          liveness_verified: false,
          liveness_score: 0.42,
          anti_spoofing_flag: "PRESENTATION_ATTACK_SUSPECTED",
          detail: "Static photo or video replay detected. Face Not Recognized."
        }
      }
    },
    {
      path: "/biometrics/verify-face",
      method: "POST",
      summary: "Verifies live probe embedding against encrypted PostgreSQL biometric template",
      requestBody: {
        employee_id: "EMP-1088",
        probe_vector: "[128 float values]",
        liveness_token: "LIV-TOK-9842"
      },
      responses: {
        200: {
          verified: true,
          cosine_similarity: 0.968,
          match_confidence_pct: 96.8,
          threshold: 0.85,
          verification_token: "BIO-VTOK-1088-PASS"
        },
        401: {
          verified: false,
          cosine_similarity: 0.72,
          detail: "Face Not Recognized"
        }
      }
    },
    {
      path: "/attendance/scan",
      method: "POST",
      summary: "Intelligent automatic Face Attendance: Check-In if unpunched; Check-Out if active; Block if already checked out",
      headers: { Authorization: "Bearer <jwt-token>" },
      requestBody: {
        employee_id: "EMP-1088",
        probe_vector: "[128 float values]",
        liveness_score: 0.965
      },
      responses: {
        200: {
          action: "check-in",
          message: "Check-in Successful",
          recorded_time: "09:12 AM",
          status: "Present",
          verification_method: "Face Recognition (Biometric 128-D + Liveness)"
        },
        201: {
          action: "check-out",
          message: "Check-out Successful",
          recorded_time: "06:34 PM",
          total_working_hours: "8h 42m",
          status: "Checked Out",
          verification_method: "Face Recognition (Biometric 128-D + Liveness)"
        },
        409: {
          detail: "Attendance already completed for today. Cannot mark attendance again after check-out without HR authorization."
        },
        422: {
          detail: "Face Not Recognized. Biometric match confidence below 85% or liveness failed."
        }
      }
    },
    {
      path: "/attendance/exemptions",
      method: "POST",
      summary: "Submits non-biometric attendance exemption request under DPDP Act 2023",
      requestBody: {
        employee_id: "EMP-1088",
        reason: "Hardware defect / Privacy opt-out",
        preferred_method: "Supervisor PIN Override"
      },
      responses: {
        201: {
          exemption_id: "EXM-179432",
          status: "Pending"
        }
      }
    }
  ]
};
