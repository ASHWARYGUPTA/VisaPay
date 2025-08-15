"use client";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { prisma } from "@repo/db";
import { useState } from "react";

export default function SignUpBoxComponent() {
  const searchParams = useSearchParams();
  const [formIsCorrect, useFormIsCorrect] = useState(false);
  const errorParams = searchParams.get("error");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = async (data: any) => {
    try {
      const res = await signIn("credentials", {
        username: data.email,
        password: data.password,
        callbackUrl: "/signin",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onChangeEmail = async (data: any) => {
    const email = data.email;

    const isThere = await prisma.user.count({
      where: {
        email: email,
      },
    });
  };
  return (
    <>
      <div className={cn("flex flex-col gap-2")}>
        <Card className="w-[400px] md:w-[500px] mt-[80px] backdrop-blur-md bg-white/10 border border-white/30 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Sign Up to VisaPay
            </CardTitle>
            <CardDescription>
              Sign up with your Credentials or Google account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorParams && (
              <p className="text-red-500 text-sm text-center mb-2">
                {errorParams}
              </p>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      {...register("email", { required: "Email is required" })}
                      onChange={async () => {}}
                    />
                    {errors.email && (
                      <span className="text-red-500 text-xs">
                        {errors.email.message as string}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter Your Name"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && (
                      <span className="text-red-500 text-xs">
                        {errors.name.message as string}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      {...register("password", {
                        required: "Password is required",
                      })}
                    />
                    {errors.password && (
                      <span className="text-red-500 text-xs">
                        {errors.password.message as string}
                      </span>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    SignUp
                  </Button>
                </div>
              </div>
              <div className="my-2 after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-auto text-muted-foreground relative z-10 px-2"></span>
              </div>
              <div className="flex flex-col gap-4">
                <Button variant="default" className="w-full mb-4 bg-[#4285F4] ">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="#" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          By clicking continue, you agree to our{" "}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </>
  );
}
