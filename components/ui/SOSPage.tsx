"use client"

import { useEffect, useState } from "react"
import {
  X,
  MapPin,
  Users,
  Phone,
  FileText,
  ShieldAlert,
  HeartPulse,
  Droplets,
  Utensils,
  Home,
} from "lucide-react"

import {
  Panel,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/shared"

const API_URL = "/api/backend"

type SOSRequest = {
  id: string | number
  created_at: string
  status: string
  original_message: string
  extracted_data: ExtractedData | string
}

type ExtractedData = {
  source_type?: string

  location?: {
    text?: string | null
    latitude?: number | null
    longitude?: number | null
    geocoded?: boolean | null
    geocoded_address?: string | null
    coordinate_source?: string | null
  }

  people?: {
    total?: string | number | null
    children?: string | number | null
    elderly?: string | number | null
    pregnant?: string | number | null
    injured?: string | number | null
    missing?: string | number | null
    deceased?: string | number | null
    mobility_impaired?: string | number | null
  }

  situation?: string | null

  request?: {
    type?: string | null
    resources?: string[] | null
  }

  needs?: {
    food?: boolean | null
    water?: boolean | null
    medicine?: boolean | null
    shelter?: boolean | null
    rescue?: boolean | null
    medical_transfer?: boolean | null
  }

  contact_info?: string[] | null

  original_message?: string

  priority?: {
    priority?: string | null
    priority_score?: number | null

    score_breakdown?: {
      people_score?: number | null
      vulnerability_score?: number | null
      needs_score?: number | null
      request_score?: number | null
      flood_score?: number | null
      location_score?: number | null
    } | null

    inputs?: {
      sos_people?: number | null
      feature2_people?: number | null
      effective_people?: number | null
      flood_severity?: number | null
    } | null

    recommended_actions?: string[] | null

    incident_id?: string | null
    people?: number | null
    latitude?: number | null
    longitude?: number | null
    status?: string | null
  } | null
}

function parseExtractedData(
  data: ExtractedData | string
): ExtractedData {
  if (typeof data === "string") {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }

  return data || {}
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatLabel(value?: string | null) {
  if (!value) return ""

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getPriority(data: ExtractedData) {
  const people = data.people

  if (
    people?.deceased &&
    String(people.deceased) !== "0"
  ) {
    return "CRITICAL"
  }

  if (
    people?.injured &&
    String(people.injured) !== "0"
  ) {
    return "CRITICAL"
  }

  if (
    people?.missing &&
    String(people.missing) !== "0"
  ) {
    return "CRITICAL"
  }

  if (data.needs?.rescue) {
    return "HIGH"
  }

  if (data.needs?.medical_transfer) {
    return "HIGH"
  }

  return "MEDIUM"
}

const priorityTone: Record<
  string,
  "critical" | "high" | "medium" | "good" | "neutral"
> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "neutral",
}

export default function SOSPage() {
  const [requests, setRequests] =
    useState<SOSRequest[]>([])

  const [selectedRequest, setSelectedRequest] =
    useState<SOSRequest | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  async function loadRequests() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/sos`,
        {
          cache: "no-store",
        }
      )

      if (!response.ok) {
        throw new Error(
          "Unable to load SOS requests."
        )
      }

      const data = await response.json()

      setRequests(data.requests || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load SOS requests."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <SectionHeader
          eyebrow="Incoming alerts"
          title="Emergency request queue"
          icon="Siren"
          action={
            <button
              onClick={loadRequests}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-[#2563eb]"
            >
              Refresh
            </button>
          }
        />

        {loading && (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading SOS requests...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          requests.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No SOS requests received yet.
            </div>
          )}

        {!loading &&
          !error &&
          requests.length > 0 && (
            <div className="overflow-x-auto">
              {/* TABLE HEADER */}

              <div className="grid min-w-[820px] grid-cols-[1.1fr_1.4fr_.6fr_.8fr_1.4fr] gap-4 border-b border-slate-200 px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Priority / ID</span>
                <span>Location</span>
                <span>People</span>
                <span>Time</span>
                <span>Status / action</span>
              </div>

              {/* REQUESTS */}

              <div className="min-w-[820px] divide-y divide-slate-200">
                {requests.map((request) => {
                  const extracted =
                    parseExtractedData(
                      request.extracted_data
                    )

                  const priority =
                    getPriority(extracted)

                  const location =
                    extracted.location?.text ||
                    "Location unavailable"

                  const people =
                    extracted.people?.total ||
                    "—"

                  const resources =
                    extracted.request?.resources || []

                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() =>
                        setSelectedRequest(request)
                      }
                      className={`grid w-full grid-cols-[1.1fr_1.4fr_.6fr_.8fr_1.4fr] items-center gap-4 px-4 py-4 text-left transition hover:bg-blue-50 ${
                        priority === "CRITICAL"
                          ? "bg-red-50"
                          : "bg-white"
                      }`}
                    >
                      {/* PRIORITY / ID */}

                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            priority === "CRITICAL"
                              ? "bg-[#d92d20]"
                              : priority === "HIGH"
                                ? "bg-[#e58a00]"
                                : "bg-[#2563eb]"
                          }`}
                        />

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#102A43]">
                            SOS-{request.id}
                          </span>

                          <StatusBadge
                            label={priority}
                            tone={
                              priorityTone[priority] ??
                              "neutral"
                            }
                          />
                        </div>
                      </div>

                      {/* LOCATION */}

                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <MapPin size={15} />

                        <span className="truncate">
                          {location}
                        </span>
                      </div>

                      {/* PEOPLE */}

                      <span className="text-sm font-semibold text-[#0f2742]">
                        {people}
                      </span>

                      {/* TIME */}

                      <span className="text-xs text-slate-500">
                        {formatDate(
                          request.created_at
                        )}
                      </span>

                      {/* STATUS */}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <StatusBadge
                          label={request.status}
                          tone={
                            request.status === "Pending"
                              ? "warning"
                              : request.status ===
                                  "Rescue Assigned"
                                ? "medium"
                                : "good"
                          }
                        />

                        <span className="hidden xl:inline">
                          {resources
                            .slice(0, 4)
                            .map(formatLabel)
                            .join(" · ")}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
      </Panel>

      {/* ============================================================
          FULL SOS DETAILS MODAL
      ============================================================ */}

      {selectedRequest && (
        <SOSDetailsModal
          request={selectedRequest}
          onClose={() =>
            setSelectedRequest(null)
          }
        />
      )}
    </div>
  )
}

/* ================================================================
   SOS DETAILS MODAL
================================================================ */

function SOSDetailsModal({
  request,
  onClose,
}: {
  request: SOSRequest
  onClose: () => void
}) {
  const data =
    parseExtractedData(
      request.extracted_data
    )

  const people =
    data.people

  const needs =
    data.needs

  const resources =
    data.request?.resources || []

  const contacts =
    data.contact_info || []

  const location =
    data.location

  const originalMessage =
    request.original_message ||
    data.original_message ||
    ""

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2742]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[#0f2742]">
                SOS-{request.id}
              </h2>

              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-orange-600">
                {request.status}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {formatDate(request.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-7 p-6">

          {/* ======================================================
              LOCATION
          ====================================================== */}

          {location && (
            <ModalSection
              title="Location"
              icon={<MapPin size={16} />}
            >
              <div>
                <DetailRow
                  label="Location"
                  value={location.text}
                />

                <DetailRow
                  label="Latitude"
                  value={location.latitude}
                />

                <DetailRow
                  label="Longitude"
                  value={location.longitude}
                />

                <DetailRow
                  label="Geocoded"
                  value={
                    location.geocoded != null
                      ? location.geocoded
                        ? "Yes"
                        : "No"
                      : null
                  }
                />

                <DetailRow
                  label="Geocoded address"
                  value={location.geocoded_address}
                />

                <DetailRow
                  label="Coordinate source"
                  value={formatLabel(
                    location.coordinate_source
                  )}
                />
              </div>
            </ModalSection>
          )}

          {/* ======================================================
              PEOPLE
          ====================================================== */}

          {people && (
            <ModalSection
              title="People"
              icon={<Users size={16} />}
            >
              <div>
                <DetailRow
                  label="Total"
                  value={people.total}
                />

                <DetailRow
                  label="Children"
                  value={people.children}
                />

                <DetailRow
                  label="Elderly"
                  value={people.elderly}
                />

                <DetailRow
                  label="Pregnant"
                  value={people.pregnant}
                />

                <DetailRow
                  label="Injured"
                  value={people.injured}
                />

                <DetailRow
                  label="Missing"
                  value={people.missing}
                />

                <DetailRow
                  label="Deceased"
                  value={people.deceased}
                />

                <DetailRow
                  label="Mobility impaired"
                  value={
                    people.mobility_impaired
                  }
                />
              </div>
            </ModalSection>
          )}

          {/* ======================================================
              REQUEST
          ====================================================== */}

          {(data.source_type ||
            data.request?.type ||
            resources.length > 0) && (
            <ModalSection
              title="Request"
              icon={<ShieldAlert size={16} />}
            >
              <div>
                <DetailRow
                  label="SOS type"
                  value={formatLabel(
                    data.source_type
                  )}
                />

                <DetailRow
                  label="Primary request"
                  value={formatLabel(
                    data.request?.type
                  )}
                />
              </div>

              {resources.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Requested resources
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {resources.map(
                      (resource, index) => (
                        <span
                          key={`${resource}-${index}`}
                          className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                        >
                          {formatLabel(resource)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </ModalSection>
          )}

          {/* ======================================================
              ASSISTANCE NEEDED
          ====================================================== */}

          {needs &&
            (
              needs.rescue ||
              needs.medicine ||
              needs.water ||
              needs.food ||
              needs.shelter ||
              needs.medical_transfer
            ) && (
              <ModalSection
                title="Assistance needed"
                icon={<HeartPulse size={16} />}
              >
                <div className="flex flex-wrap gap-2">
                  {needs.rescue && (
                    <NeedBadge
                      icon={
                        <ShieldAlert size={14} />
                      }
                      label="Rescue"
                    />
                  )}

                  {needs.medicine && (
                    <NeedBadge
                      icon={
                        <HeartPulse size={14} />
                      }
                      label="Medicine"
                    />
                  )}

                  {needs.water && (
                    <NeedBadge
                      icon={
                        <Droplets size={14} />
                      }
                      label="Water"
                    />
                  )}

                  {needs.food && (
                    <NeedBadge
                      icon={
                        <Utensils size={14} />
                      }
                      label="Food"
                    />
                  )}

                  {needs.shelter && (
                    <NeedBadge
                      icon={
                        <Home size={14} />
                      }
                      label="Shelter"
                    />
                  )}

                  {needs.medical_transfer && (
                    <NeedBadge
                      icon={
                        <HeartPulse size={14} />
                      }
                      label="Medical transfer"
                    />
                  )}
                </div>
              </ModalSection>
            )}

          {/* ======================================================
              PRIORITY
          ====================================================== */}

          {data.priority && (
            <ModalSection
              title="Priority assessment"
              icon={<ShieldAlert size={16} />}
            >
              <div>
                <DetailRow
                  label="Priority"
                  value={
                    data.priority.priority
                  }
                />

                <DetailRow
                  label="Priority score"
                  value={
                    data.priority.priority_score
                  }
                />

                <DetailRow
                  label="Incident ID"
                  value={
                    data.priority.incident_id
                  }
                />

                <DetailRow
                  label="Status"
                  value={
                    data.priority.status
                  }
                />

                <DetailRow
                  label="People"
                  value={
                    data.priority.people
                  }
                />

                <DetailRow
                  label="Latitude"
                  value={
                    data.priority.latitude
                  }
                />

                <DetailRow
                  label="Longitude"
                  value={
                    data.priority.longitude
                  }
                />

                <DetailRow
                  label="People score"
                  value={
                    data.priority
                      .score_breakdown
                      ?.people_score
                  }
                />

                <DetailRow
                  label="Vulnerability score"
                  value={
                    data.priority
                      .score_breakdown
                      ?.vulnerability_score
                  }
                />

                <DetailRow
                  label="Needs score"
                  value={
                    data.priority
                      .score_breakdown
                      ?.needs_score
                  }
                />

                <DetailRow
                  label="Request score"
                  value={
                    data.priority
                      .score_breakdown
                      ?.request_score
                  }
                />

                <DetailRow
                  label="Flood score"
                  value={
                    data.priority
                      .score_breakdown
                      ?.flood_score
                  }
                />

                <DetailRow
                  label="Location score"
                  value={
                    data.priority
                      .score_breakdown
                      ?.location_score
                  }
                />

                <DetailRow
                  label="SOS people"
                  value={
                    data.priority.inputs
                      ?.sos_people
                  }
                />

                <DetailRow
                  label="Feature 2 people"
                  value={
                    data.priority.inputs
                      ?.feature2_people
                  }
                />

                <DetailRow
                  label="Effective people"
                  value={
                    data.priority.inputs
                      ?.effective_people
                  }
                />

                <DetailRow
                  label="Flood severity"
                  value={
                    data.priority.inputs
                      ?.flood_severity
                  }
                />
              </div>

              {data.priority
                .recommended_actions &&
                data.priority
                  .recommended_actions.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Recommended actions
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {data.priority
                        .recommended_actions
                        .map(
                          (
                            action,
                            index
                          ) => (
                            <span
                              key={`${action}-${index}`}
                              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                            >
                              {formatLabel(
                                action
                              )}
                            </span>
                          )
                        )}
                    </div>
                  </div>
                )}
            </ModalSection>
          )}

          {/* ======================================================
              SITUATION
          ====================================================== */}

          {data.situation && (
            <ModalSection
              title="Situation"
              icon={<FileText size={16} />}
            >
              <p className="text-sm leading-6 text-slate-600">
                {data.situation}
              </p>
            </ModalSection>
          )}

          {/* ======================================================
              CONTACT
          ====================================================== */}

          {contacts.length > 0 && (
            <ModalSection
              title="Contact"
              icon={<Phone size={16} />}
            >
              <div>
                {contacts.map(
                  (contact, index) => (
                    <DetailRow
                      key={`${contact}-${index}`}
                      label={
                        contacts.length > 1
                          ? `Contact ${index + 1}`
                          : "Contact"
                      }
                      value={contact}
                    />
                  )
                )}
              </div>
            </ModalSection>
          )}

          {/* ======================================================
              ORIGINAL MESSAGE
          ====================================================== */}

          {originalMessage && (
            <ModalSection
              title="Original SOS message"
              icon={<FileText size={16} />}
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                  {originalMessage}
                </p>
              </div>
            </ModalSection>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MODAL SECTION
================================================================ */

function ModalSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="text-slate-400">
          {icon}
        </div>

        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </h3>
      </div>

      {children}
    </section>
  )
}

/* ================================================================
   DETAIL ROW
================================================================ */

function DetailRow({
  label,
  value,
}: {
  label: string
  value?: string | number | boolean | null
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-3 last:border-b-0">
      <span className="shrink-0 text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[68%] whitespace-pre-wrap break-words text-right text-sm font-semibold text-[#0f2742]">
        {String(value)}
      </span>
    </div>
  )
}

/* ================================================================
   NEED BADGE
================================================================ */

function NeedBadge({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
      {icon}
      {label}
    </span>
  )
}