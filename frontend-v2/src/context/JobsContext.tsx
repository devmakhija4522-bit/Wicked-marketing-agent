import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import * as api from "@/lib/api";
import type { TrackedJob } from "@/lib/types";

interface JobsContextValue {
  jobs: TrackedJob[];
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
  /** Register a job_id returned by a POST .../research|generate|linkedin-draft|... call and start polling it. */
  startJob: (jobId: string, label: string) => void;
}

const JobsContext = createContext<JobsContextValue | null>(null);
const POLL_MS = 2500;

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearInterval);
    };
  }, []);

  const startJob = useCallback((jobId: string, label: string) => {
    setJobs((prev) => [
      { job_id: jobId, label, status: "pending", created_at: new Date().toISOString() },
      ...prev,
    ]);

    const poll = async () => {
      try {
        const status = await api.getJobStatus(jobId);
        setJobs((prev) => prev.map((j) => (j.job_id === jobId ? { ...j, ...status } : j)));
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(timersRef.current[jobId]);
          delete timersRef.current[jobId];
        }
      } catch {
        // transient network hiccup — keep polling, next tick may succeed
      }
    };

    poll();
    timersRef.current[jobId] = setInterval(poll, POLL_MS);
  }, []);

  return (
    <JobsContext.Provider
      value={{
        jobs,
        isOpen,
        toggle: () => setIsOpen((v) => !v),
        close: () => setIsOpen(false),
        open: () => setIsOpen(true),
        startJob,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within a JobsProvider");
  return ctx;
}
