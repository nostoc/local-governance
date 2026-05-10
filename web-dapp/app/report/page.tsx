"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { AlertCircle, CheckCircle2, FileImage, Send, UploadCloud, X } from "lucide-react";
import { useCitizen } from "@/context/CitizenContext";

const MAX_IMAGES = 5;
const MAX_DESC_LENGTH = 1000;

// Utility to convert File to WebP
const compressToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Optional: Resize large images here by scaling width/height
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const newFile = new File([blob], fileName, { type: "image/webp" });
              resolve(newFile);
            } else {
              reject(new Error("WebP conversion failed"));
            }
          },
          "image/webp",
          0.8 // 80% quality compression
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Utility to hash file contents
const hashFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  return ethers.keccak256(uint8Array);
};

export default function ReportPage() {
  const router = useRouter();
  const { wallet, consumeTicket, availableTicketsCount } = useCitizen();

  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);
    
    if (images.length + newFiles.length > MAX_IMAGES) {
      setStatusMessage({ type: "error", text: `You can only upload a maximum of ${MAX_IMAGES} images.` });
      return;
    }

    setIsProcessingImages(true);
    setStatusMessage(null);

    try {
      const convertedFiles = await Promise.all(newFiles.map(compressToWebP));
      setImages((prev) => [...prev, ...convertedFiles]);
    } catch (error) {
      console.error("Image processing error:", error);
      setStatusMessage({ type: "error", text: "Failed to process images. Please try different files." });
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!wallet) {
      setStatusMessage({ type: "error", text: "You must be logged in to submit a report." });
      return;
    }

    if (!description.trim() || description.length > MAX_DESC_LENGTH) {
      setStatusMessage({ type: "error", text: "Please provide a valid description within the character limit." });
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

      // Step 1: Hash all WebP images
      const imageHashes = await Promise.all(images.map(hashFile));
      const combinedImageHashes = imageHashes.join(""); // Combine array into a single string for signing

      // Step 2: Sign Text + Ticket ID + Image Hashes
      const ethersWallet = new ethers.Wallet(wallet.privateKey);
      const messageHash = ethers.solidityPackedKeccak256(
        ["string", "string", "string"],
        [description, currentTicket.ticketId, combinedImageHashes]
      );
      const signature = await ethersWallet.signMessage(ethers.getBytes(messageHash));

      // Step 3: Prepare FormData
      const formData = new FormData();
      formData.append("description", description);
      formData.append("zkpTicketId", currentTicket.ticketId);
      formData.append("zkpSignature", currentTicket.signature);
      formData.append("citizenPubKey", wallet.publicKey);
      formData.append("signature", signature);
      // Pass the hashes to the backend so it can verify the files match the signature
      formData.append("imageHashes", JSON.stringify(imageHashes));

      images.forEach((img) => {
        formData.append("images", img); // Backend must look for an array field named "images"
      });

      // Fetch relayer URL from .env (fallback to relative if not set)
      const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || "";
      const endpoint = `${RELAYER_URL}/report`; // Or whatever your relayer route is

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to submit report to relayer.");
      }

      setStatusMessage({
        type: "success",
        text: `Report submitted successfully! You have ${availableTicketsCount - 1} anonymous submissions remaining.`,
      });

      // Reset form
      setDescription("");
      setImages([]);
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
          Your report will be analyzed by AI for moderation before being permanently recorded on the blockchain. Your identity remains 100% anonymous.
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
              {statusMessage.type === "error" && statusMessage.text.includes("log in again") && (
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
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-slate-700">Issue Description</label>
              <span className={`text-xs ${description.length >= MAX_DESC_LENGTH ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {description.length} / {MAX_DESC_LENGTH}
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={MAX_DESC_LENGTH}
              placeholder="Describe the problem (e.g., Pothole on Main St, Broken streetlight...)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-slate-700">Attach Photos (Optional)</label>
              <span className="text-xs text-slate-400">{images.length} / {MAX_IMAGES} uploaded</span>
            </div>
            
            <div
              className={`border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${
                images.length >= MAX_IMAGES || isSubmitting ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'bg-slate-50 hover:bg-slate-100 cursor-pointer'
              }`}
              onClick={() => {
                if (images.length < MAX_IMAGES && !isSubmitting && !isProcessingImages) fileInputRef.current?.click();
              }}
            >
              <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 font-medium">
                {isProcessingImages ? "Processing & Compressing..." : "Click to upload images"}
              </p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WEBP (Converted to optimized WebP)</p>
              
              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting || images.length >= MAX_IMAGES || isProcessingImages}
              />
            </div>

            {/* Render Uploaded Image Badges */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 py-1.5 pl-3 pr-2 rounded-lg border border-blue-100">
                    <FileImage className="h-4 w-4" />
                    <span className="font-medium truncate max-w-[120px] text-xs">{img.name}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                      className="text-blue-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isProcessingImages || !wallet}
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