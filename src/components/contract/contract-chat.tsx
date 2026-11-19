import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { MessageType } from "@/lib/types";

const ROLE_TONE: Record<MessageType, "blue" | "green" | "navy" | "purple" | "amber" | "neutral"> = {
  buyer: "blue",
  seller: "green",
  admin: "navy",
  mediator: "purple",
  compliance: "amber",
  system: "neutral",
};

const ROLE_BORDER: Record<MessageType, string> = {
  buyer: "border-l-blue-400",
  seller: "border-l-emerald-400",
  admin: "border-l-navy",
  mediator: "border-l-purple-400",
  compliance: "border-l-amber-400",
  system: "border-l-gray-300",
};

const ROLE_BG: Record<MessageType, string> = {
  buyer: "bg-blue-50/40",
  seller: "bg-emerald-50/40",
  admin: "bg-gold-tint",
  mediator: "bg-purple-50/40",
  compliance: "bg-amber-50/40",
  system: "bg-gray-50",
};

export interface ChatMessage {
  id: string;
  sender_id: string | null;
  message_type: MessageType;
  body: string;
  is_official: boolean;
  created_at: string;
}

export function ContractChat({
  messages,
  onSend,
  names,
}: {
  messages: ChatMessage[];
  onSend: ((formData: FormData) => Promise<void>) | null;
  names: Record<string, string>;
}) {
  return (
    <div className="flex h-[min(480px,70vh)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-border-soft bg-gray-50/50 px-6 text-center">
            <p className="text-sm font-medium text-gray-600">No messages yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Coordinate deposits, delivery, and release here.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border-l-4 ${ROLE_BORDER[m.message_type]} ${ROLE_BG[m.message_type]} px-4 py-3`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {names[m.sender_id ?? ""] ?? m.message_type}
              </span>
              <Badge tone={ROLE_TONE[m.message_type]}>{m.message_type}</Badge>
              {m.is_official && <Badge tone="navy">Official</Badge>}
              <span className="ml-auto text-xs text-gray-400">{formatDate(m.created_at)}</span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{m.body}</p>
          </div>
        ))}
      </div>
      {onSend && (
        <form
          action={onSend}
          className="flex items-end gap-2 border-t border-border-soft bg-gray-50/40 p-4"
        >
          <Textarea
            name="body"
            rows={2}
            placeholder="Write a message…"
            required
            className="flex-1 bg-white"
          />
          <Button type="submit" size="sm">
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
