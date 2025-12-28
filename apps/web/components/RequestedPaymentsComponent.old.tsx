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
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PENDING: "default",
      ACCEPTED: "secondary",
      REJECTED: "destructive",
      EXPIRED: "outline",
      CANCELLED: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
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
            {pendingReceivedRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending payment requests
              </p>
            ) : (
              <div className="space-y-4">
                {pendingReceivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                          <span className="text-lg font-semibold text-blue-600 dark:text-blue-300">
                            {(
                              (request.fromUser.name ||
                                request.fromUser.username ||
                                "U")[0] || "U"
                            ).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {request.fromUser.name ||
                              request.fromUser.username ||
                              request.fromUser.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(request.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(request.amount, request.currency)}
                        </p>
                        {request.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.description}
                          </p>
                        )}
                        {request.message && (
                          <p className="text-sm italic mt-1">
                            &quot;{request.message}&quot;
                          </p>
                        )}
                        {request.expiresAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Expires{" "}
                            {formatDistanceToNow(new Date(request.expiresAt), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePayRequest(request)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Pay Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Payment Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Your Requests</CardTitle>
            <CardDescription>
              Money requests you&apos;ve sent to others
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.sent.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No payment requests sent
              </p>
            ) : (
              <div className="space-y-4">
                {requests.sent.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900">
                          <span className="text-lg font-semibold text-purple-600 dark:text-purple-300">
                            {(
                              (request.toUser.name ||
                                request.toUser.username ||
                                "U")[0] || "U"
                            ).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {request.toUser.name ||
                              request.toUser.username ||
                              request.toUser.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(request.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-2xl font-bold">
                          {formatCurrency(request.amount, request.currency)}
                        </p>
                        {request.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.description}
                          </p>
                        )}
                        <div className="mt-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </div>
                    {request.status === "PENDING" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Review the payment details before proceeding
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-accent rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(
                      selectedRequest.amount,
                      selectedRequest.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="font-semibold">
                    {selectedRequest.fromUser.name ||
                      selectedRequest.fromUser.username ||
                      selectedRequest.fromUser.email}
                  </span>
                </div>
                {selectedRequest.description && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Description
                    </span>
                    <span className="text-sm">
                      {selectedRequest.description}
                    </span>
                  </div>
                )}
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
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
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
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
