"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("session");

  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  // Load session data
  useEffect(() => {
    if (!sessionToken) {
      router.push("/dashboard");
      return;
    }

    const loadSession = async () => {
      try {
        const response = await fetch(
          `/api/payment/session?sessionToken=${sessionToken}`
        );
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Invalid session");
          setTimeout(() => router.push("/dashboard"), 2000);
          return;
        }

        setSessionData(data.session);

        // Calculate time remaining
        const expiresAt = new Date(data.session.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.floor((expiresAt - now) / 1000);
        setTimeRemaining(remaining > 0 ? remaining : 0);
      } catch (err) {
        setError("Failed to load session");
        setTimeout(() => router.push("/dashboard"), 2000);
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [sessionToken, router]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      setError("Session expired");
      setTimeout(() => router.push("/dashboard"), 2000);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError("Session expired");
          setTimeout(() => router.push("/dashboard"), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, router]);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleConfirm = async () => {
    const pinValue = pin.join("");
    if (pinValue.length < 4) {
      setError("Please enter at least 4 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          pin: pinValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dashboard?payment=success&txId=${data.transaction?.id}`);
      } else {
        setError(data.error || "Payment failed");
        // Clear PIN on error
        setPin(["", "", "", "", "", ""]);
        document.getElementById("pin-0")?.focus();
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
      setPin(["", "", "", "", "", ""]);
      document.getElementById("pin-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Confirm Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your PIN to complete the transaction
          </p>
        </div>

        {/* Payment Details */}
        {sessionData && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Amount
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                ₹{(sessionData.amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                To
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sessionData.toUserIdentifier}
              </span>
            </div>
            {sessionData.description && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Description
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {sessionData.description}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Timer */}
        <div className="text-center mb-6">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Time remaining:{" "}
            <span className="font-mono font-bold text-red-600 dark:text-red-400">
              {formatTime(timeRemaining)}
            </span>
          </span>
        </div>

        {/* PIN Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-3 mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none transition-all"
                disabled={loading}
                autoFocus={index === 0}
              />
            ))}
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => {
                const emptyIndex = pin.findIndex((d) => d === "");
                if (emptyIndex !== -1) {
                  handlePinChange(emptyIndex, num.toString());
                }
              }}
              className="h-14 text-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => {
              let lastFilledIndex = -1;
              for (let i = pin.length - 1; i >= 0; i--) {
                if (pin[i] !== "") {
                  lastFilledIndex = i;
                  break;
                }
              }
              if (lastFilledIndex !== -1) {
                const newPin = [...pin];
                newPin[lastFilledIndex] = "";
                setPin(newPin);
                document.getElementById(`pin-${lastFilledIndex}`)?.focus();
              }
            }}
            className="h-14 text-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
            disabled={loading}
          >
            ←
          </button>
          <button
            onClick={() => {
              const emptyIndex = pin.findIndex((d) => d === "");
              if (emptyIndex !== -1) {
                handlePinChange(emptyIndex, "0");
              }
            }}
            className="h-14 text-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
            disabled={loading}
          >
            0
          </button>
          <button
            onClick={() => {
              setPin(["", "", "", "", "", ""]);
              document.getElementById("pin-0")?.focus();
            }}
            className="h-14 text-sm font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
            disabled={loading}
          >
            Clear
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={loading || pin.some((d) => d === "")}
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              "Confirm Payment"
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Security Note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-6">
          🔒 Your PIN is encrypted and secure. Never share it with anyone.
        </p>
      </div>
    </div>
  );
}

export default function PaymentConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentConfirmContent />
    </Suspense>
  );
}
