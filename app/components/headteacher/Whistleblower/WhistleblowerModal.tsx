"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, AlertTriangle, Clock, CheckCircle, XCircle, User, Mail, Calendar } from "lucide-react";

interface WhistleblowerReport {
  id: string;
  title: string;
  content: string;
  category: string | null;
  isAnonymous: boolean;
  reporterEmail: string | null;
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WhistleblowerModalProps {
  report: WhistleblowerReport;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, status: string, resolution?: string) => Promise<void>;
}

export default function WhistleblowerModal({
  report,
  isOpen,
  onClose,
  onUpdate,
}: WhistleblowerModalProps) {
  const [status, setStatus] = useState(report.status);
  const [resolution, setResolution] = useState(report.resolution || "");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "NEW":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "IN_REVIEW":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "RESOLVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "DISMISSED":
        return <XCircle className="h-5 w-5 text-zinc-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-zinc-400" />;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(report.id, status, resolution);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = status !== report.status || resolution !== (report.resolution || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            {getStatusIcon(report.status)}
            <h2 id="modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Szczegóły zgłoszenia
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {report.title}
            </h3>
            {report.category && (
              <span className="inline-block text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                {report.category}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Zgłoszono: {new Date(report.createdAt).toLocaleDateString("pl-PL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {report.isAnonymous ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="italic">Zgłoszenie anonimowe</span>
              </div>
            ) : report.reporterEmail ? (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{report.reporterEmail}</span>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Treść zgłoszenia
            </label>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {report.content}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Status zgłoszenia
              </label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Nowe</SelectItem>
                  <SelectItem value="IN_REVIEW">W trakcie rozpatrywania</SelectItem>
                  <SelectItem value="RESOLVED">Rozwiązane</SelectItem>
                  <SelectItem value="DISMISSED">Odrzucone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Rozwiązanie / Notatki
            </label>
            <Textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Opisz podjęte działania lub powód odrzucenia..."
              rows={4}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </div>
      </div>
    </div>
  );
}

