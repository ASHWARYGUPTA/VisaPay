"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Badge } from "@repo/ui/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface MoneyRequest {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  fromUser: {
    name: string | null;
    email: string | null;
    username: string | null;
  };
  toUser: {
    name: string | null;
    email: string | null;
    username: string | null;
  };
}

interface RequestedPaymentsComponentProps {
  onPaymentComplete?: () => void;
}

export function RequestedPaymentsComponent({
  onPaymentComplete,
}: RequestedPaymentsComponentProps) {
  const [requests, setRequests] = useState<{
    sent: MoneyRequest[];
    received: MoneyRequest[];
  }>({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MoneyRequest | null>(
    null
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/transactions/request");
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100); // Convert paise to rupees
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        variant: "default" as const,
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      },
      ACCEPTED: {
        variant: "secondary" as const,
        className:
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      },
      REJECTED: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      },
      EXPIRED: {
        variant: "outline" as const,
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      },
      CANCELLED: {
        variant: "outline" as const,
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toLowerCase()}
      </Badge>
    );
  };

  const handlePayRequest = async (request: MoneyRequest) => {
    setSelectedRequest(request);
    setShowConfirmDialog(true);
    setError(null);
  };

  const confirmPayment = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment session
      const sessionResponse = await fetch("/api/payment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType: "SEND_MONEY",
          amount: selectedRequest.amount,
          toUserIdentifier:
            selectedRequest.fromUser.email || selectedRequest.fromUser.username,
          description:
            selectedRequest.description ||
            `Payment for request: ${selectedRequest.id}`,
          metadata: {
            requestId: selectedRequest.id,
            isRequestPayment: true,
          },
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || "Failed to create payment session");
      }

      const sessionData = await sessionResponse.json();

      // Debug logging
      console.log("Session created:", sessionData);

      // Validate response structure
      if (!sessionData.session?.sessionToken) {
        throw new Error("Invalid session response - missing sessionToken");
      }

      // Redirect to payment confirmation with PIN
      // The request will be marked as accepted after successful payment confirmation
      router.push(
        `/payment/confirm?session=${sessionData.session.sessionToken}&requestId=${selectedRequest.id}`
      );
    } catch (error: any) {
      console.error("Payment error:", error);
      setError(error.message || "Failed to process payment");
      setProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/transactions/request/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "reject",
        }),
      });

      if (response.ok) {
        await fetchRequests();
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/transactions/request/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchRequests();
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingReceivedRequests = requests.received.filter(
    (req) => req.status === "PENDING"
  );

  return (
    <>
      {/* Received Payment Requests (Requests to Pay) */}
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-[#1451CB] dark:text-white">
            Payment Requests
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Requests from others asking you to send money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingReceivedRequests.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No pending payment requests
              </p>
            ) : (
              pendingReceivedRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 md:p-5 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:-translate-y-0.5 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#F3C851] to-[#e6a540] shadow-lg shadow-[#F3C851]/30 flex-shrink-0 transition-transform hover:scale-110">
                        <span className="text-lg md:text-xl font-bold text-white">
                          {(
                            (request.fromUser.name ||
                              request.fromUser.username ||
                              "U")[0] || "U"
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          From{" "}
                          {request.fromUser.name ||
                            request.fromUser.username ||
                            request.fromUser.email}
                        </p>
                        <p className="text-base md:text-lg font-bold text-[#F3C851] mt-1">
                          {formatCurrency(request.amount, request.currency)}
                        </p>
                        {request.description && (
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                            {request.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(request.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handlePayRequest(request)}
                        size="sm"
                        className="bg-gradient-to-br from-[#1451CB] to-[#1434CB] hover:from-[#1451CB]/90 hover:to-[#1434CB]/90 text-white shadow-md hover:shadow-lg transition-all text-xs whitespace-nowrap"
                      >
                        Pay Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        className="text-xs whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Confirm Payment
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Review the payment details before proceeding
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Amount
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(
                      selectedRequest.amount,
                      selectedRequest.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    To
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest.fromUser.name ||
                      selectedRequest.fromUser.username ||
                      selectedRequest.fromUser.email}
                  </span>
                </div>
                {selectedRequest.description && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Description
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {selectedRequest.description}
                    </span>
                  </div>
                )}
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You&apos;ll be asked to enter your PIN to complete this payment.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setError(null);
              }}
              disabled={processing}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={processing}
              className="bg-gradient-to-br from-[#1451CB] to-[#1434CB] hover:from-[#1451CB]/90 hover:to-[#1434CB]/90 text-white"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
