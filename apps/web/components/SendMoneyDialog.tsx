"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

interface SendMoneyDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface SendMoneyFormData {
  toUserIdentifier: string;
  amount: string;
  description: string;
}

export function SendMoneyDialog({ onClose, onSuccess }: SendMoneyDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SendMoneyFormData>();

  const onSubmit = async (data: SendMoneyFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Convert amount from rupees to paise
      const amountInPaise = Math.round(parseFloat(data.amount) * 100);

      // Create payment session
      const response = await fetch("/api/payment/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentType: "SEND_MONEY",
          amount: amountInPaise,
          toUserIdentifier: data.toUserIdentifier,
          description: data.description,
          metadata: {},
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create payment session");
      }

      // Redirect to PIN confirmation page
      router.push(`/payment/confirm?session=${result.session.sessionToken}`);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl">
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1451CB] dark:text-white">
                Send Money
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Transfer money to another user securely
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              disabled={isLoading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recipient Email or Username
              </label>
              <input
                type="text"
                {...register("toUserIdentifier", {
                  required: "Recipient is required",
                })}
                placeholder="user@example.com or username"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1451CB] focus:border-transparent transition-all"
                disabled={isLoading || success}
              />
              {errors.toUserIdentifier && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.toUserIdentifier.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("amount", {
                  required: "Amount is required",
                  min: { value: 1, message: "Minimum amount is ₹1" },
                  validate: (value) => {
                    const num = parseFloat(value);
                    return (
                      (!isNaN(num) && num > 0) || "Please enter a valid amount"
                    );
                  },
                })}
                placeholder="Enter amount"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1451CB] focus:border-transparent transition-all"
                disabled={isLoading || success}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register("description")}
                placeholder="What's this payment for?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1451CB] focus:border-transparent transition-all resize-none"
                disabled={isLoading || success}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <p className="text-green-600 dark:text-green-400 text-sm">
                  ✓ Money sent successfully!
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
                disabled={isLoading || success}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1451CB] to-[#1434CB] text-white hover:shadow-lg hover:shadow-[#1451CB]/30 font-semibold transition-all disabled:opacity-50"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Money"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
