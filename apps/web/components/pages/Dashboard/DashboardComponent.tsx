"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import VisaLogo from "@repo/ui/VisaLogo";
import { ModeToggle } from "../../mode-toggler";
import { SendMoneyDialog } from "../../SendMoneyDialog";
import { RequestMoneyDialog } from "../../RequestMoneyDialog";
import { PinSetupPrompt } from "../../PinSetupPrompt";
import { RequestedPaymentsComponent } from "../../RequestedPaymentsComponent";

export default function DashboardComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [showRequestMoney, setShowRequestMoney] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinSetupSuccess, setPinSetupSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Check for PIN setup success
  useEffect(() => {
    const pinSetup = searchParams.get("pin");
    if (pinSetup === "setup-success") {
      setPinSetupSuccess(true);
      setHasPin(true);
      setTimeout(() => setPinSetupSuccess(false), 5000);
    }
  }, [searchParams]);

  // Check if user has PIN
  useEffect(() => {
    const checkPin = async () => {
      try {
        const response = await fetch("/api/pin");
        if (response.ok) {
          const data = await response.json();
          setHasPin(data.hasPin);

          // Show prompt only if user doesn't have PIN and hasn't dismissed it
          if (
            !data.hasPin &&
            localStorage.getItem("dismissedPinPrompt") !== "true"
          ) {
            // Show prompt after a short delay
            setTimeout(() => setShowPinPrompt(true), 1000);
          }
        }
      } catch (error) {
        console.error("Error checking PIN:", error);
      }
    };

    if (session) {
      checkPin();
    }
  }, [session]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions/history?limit=10");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch real transactions
        await fetchTransactions();

        // Fetch real user balance
        const balanceResponse = await fetch("/api/user/balance");
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserData({
            currentBalance: balanceData.balance.currentBalance,
            recentPayments: [],
            stats: {
              totalSent: balanceData.balance.stats.totalSent,
              totalReceived: balanceData.balance.stats.totalReceived,
              pendingPayments:
                balanceData.balance.stats.pendingRequests +
                balanceData.balance.stats.pendingIncoming,
            },
          });
        } else {
          // Fallback to default values if API fails
          setUserData({
            currentBalance: 0,
            recentPayments: [],
            stats: {
              totalSent: 0,
              totalReceived: 0,
              pendingPayments: 0,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Set default values on error
        setUserData({
          currentBalance: 0,
          recentPayments: [],
          stats: {
            totalSent: 0,
            totalReceived: 0,
            pendingPayments: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session]);

  const handleTransactionSuccess = async () => {
    await fetchTransactions();

    // Refresh user balance after transaction
    if (session) {
      try {
        const balanceResponse = await fetch("/api/user/balance");
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserData({
            currentBalance: balanceData.balance.currentBalance,
            recentPayments: [],
            stats: {
              totalSent: balanceData.balance.stats.totalSent,
              totalReceived: balanceData.balance.stats.totalReceived,
              pendingPayments:
                balanceData.balance.stats.pendingRequests +
                balanceData.balance.stats.pendingIncoming,
            },
          });
        }
      } catch (error) {
        console.error("Error refreshing balance:", error);
      }
    }
  };

  const handleSendMoneyClick = () => {
    if (!hasPin) {
      setShowPinPrompt(true);
    } else {
      setShowSendMoney(true);
    }
  };

  const handleRequestMoneyClick = () => {
    if (!hasPin) {
      setShowPinPrompt(true);
    } else {
      setShowRequestMoney(true);
    }
  };

  const handlePinPromptDismiss = () => {
    setShowPinPrompt(false);
    localStorage.setItem("dismissedPinPrompt", "true");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C8CFF3] to-[#1434CB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8CFF3] to-[#1434CB]">
      {/* Header - Similar to Landing Page Navbar */}
      <header className="h-auto mt-2 mx-1 bg-[#ffffff7e] dark:bg-[#00000040] backdrop-blur-md rounded-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[65px] flex items-center justify-between">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => router.push("/")}>
              <div className="hidden sm:block">
                <VisaLogo heightN={120} widthN={120} />
              </div>
              <div className="sm:hidden">
                <VisaLogo heightN={100} widthN={100} />
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center gap-3">
              {/* PIN Status Indicator */}
              {hasPin !== null && (
                <div
                  className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium ${
                    hasPin
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                  }`}
                  onClick={() => !hasPin && setShowPinPrompt(true)}
                >
                  {hasPin ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      PIN Active
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Setup PIN
                    </>
                  )}
                </div>
              )}

              <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {session?.user?.name || "User"}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {session?.user?.email}
                </span>
              </div>
              <ModeToggle />
              <Button
                className="h-[45px] px-6 rounded-3xl text-[15px] bg-[#1451CB] hover:bg-[#1451CB]/90 text-white"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-12">
        {/* Welcome Message */}
        <div className="mb-8 md:mb-10 text-center md:text-left mt-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Welcome back, {session?.user?.name || "User"}!
          </h1>
          <p className="text-white/90 text-base md:text-lg font-medium">
            Manage your payments and transactions seamlessly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-2">
          {/* Left Column - Balance Card */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-[#C8CFF3] to-[#1434CB] text-white border-0 shadow-2xl rounded-3xl hover:shadow-[0_20px_50px_rgba(20,52,203,0.5)] transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-2xl">
                  Current Balance
                </CardTitle>
                <CardDescription className="text-white/90 text-base">
                  Available funds in your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className="text-5xl md:text-6xl font-bold"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  {formatCurrency(userData?.currentBalance || 0)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleSendMoneyClick}
                    className="bg-[#F3C851] hover:bg-[#F3C851]/90 text-gray-900 font-semibold rounded-3xl h-14 text-base"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send Money
                  </Button>
                  <Button
                    onClick={handleRequestMoneyClick}
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-3xl h-14 text-base font-semibold"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    Request Money
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-[#1451CB] dark:text-white text-xl">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button className="h-20 flex-col gap-2 bg-gradient-to-br from-[#1451CB] to-[#1434CB] hover:from-[#1451CB]/90 hover:to-[#1434CB]/90 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs font-semibold">Add Money</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-gradient-to-br from-[#F3C851] to-[#e6a540] hover:from-[#F3C851]/90 hover:to-[#e6a540]/90 text-gray-900 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="text-xs font-semibold">Pay Bills</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#1451CB] dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
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
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs font-semibold">Withdraw</span>
                </Button>
                <Button className="h-20 flex-col gap-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#1451CB] dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="text-xs font-semibold">Analytics</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-8">
          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Total Sent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div
                className="text-3xl md:text-2xl font-bold text-[#1451CB]"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                {formatCurrency(userData?.stats.totalSent || 0)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Total Received
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div
                className="text-3xl md:text-2xl font-bold text-[#F3C851]"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                {formatCurrency(userData?.stats.totalReceived || 0)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div
                className="text-3xl md:text-2xl font-bold text-[#1451CB]"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                {userData?.stats.pendingPayments || 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions and Payment Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8">
          {/* Recent Transactions */}
          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-[#1451CB] dark:text-white">
                Recent Transactions
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your latest payment activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((transaction: any) => {
                    const isReceived =
                      transaction.toUserId === (session?.user as any)?.id;
                    const amount = isReceived
                      ? transaction.amount
                      : -transaction.amount;
                    const otherUser = isReceived
                      ? transaction.fromUser
                      : transaction.toUser;

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 md:p-5 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:-translate-y-0.5 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div
                            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                              isReceived
                                ? "bg-gradient-to-br from-[#F3C851] to-[#e6a540] shadow-lg shadow-[#F3C851]/30"
                                : "bg-gradient-to-br from-[#1451CB] to-[#1434CB] shadow-lg shadow-[#1451CB]/30"
                            }`}
                          >
                            {isReceived ? (
                              <svg
                                className="w-5 h-5 md:w-6 md:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 md:w-6 md:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {isReceived ? "From" : "To"}{" "}
                              {otherUser.name ||
                                otherUser.username ||
                                otherUser.email}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {transaction.description || "No description"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p
                            className={`font-bold text-base md:text-lg ${
                              isReceived ? "text-[#F3C851]" : "text-[#1451CB]"
                            }`}
                            style={{ fontFamily: "Courier Prime, monospace" }}
                          >
                            {isReceived ? "+" : "-"}
                            {formatCurrency(Math.abs(amount))}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-semibold">
                            {transaction.status.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>
              {transactions.length > 0 && (
                <Button className="w-full mt-4 bg-[#1451CB] hover:bg-[#1451CB]/90 text-white rounded-xl h-12">
                  View All Transactions
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment Requests */}
          <div>
            <RequestedPaymentsComponent
              onPaymentComplete={handleTransactionSuccess}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button className="h-24 flex-col gap-2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 text-[#1451CB] dark:text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="font-semibold">Add Money</span>
          </Button>
          <Button className="h-24 flex-col gap-2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 text-[#1451CB] dark:text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span className="font-semibold">Pay Bills</span>
          </Button>
          <Button className="h-24 flex-col gap-2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 text-[#1451CB] dark:text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
            <span className="font-semibold">Withdraw</span>
          </Button>
          <Button className="h-24 flex-col gap-2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 text-[#1451CB] dark:text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="font-semibold">Analytics</span>
          </Button>
        </div>
      </main>

      {/* PIN Setup Success Message */}
      {pinSetupSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold">PIN Setup Successful!</p>
              <p className="text-sm">You can now make secure payments</p>
            </div>
          </div>
        </div>
      )}

      {/* PIN Setup Prompt */}
      {showPinPrompt && <PinSetupPrompt onDismiss={handlePinPromptDismiss} />}

      {/* Dialogs */}
      {showSendMoney && (
        <SendMoneyDialog
          onClose={() => setShowSendMoney(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}
      {showRequestMoney && (
        <RequestMoneyDialog
          onClose={() => setShowRequestMoney(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </div>
  );
}
