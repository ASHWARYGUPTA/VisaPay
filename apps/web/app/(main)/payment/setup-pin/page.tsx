"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

function SetupPinContent() {
  const router = useRouter();
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const currentPin = isConfirm ? confirmPin : pin;
    const setCurrentPin = isConfirm ? setConfirmPin : setPin;

    const newPin = [...currentPin];
    newPin[index] = value;
    setCurrentPin(newPin);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(
        `${isConfirm ? "confirm-" : ""}pin-${index + 1}`
      );
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    isConfirm = false
  ) => {
    const currentPin = isConfirm ? confirmPin : pin;
    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      const prevInput = document.getElementById(
        `${isConfirm ? "confirm-" : ""}pin-${index - 1}`
      );
      prevInput?.focus();
    }
  };

  const handleNext = () => {
    const pinValue = pin.join("");
    if (pinValue.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    setStep("confirm");
    setError("");
  };

  const handleBack = () => {
    setStep("enter");
    setConfirmPin(["", "", "", "", "", ""]);
    setError("");
  };

  const handleSubmit = async () => {
    const pinValue = pin.join("");
    const confirmPinValue = confirmPin.join("");

    if (confirmPinValue.length < 4) {
      setError("Please enter at least 4 digits");
      return;
    }

    if (pinValue !== confirmPinValue) {
      setError("PINs do not match. Please try again.");
      setConfirmPin(["", "", "", "", "", ""]);
      document.getElementById("confirm-pin-0")?.focus();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard?pin=setup-success");
      } else {
        setError(data.error || "Failed to set PIN");
      }
    } catch (err) {
      setError("Failed to set PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderPinInputs = (isConfirm = false) => {
    const currentPin = isConfirm ? confirmPin : pin;
    return (
      <div className="flex justify-center gap-3 mb-4">
        {currentPin.map((digit, index) => (
          <input
            key={index}
            id={`${isConfirm ? "confirm-" : ""}pin-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handlePinChange(index, e.target.value, isConfirm)}
            onKeyDown={(e) => handleKeyDown(index, e, isConfirm)}
            className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none transition-all"
            disabled={loading}
            autoFocus={
              index === 0 &&
              ((isConfirm && step === "confirm") ||
                (!isConfirm && step === "enter"))
            }
          />
        ))}
      </div>
    );
  };

  const renderNumericKeypad = (isConfirm = false) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const setCurrentPin = isConfirm ? setConfirmPin : setPin;

    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => {
              const emptyIndex = currentPin.findIndex((d) => d === "");
              if (emptyIndex !== -1) {
                handlePinChange(emptyIndex, num.toString(), isConfirm);
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
            for (let i = currentPin.length - 1; i >= 0; i--) {
              if (currentPin[i] !== "") {
                lastFilledIndex = i;
                break;
              }
            }
            if (lastFilledIndex !== -1) {
              const newPin = [...currentPin];
              newPin[lastFilledIndex] = "";
              setCurrentPin(newPin);
              document
                .getElementById(
                  `${isConfirm ? "confirm-" : ""}pin-${lastFilledIndex}`
                )
                ?.focus();
            }
          }}
          className="h-14 text-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          disabled={loading}
        >
          ←
        </button>
        <button
          onClick={() => {
            const emptyIndex = currentPin.findIndex((d) => d === "");
            if (emptyIndex !== -1) {
              handlePinChange(emptyIndex, "0", isConfirm);
            }
          }}
          className="h-14 text-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          disabled={loading}
        >
          0
        </button>
        <button
          onClick={() => {
            setCurrentPin(["", "", "", "", "", ""]);
            document
              .getElementById(`${isConfirm ? "confirm-" : ""}pin-0`)
              ?.focus();
          }}
          className="h-14 text-sm font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          disabled={loading}
        >
          Clear
        </button>
      </div>
    );
  };

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
            {step === "enter" ? "Set Payment PIN" : "Confirm Your PIN"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === "enter"
              ? "Create a 4-6 digit PIN to secure your payments"
              : "Re-enter your PIN to confirm"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            <div className="w-8 h-1 bg-blue-600 rounded"></div>
            <div
              className={`w-8 h-1 rounded ${
                step === "confirm" ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>
          </div>
        </div>

        {/* PIN Input */}
        <div className="mb-6">
          {step === "enter" ? renderPinInputs(false) : renderPinInputs(true)}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Numeric Keypad */}
        {step === "enter"
          ? renderNumericKeypad(false)
          : renderNumericKeypad(true)}

        {/* Action Buttons */}
        <div className="space-y-3">
          {step === "enter" ? (
            <button
              onClick={handleNext}
              disabled={loading || pin.some((d) => d === "")}
              className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          ) : (
            <>
              <button
                onClick={handleSubmit}
                disabled={loading || confirmPin.some((d) => d === "")}
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting PIN...
                  </div>
                ) : (
                  "Confirm PIN"
                )}
              </button>
              <button
                onClick={handleBack}
                disabled={loading}
                className="w-full h-12 text-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </>
          )}
        </div>

        {/* Security Note */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-6">
          🔒 Your PIN is encrypted and secure. Never share it with anyone.
        </p>
      </div>
    </div>
  );
}

export default function SetupPinPage() {
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
      <SetupPinContent />
    </Suspense>
  );
}
