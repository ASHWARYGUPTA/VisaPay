"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PinSetupPromptProps {
  onDismiss?: () => void;
}

export function PinSetupPrompt({ onDismiss }: PinSetupPromptProps) {
  const router = useRouter();
  const [show, setShow] = useState(true);

  const handleSetupPin = () => {
    router.push("/payment/setup-pin");
  };

  const handleDismiss = () => {
    setShow(false);
    if (onDismiss) onDismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Setup Payment PIN
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Before you can send money, you need to set up a secure 4-6 digit PIN
            to protect your transactions.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Secure Transactions
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Your PIN is encrypted and never stored in plain text
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Quick Payments
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Enter your PIN to confirm payments instantly
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Easy to Remember
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Choose a 4-6 digit PIN that's memorable for you
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSetupPin}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Setup PIN Now
          </button>
          <button
            onClick={handleDismiss}
            className="w-full h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            I'll do it later
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4">
          💡 You can setup your PIN anytime from Settings
        </p>
      </div>
    </div>
  );
}
