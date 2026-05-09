"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { AlertCircle, CheckCircle2, FileImage, Send, UploadCloud } from "lucide-react";
import { useCitizen } from "@/context/CitizenContext";

export default function ReportPage() {
  const router = useRouter();
  const { wallet, consumeTicket, availableTicketsCount } = useCitizen();

  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!wallet) {
      setStatusMessage({ type: "error", text: "You must be logged in to submit a report." });
      return;
    }

    if (!description.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a description of the issue." });
      return;
    }

    setIsSubmitting(true);

    try {
      const currentTicket = consumeTicket();
      if (!currentTicket) {
        setStatusMessage({
          type: "error",
          text: "Security session expired (no tickets left). Please log in again.",
        });
        return;
      }

      const ethersWallet = new ethers.Wallet(wallet.privateKey);
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string"],
        [description, currentTicket.ticketId]
      );
      const signature = await ethersWallet.signMessage(ethers.getBytes(messageHash));

      const formData = new FormData();
      formData.append("description", description);
      if (image) {
        formData.append("image", image);
      }
      formData.append("zkpTicketId", currentTicket.ticketId);
      formData.append("zkpSignature", currentTicket.signature);
      formData.append("citizenPubKey", wallet.publicKey);
      formData.append("signature", signature);

      const response = await fetch("/api/backend-relayer/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report to relayer.");
      }

      setStatusMessage({
        type: "success",
        text: `Report submitted successfully! You have ${availableTicketsCount - 1} anonymous submissions remaining.`,
      });

      setDescription("");
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Report an Issue</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Your report will be analyzed by AI for moderation before being permanently recorded on the blockchain. Your
          identity remains 100% anonymous.
        </p>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium ${
              statusMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            }`}
          >
            {statusMessage.type === "error" ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            )}
            <div className="space-y-2">
              <p>{statusMessage.text}</p>
              {statusMessage.type === "error" &&
                statusMessage.text.includes("log in again") && (
                  <button
                    type="button"
                    onClick={() => router.push("/auth")}
                    className="text-xs font-semibold text-red-700 underline"
                  >
                    Go to login
                  </button>
                )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Description</label>
            <textarea
              rows={4}
              placeholder="Describe the problem (e.g., Pothole on Main St, Broken streetlight...)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Attach Photo (Optional)</label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 font-medium">Click to upload image</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WEBP</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </div>
            {image && (
              <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 py-2 px-3 rounded-lg w-max">
                <FileImage className="h-4 w-4" />
                <span className="font-medium truncate max-w-[200px]">{image.name}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !wallet}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Submit Securely</span>
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs font-medium text-slate-400">
              Available Anonymous Tickets: <span className="text-slate-700">{availableTicketsCount}</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
